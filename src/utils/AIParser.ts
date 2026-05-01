// src/utils/AIParser.ts
import { Schedule } from '../types';

// 「明日の朝9時にジム1時間」→ Schedule に変換するシンプルパーサー
// Phase2でClaude APIに差し替える前提のローカル実装

const TODAY = new Date();

function getDateStr(offset: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

// 日付キーワードマップ
const DATE_MAP: Record<string, number> = {
  '今日': 0, '本日': 0,
  '明日': 1, '明日の': 1,
  '明後日': 2,
  '来週': 7,
};

// 時間キーワードマップ
const TIME_MAP: Record<string, string> = {
  '朝': '07:00', '朝の': '07:00', '午前': '09:00',
  '昼': '12:00', '昼の': '12:00', 'ランチ': '12:00',
  '夕方': '17:00', '夕': '17:00',
  '夜': '20:00', '夜の': '20:00', '晩': '20:00',
};

// 優先度キーワード
const PRIORITY_MAP: Record<string, Schedule['priority']> = {
  '重要': '高', '急ぎ': '高', '必ず': '高', '絶対': '高',
  '普通': '中',
  '暇': '低', '余裕': '低',
};

/**
 * 自然言語テキストをScheduleオブジェクトに変換
 * 例: "明日の朝9時にジム" → { date: '2025-xx-xx', time: '09:00', title: 'ジム', priority: '中' }
 */
export function parseScheduleFromText(text: string): Partial<Schedule> {
  const result: Partial<Schedule> = {
    priority: '中',
    reminders: [10],
  };

  // ─── 日付 ─────────────────────────────────────────────
  for (const [keyword, offset] of Object.entries(DATE_MAP)) {
    if (text.includes(keyword)) {
      result.date = getDateStr(offset);
      break;
    }
  }
  if (!result.date) result.date = getDateStr(0); // デフォルト今日

  // ─── 時刻（HH:MM形式） ───────────────────────────────
  const timeMatch = text.match(/(\d{1,2})[：:時](\d{0,2})/);
  if (timeMatch) {
    const h = timeMatch[1].padStart(2, '0');
    const m = (timeMatch[2] || '00').padStart(2, '0');
    result.time = `${h}:${m}`;
  } else {
    // キーワードから推定
    for (const [keyword, time] of Object.entries(TIME_MAP)) {
      if (text.includes(keyword)) {
        result.time = time;
        break;
      }
    }
  }
  if (!result.time) result.time = '';

  // ─── 優先度 ──────────────────────────────────────────
  for (const [keyword, priority] of Object.entries(PRIORITY_MAP)) {
    if (text.includes(keyword)) {
      result.priority = priority;
      break;
    }
  }

  // ─── タイトル（日時・修飾語を除去した残り） ───────────
  let title = text;
  // 日付キーワード除去
  Object.keys(DATE_MAP).forEach(k => { title = title.replace(k, ''); });
  // 時刻表現除去
  title = title.replace(/(\d{1,2})[：:時](\d{0,2})/, '');
  Object.keys(TIME_MAP).forEach(k => { title = title.replace(k, ''); });
  // 助詞・余分な文字除去
  title = title.replace(/[にでをはがの、。\s]+/g, ' ').trim();
  // 優先度キーワード除去
  Object.keys(PRIORITY_MAP).forEach(k => { title = title.replace(k, ''); });

  result.title = title || 'スケジュール';

  return result;
}

/**
 * 使い方:
 * const parsed = parseScheduleFromText("明日の朝9時にジム");
 * → { date: '2025-xx-xx', time: '09:00', title: 'ジム', priority: '中', reminders: [10] }
 */