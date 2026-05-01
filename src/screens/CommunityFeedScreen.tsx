import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSchedules } from '../context/ScheduleContext';

const C = {
  bg:'#07070F', surface:'#0D0D1A', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', pink:'#EC4899',
  green:'#10B981', yellow:'#F59E0B', red:'#EF4444',
  text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

const MOCK_FRIENDS = [
  { id:'1', name:'Yuki',  initial:'Y', color:'#7C3AED', status:'active',  streak:42,  score:9840,  activity:'🏃 ランニング中',   posted:true,  done:2, total:3 },
  { id:'2', name:'Keita', initial:'K', color:'#EC4899', status:'active',  streak:7,   score:3210,  activity:'💻 コーディング中', posted:false, done:1, total:3 },
  { id:'3', name:'Sora',  initial:'S', color:'#F59E0B', status:'idle',    streak:128, score:28400, activity:undefined,           posted:true,  done:3, total:3 },
  { id:'4', name:'Hana',  initial:'H', color:'#10B981', status:'offline', streak:3,   score:890,   activity:undefined,           posted:false, done:0, total:3 },
  { id:'5', name:'Ren',   initial:'R', color:'#06B6D4', status:'active',  streak:21,  score:6600,  activity:'📚 勉強中',         posted:true,  done:2, total:3 },
];

const MOCK_CHALLENGES = [
  { id:'1', creatorName:'Yuki', creatorColor:'#7C3AED', creatorInitial:'Y',
    title:'今週5日ジムに行く', description:'月〜金、毎日ジム！', targetDate:'2026-03-08',
    pointAmount:200, stakersFor:3, stakersAgainst:1, status:'open', myStake:'for' as 'for' | 'against' | null },
  { id:'2', creatorName:'Sora', creatorColor:'#F59E0B', creatorInitial:'S',
    title:'30日間毎日瞑想', description:'朝6時に10分間の瞑想を続ける', targetDate:'2026-04-01',
    pointAmount:500, stakersFor:5, stakersAgainst:2, status:'open', myStake: null as 'for' | 'against' | null },
];

type CommTab = 'live' | 'ranking' | 'challenge';

// ─── Avatar ───────────────────────────────────────────────────

function Avatar({ initial, color, size = 44, status }: {
  initial: string; color: string; size?: number; status?: string;
}) {
  const dot = status === 'active' ? C.green : status === 'idle' ? C.yellow : C.muted;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initial}</Text>
      </View>
      {status && (
        <View style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: 99,
          backgroundColor: dot, borderWidth: 2, borderColor: C.bg,
        }} />
      )}
    </View>
  );
}

function StreakBadge({ n }: { n: number }) {
  const bg = n >= 30 ? C.yellow : n >= 7 ? C.accent : C.muted;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>🔥 {n}</Text>
    </View>
  );
}

// ─── LiveTab ──────────────────────────────────────────────────

function LiveTab() {
  const groups = [
    { label:'🟢 アクティブ', color:C.green,  items: MOCK_FRIENDS.filter(f => f.status === 'active') },
    { label:'🌙 アイドル',   color:C.yellow, items: MOCK_FRIENDS.filter(f => f.status === 'idle') },
    { label:'⚫ オフライン', color:C.muted,  items: MOCK_FRIENDS.filter(f => f.status === 'offline') },
  ];
  return (
    <View>
      {groups.map(g => g.items.length === 0 ? null : (
        <View key={g.label} style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionLabel, { color: g.color }]}>{g.label} — {g.items.length}人</Text>
          {g.items.map(f => {
            const pct = Math.round(f.done / f.total * 100);
            return (
              <View key={f.id} style={styles.friendCard}>
                <Avatar initial={f.initial} color={f.color} size={46} status={f.status} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <Text style={styles.friendName}>{f.name}</Text>
                    <StreakBadge n={f.streak} />
                    {!f.posted && (
                      <View style={styles.notPostedTag}>
                        <Text style={styles.notPostedTagText}>未投稿</Text>
                      </View>
                    )}
                  </View>
                  {f.activity
                    ? <Text style={[styles.activityText, { color: f.color }]}>{f.activity}</Text>
                    : <Text style={styles.offlineText}>オフライン</Text>
                  }
                  <View style={{ marginTop:8, height:3, backgroundColor:C.border, borderRadius:99 }}>
                    <View style={{ width:`${pct}%`, height:'100%', borderRadius:99, backgroundColor:f.color }} />
                  </View>
                  <Text style={styles.progressText}>{f.done}/{f.total} 完了</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── RankingTab ───────────────────────────────────────────────

function RankingTab({ myScore, myStreak }: { myScore: number; myStreak: number }) {
  const { ghostData } = useSchedules();
  const me  = { id:'0', name:'あなた', initial:'Me', color:C.accent, streak:myStreak, score:myScore };
  const all = [me, ...MOCK_FRIENDS].sort((a, b) => b.score - a.score);
  const myRank = all.findIndex(u => u.id === '0') + 1;

  // ゴーストデータ（今週 vs 先週）
  const today     = new Date().toISOString().split('T')[0];
  const lastWeek  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thisWeekScore = ghostData.find(d => d.date === today)?.score ?? myScore;
  const lastWeekScore = ghostData.find(d => d.date === lastWeek)?.score ?? 0;
  const ghostDiff = thisWeekScore - lastWeekScore;

  return (
    <View>
      {/* ゴーストチャレンジカード */}
      <View style={styles.ghostCard}>
        <Text style={styles.ghostTitle}>👻 ゴーストチャレンジ</Text>
        <Text style={styles.ghostSub}>先週の自分との対決</Text>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12 }}>
          <View style={styles.ghostSide}>
            <Text style={styles.ghostLabel}>今週</Text>
            <Text style={styles.ghostScore}>{thisWeekScore.toLocaleString()}</Text>
          </View>
          <View style={styles.ghostVs}>
            <Text style={styles.ghostVsText}>VS</Text>
          </View>
          <View style={[styles.ghostSide, { alignItems:'flex-end' }]}>
            <Text style={styles.ghostLabel}>先週</Text>
            <Text style={[styles.ghostScore, { color: C.muted }]}>{lastWeekScore.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.ghostDiff, { backgroundColor: ghostDiff >= 0 ? C.green + '22' : C.red + '22' }]}>
          <Text style={[styles.ghostDiffText, { color: ghostDiff >= 0 ? C.green : C.red }]}>
            {ghostDiff >= 0 ? `+${ghostDiff}` : ghostDiff} pt {ghostDiff >= 0 ? '🚀 勝ってる！' : '😅 負けてる…'}
          </Text>
        </View>
      </View>

      {/* 自分の順位 */}
      <View style={styles.myRankCard}>
        <View>
          <Text style={styles.myRankLabel}>今週の順位</Text>
          <View style={{ flexDirection:'row', alignItems:'flex-end', gap:6, marginTop:4 }}>
            <Text style={styles.myRankNum}>#{myRank}</Text>
            <Text style={[styles.myRankLabel, { paddingBottom:4 }]}>/ {all.length}人</Text>
          </View>
        </View>
        <View style={{ alignItems:'flex-end' }}>
          <Text style={styles.myRankScore}>{myScore.toLocaleString()}</Text>
          <Text style={styles.myRankLabel}>pt</Text>
          {myRank > 1 && (
            <Text style={[styles.myRankLabel, { color:C.yellow, marginTop:4 }]}>
              1位まで あと {all[0].score - myScore} pt
            </Text>
          )}
        </View>
      </View>

      {all.map((u, i) => {
        const isMe  = u.id === '0';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        return (
          <View key={u.id} style={[styles.rankRow, isMe && styles.rankRowMe]}>
            <Text style={styles.rankMedal}>{medal}</Text>
            <View style={{
              width:36, height:36, borderRadius:18,
              backgroundColor:u.color, alignItems:'center', justifyContent:'center',
            }}>
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:13 }}>{u.initial}</Text>
            </View>
            <View style={{ flex:1, marginLeft:10, gap:4 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <Text style={[styles.rankName, isMe && { color:C.accentSoft }]}>{u.name}</Text>
                {isMe && (
                  <View style={{ backgroundColor:C.accent, borderRadius:4, paddingHorizontal:5, paddingVertical:1 }}>
                    <Text style={{ color:'#fff', fontSize:9, fontWeight:'700' }}>YOU</Text>
                  </View>
                )}
              </View>
              <StreakBadge n={u.streak} />
            </View>
            <Text style={styles.rankScore}>{u.score.toLocaleString()} pt</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── ChallengeTab ─────────────────────────────────────────────

function ChallengeTab() {
  const [showCreate,   setShowCreate]   = useState(false);
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [points,       setPoints]       = useState('100');

  return (
    <View>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(!showCreate)}>
        <Text style={styles.createBtnText}>{showCreate ? 'キャンセル' : '+ 新しい宣言を作る'}</Text>
      </TouchableOpacity>

      {showCreate && (
        <View style={styles.createForm}>
          <Text style={styles.formLabel}>宣言タイトル</Text>
          <TextInput style={styles.formInput} value={title} onChangeText={setTitle}
            placeholder="例：今週5日ジムに行く" placeholderTextColor={C.muted} />
          <Text style={[styles.formLabel, { marginTop:10 }]}>詳細</Text>
          <TextInput style={styles.formInput} value={description} onChangeText={setDescription}
            placeholder="詳しい内容を書こう" placeholderTextColor={C.muted} />
          <Text style={[styles.formLabel, { marginTop:10 }]}>賭けポイント</Text>
          <TextInput style={styles.formInput} value={points} onChangeText={setPoints}
            keyboardType="numeric" placeholderTextColor={C.muted} />
          <TouchableOpacity style={styles.submitBtn}
            onPress={() => { setShowCreate(false); setTitle(''); setDescription(''); setPoints('100'); }}>
            <Text style={styles.submitBtnText}>宣言する 🔥</Text>
          </TouchableOpacity>
        </View>
      )}

      {MOCK_CHALLENGES.map(c => (
        <View key={c.id} style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={{ width:32, height:32, borderRadius:16, backgroundColor:c.creatorColor, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:12 }}>{c.creatorInitial}</Text>
            </View>
            <View style={{ flex:1, marginLeft:8 }}>
              <Text style={styles.challengeCreator}>{c.creatorName}の宣言</Text>
              <Text style={styles.challengeDeadline}>期限: {c.targetDate}</Text>
            </View>
            <View style={styles.challengePts}>
              <Text style={styles.challengePtsText}>{c.pointAmount} pt</Text>
            </View>
          </View>
          <Text style={styles.challengeTitle}>{c.title}</Text>
          <Text style={styles.challengeDesc}>{c.description}</Text>
          <View style={{ marginTop:10 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
              <Text style={{ fontSize:11, color:C.green }}>✅ 達成する {c.stakersFor}人</Text>
              <Text style={{ fontSize:11, color:C.red }}>❌ 失敗する {c.stakersAgainst}人</Text>
            </View>
            <View style={{ height:4, backgroundColor:C.border, borderRadius:99, overflow:'hidden' }}>
              <View style={{
                width:`${c.stakersFor / (c.stakersFor + c.stakersAgainst) * 100}%`,
                height:'100%', backgroundColor:C.green, borderRadius:99,
              }} />
            </View>
          </View>
          {c.myStake === null ? (
            <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
              <TouchableOpacity style={[styles.stakeBtn, { borderColor:C.green }]}>
                <Text style={[styles.stakeBtnText, { color:C.green }]}>✅ 達成すると思う</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.stakeBtn, { borderColor:C.red }]}>
                <Text style={[styles.stakeBtnText, { color:C.red }]}>❌ 失敗すると思う</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.myStakeBadge}>
              <Text style={styles.myStakeBadgeText}>
                {c.myStake === 'for' ? '✅ 達成に賭けた' : '❌ 失敗に賭けた'}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────

export default function CommunityFeedScreen() {
  const { userProfile } = useSchedules();
  const [tab,        setTab]        = useState<CommTab>('live');
  const [refreshing, setRefreshing] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={C.accent}
          onRefresh={async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 800)); setRefreshing(false); }}
        />
      }
    >
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerTitle}>コミュニティ</Text>
          <Text style={styles.headerSub}>{MOCK_FRIENDS.length}人のフレンドと成長中</Text>
        </View>
        <TouchableOpacity style={styles.addFriendBtn}>
          <Icon name="user-plus" size={14} color={C.accentSoft} />
          <Text style={styles.addFriendText}>追加</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {([
          ['live',      '🟢 ライブ'],
          ['ranking',   '🏆 ランキング'],
          ['challenge', '⚔️ 賭け'],
        ] as [CommTab, string][]).map(([v, label]) => (
          <TouchableOpacity
            key={v}
            style={[styles.tabBtn, tab === v && styles.tabBtnActive]}
            onPress={() => setTab(v)}
          >
            <Text style={[styles.tabText, tab === v && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'live'      && <LiveTab />}
      {tab === 'ranking'   && <RankingTab myScore={userProfile?.score ?? 0} myStreak={userProfile?.streak ?? 0} />}
      {tab === 'challenge' && <ChallengeTab />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:C.bg },
  content:           { padding:16, paddingBottom:40 },
  headerCard:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:C.card, borderRadius:16, padding:16, marginBottom:14, borderWidth:1, borderColor:C.border },
  headerTitle:       { fontSize:20, fontWeight:'800', color:C.text },
  headerSub:         { fontSize:12, color:C.sub, marginTop:2 },
  addFriendBtn:      { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#7C3AED18', borderWidth:1, borderColor:'#7C3AED44', borderRadius:10, paddingHorizontal:12, paddingVertical:8 },
  addFriendText:     { fontSize:12, fontWeight:'700', color:C.accentSoft },
  tabRow:            { flexDirection:'row', backgroundColor:C.card, borderRadius:12, padding:4, marginBottom:18, borderWidth:1, borderColor:C.border },
  tabBtn:            { flex:1, paddingVertical:10, alignItems:'center', borderRadius:9 },
  tabBtnActive:      { backgroundColor:C.accent },
  tabText:           { fontSize:12, fontWeight:'600', color:C.muted },
  tabTextActive:     { color:'#fff' },
  sectionLabel:      { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:10 },
  friendCard:        { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:8, borderWidth:1, borderColor:C.border },
  friendName:        { fontSize:14, fontWeight:'700', color:C.text },
  activityText:      { fontSize:12, marginTop:1 },
  offlineText:       { fontSize:12, color:C.muted, marginTop:1 },
  progressText:      { fontSize:10, color:C.muted, marginTop:3 },
  notPostedTag:      { backgroundColor:'#EF444420', borderRadius:5, paddingHorizontal:5, paddingVertical:1 },
  notPostedTagText:  { fontSize:9, color:C.red, fontWeight:'700' },
  ghostCard:         { backgroundColor:'#7C3AED10', borderWidth:1, borderColor:'#7C3AED40', borderRadius:16, padding:16, marginBottom:14 },
  ghostTitle:        { fontSize:15, fontWeight:'800', color:C.text },
  ghostSub:          { fontSize:12, color:C.sub, marginTop:2 },
  ghostSide:         { alignItems:'flex-start' },
  ghostLabel:        { fontSize:11, color:C.sub, textTransform:'uppercase', letterSpacing:1 },
  ghostScore:        { fontSize:28, fontWeight:'900', color:C.accentSoft, marginTop:2 },
  ghostVs:           { alignItems:'center', justifyContent:'center' },
  ghostVsText:       { fontSize:16, fontWeight:'900', color:C.muted },
  ghostDiff:         { borderRadius:10, padding:10, marginTop:12, alignItems:'center' },
  ghostDiffText:     { fontSize:14, fontWeight:'800' },
  myRankCard:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#7C3AED18', borderWidth:1, borderColor:'#7C3AED44', borderRadius:16, padding:18, marginBottom:14 },
  myRankLabel:       { fontSize:12, color:C.sub },
  myRankNum:         { fontSize:38, fontWeight:'900', color:C.accentSoft },
  myRankScore:       { fontSize:22, fontWeight:'800', color:C.text },
  rankRow:           { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:12, padding:12, marginBottom:6, borderWidth:1, borderColor:C.border },
  rankRowMe:         { borderColor:'#7C3AED55', backgroundColor:'#7C3AED0E' },
  rankMedal:         { fontSize:18, width:30, textAlign:'center' },
  rankName:          { fontSize:14, fontWeight:'700', color:C.text },
  rankScore:         { fontSize:14, fontWeight:'700', color:C.text },
  createBtn:         { backgroundColor:'#7C3AED18', borderWidth:1, borderColor:'#7C3AED44', borderRadius:12, padding:14, alignItems:'center', marginBottom:14 },
  createBtnText:     { color:C.accentSoft, fontWeight:'700', fontSize:14 },
  createForm:        { backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:14, borderWidth:1, borderColor:C.border },
  formLabel:         { fontSize:11, fontWeight:'700', color:C.sub, textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  formInput:         { backgroundColor:C.bg, borderWidth:1, borderColor:C.border, borderRadius:10, padding:12, color:C.text, fontSize:14 },
  submitBtn:         { backgroundColor:C.accent, borderRadius:10, padding:13, alignItems:'center', marginTop:14 },
  submitBtnText:     { color:'#fff', fontWeight:'800', fontSize:14 },
  challengeCard:     { backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border },
  challengeHeader:   { flexDirection:'row', alignItems:'center', marginBottom:10 },
  challengeCreator:  { fontSize:12, fontWeight:'700', color:C.text },
  challengeDeadline: { fontSize:10, color:C.muted, marginTop:1 },
  challengePts:      { backgroundColor:'#7C3AED22', borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  challengePtsText:  { fontSize:12, fontWeight:'700', color:C.accentSoft },
  challengeTitle:    { fontSize:15, fontWeight:'800', color:C.text, marginBottom:4 },
  challengeDesc:     { fontSize:12, color:C.sub, lineHeight:18 },
  stakeBtn:          { flex:1, borderWidth:1, borderRadius:8, padding:8, alignItems:'center' },
  stakeBtnText:      { fontSize:11, fontWeight:'700' },
  myStakeBadge:      { marginTop:10, backgroundColor:'#7C3AED18', borderRadius:8, padding:8, alignItems:'center' },
  myStakeBadgeText:  { fontSize:12, fontWeight:'700', color:C.accentSoft },
});