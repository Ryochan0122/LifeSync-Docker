import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Schedule } from '../types';
import Icon from 'react-native-vector-icons/Feather';
import { useSchedules } from '../context/ScheduleContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;

const C = {
  bg:'#07070F', surface:'#0D0D1A', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', pink:'#EC4899',
  green:'#10B981', yellow:'#F59E0B', red:'#EF4444',
  text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
  prioHigh:'#E74C3C', prioMid:'#F39C12', prioLow:'#2ECC71',
};

const FRIEND_SCHEDULES = [
  { userId:'1', name:'Yuki',  avatarColor:'#7C3AED', initial:'Y', date: new Date().toISOString().split('T')[0], time:'09:00', title:'英語学習',   isPublic:true },
  { userId:'1', name:'Yuki',  avatarColor:'#7C3AED', initial:'Y', date: new Date().toISOString().split('T')[0], time:'19:00', title:'ジム',       isPublic:true },
  { userId:'5', name:'Ren',   avatarColor:'#06B6D4', initial:'R', date: new Date().toISOString().split('T')[0], time:'07:30', title:'英単語200個', isPublic:true },
];

const AI_SUGGESTIONS = [
  { id:'1', message:'15:00〜16:00 に空きあり。Yukiも同じ時間に勉強中。一緒に集中しませんか？', emoji:'🤖' },
];

function FriendAvatar({ color, initial, size = 24 }: {
  color: string; initial: string; size?: number;
}) {
  return (
    <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:color, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color:'#fff', fontWeight:'800', fontSize:size*0.38 }}>{initial}</Text>
    </View>
  );
}

// ─── 予定カード（達成ボタン付き）────────────────────────────

function ScheduleBlock({ schedule, onPress, onStart, onComplete }: {
  schedule: Schedule;
  onPress:    () => void;
  onStart:    () => void;
  onComplete: () => void;
}) {
  const color = schedule.priority === '高' ? C.prioHigh : schedule.priority === '中' ? C.prioMid : C.prioLow;
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.scheduleBlock, { borderLeftColor: color }]}
      onPress={() => setExpanded(!expanded)}
      onLongPress={onPress}
    >
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flex:1 }}>
          <Text style={styles.scheduleBlockTitle}>{schedule.title}</Text>
          {schedule.time ? <Text style={styles.scheduleBlockTime}>{schedule.time}</Text> : null}
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </View>

      {expanded && (
        <View style={styles.scheduleActions}>
          <TouchableOpacity style={styles.startBtn} onPress={onStart}>
            <Icon name="play" size={12} color={C.green} />
            <Text style={styles.startBtnText}>今から開始</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.completeBtn} onPress={onComplete}>
            <Icon name="check" size={12} color="#fff" />
            <Text style={styles.completeBtnText}>達成！</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── メイン ───────────────────────────────────────────────────

const CalendarScreen: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const navigation   = useNavigation<Nav>();
  const { schedules, deleteSchedule, updateActivity, completeSchedule } = useSchedules();

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [showFriends,  setShowFriends]  = useState(true);
  const [view,         setView]         = useState<'list' | 'timeline'>('timeline');
  const [comboAlert,   setComboAlert]   = useState<number | null>(null);
  const lastPress = useRef<{ date: string; time: number } | null>(null);

  // ─── カレンダーマーク ────────────────────────────────────────

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    schedules.forEach(s => {
      if (!marks[s.date]) marks[s.date] = { dots: [] };
      const color = s.priority === '高' ? C.prioHigh : s.priority === '中' ? C.prioMid : C.prioLow;
      if (!marks[s.date].dots.some((d: any) => d.color === color)) {
        marks[s.date].dots.push({ key: `${s.date}-${s.priority}`, color });
      }
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? { dots: [] }),
        selected: true,
        selectedColor: C.accent,
      };
    }
    return marks;
  }, [schedules, selectedDate]);

  const selectedSchedules = useMemo(() =>
    schedules
      .filter(s => s.date === selectedDate)
      .sort((a, b) => (a.time && b.time ? a.time.localeCompare(b.time) : a.time ? -1 : 1)),
  [schedules, selectedDate]);

  const friendSchedulesForDay = useMemo(() =>
    FRIEND_SCHEDULES.filter(f => f.date === selectedDate && f.isPublic),
  [selectedDate]);

  // ─── ダブルタップで予定追加 ──────────────────────────────────

  const onDayPress = (day: { dateString: string }) => {
    const newDate = day.dateString;
    const now = Date.now();
    if (lastPress.current?.date === newDate && now - lastPress.current.time < 500) {
      navigation.navigate('AddSchedule', { defaultDate: newDate });
      lastPress.current = null;
    } else {
      setSelectedDate(newDate);
      lastPress.current = { date: newDate, time: now };
      setTimeout(() => { if (lastPress.current?.date === newDate) lastPress.current = null; }, 500);
    }
  };

  // ─── 今から開始 ──────────────────────────────────────────────

  const handleStart = useCallback(async (schedule: Schedule) => {
    const [h, m] = (schedule.time || '00:00').split(':').map(Number);
    const endsAt = new Date();
    endsAt.setHours(h + 1, m, 0, 0); // 仮で1時間後
    await updateActivity({
      title: schedule.title,
      emoji: schedule.priority === '高' ? '🔴' : schedule.priority === '中' ? '🟠' : '🟢',
      endsAt,
    });
    Alert.alert('開始しました！', `${schedule.title} を開始。フレンドに「${schedule.title}中」と表示されます 👀`);
  }, [updateActivity]);

  // ─── 達成！ ───────────────────────────────────────────────────

  const handleComplete = useCallback(async (schedule: Schedule) => {
    const combo = await completeSchedule(schedule);
    setComboAlert(combo);
    setTimeout(() => setComboAlert(null), 3000);
  }, [completeSchedule]);

  return (
    <View style={{ flex:1, backgroundColor: C.bg }}>

      {/* コンボ演出 */}
      {comboAlert !== null && (
        <View style={styles.comboOverlay}>
          <Text style={styles.comboEmoji}>🔥</Text>
          <Text style={styles.comboText}>{comboAlert} COMBO!</Text>
          <Text style={styles.comboSub}>+{comboAlert * 5} pt 獲得！</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Calendar
          style={styles.calendar}
          onDayPress={onDayPress}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            calendarBackground:         C.card,
            dayTextColor:               C.text,
            monthTextColor:             C.text,
            textSectionTitleColor:      C.sub,
            todayTextColor:             C.accent,
            selectedDayBackgroundColor: C.accent,
            selectedDayTextColor:       '#fff',
            dotColor:                   C.accent,
            arrowColor:                 C.accent,
            textDisabledColor:          C.muted,
          }}
        />

        {/* コントロールバー */}
        <View style={styles.controlBar}>
          <View style={styles.viewToggle}>
            {(['timeline', 'list'] as const).map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.viewToggleBtn, view === v && styles.viewToggleBtnActive]}
                onPress={() => setView(v)}
              >
                <Text style={[styles.viewToggleText, view === v && { color:'#fff' }]}>
                  {v === 'timeline' ? '⏱ タイムライン' : '📋 リスト'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <Icon name="users" size={13} color={showFriends ? C.accentSoft : C.muted} />
            <Switch
              value={showFriends}
              onValueChange={setShowFriends}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor="#fff"
              style={{ transform:[{ scaleX:0.8 },{ scaleY:0.8 }] }}
            />
          </View>
        </View>

        {/* AI提案 */}
        {selectedDate === today && AI_SUGGESTIONS.map(s => (
          <View key={s.id} style={styles.aiCard}>
            <Text style={{ fontSize:20 }}>{s.emoji}</Text>
            <View style={{ flex:1 }}>
              <Text style={styles.aiLabel}>AI提案</Text>
              <Text style={styles.aiMsg}>{s.message}</Text>
            </View>
            <TouchableOpacity
              style={styles.aiAddBtn}
              onPress={() => navigation.navigate('AddSchedule', { defaultDate: selectedDate })}
            >
              <Text style={styles.aiAddText}>追加</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* 予定エリア */}
        <View style={styles.scheduleArea}>
          <View style={styles.scheduleAreaHeader}>
            <Text style={styles.dateLabel}>
              {selectedDate === today ? '今日' : selectedDate}
              {'  '}
              <Text style={styles.dateSub}>{selectedSchedules.length}件</Text>
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddSchedule', { defaultDate: selectedDate })}
            >
              <Icon name="plus" size={14} color="#fff" />
              <Text style={styles.addBtnText}>追加</Text>
            </TouchableOpacity>
          </View>

          {selectedSchedules.length === 0 && friendSchedulesForDay.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>この日は予定がありません 🎉</Text>
              <Text style={styles.emptyHint}>ダブルタップで素早く追加</Text>
            </View>
          ) : (
            <View style={{ gap:8 }}>
              {selectedSchedules.map(s => (
                <ScheduleBlock
                  key={s.id}
                  schedule={s}
                  onPress={() => navigation.navigate('EditSchedule', { schedule: s })}
                  onStart={() => handleStart(s)}
                  onComplete={() => handleComplete(s)}
                />
              ))}
              {showFriends && friendSchedulesForDay.map((f, i) => (
                <View key={i} style={styles.friendBlock}>
                  <FriendAvatar color={f.avatarColor} initial={f.initial} size={20} />
                  <View style={{ flex:1 }}>
                    <Text style={styles.friendBlockName}>{f.name}</Text>
                    <Text style={styles.friendBlockTitle}>{f.title}</Text>
                  </View>
                  <Text style={styles.friendBlockTime}>{f.time}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  scrollContent:       { padding:16, paddingBottom:40 },
  calendar:            { borderRadius:16, overflow:'hidden', marginBottom:14 },
  controlBar:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  viewToggle:          { flexDirection:'row', backgroundColor:C.card, borderRadius:10, padding:3, borderWidth:1, borderColor:C.border },
  viewToggleBtn:       { paddingHorizontal:12, paddingVertical:6, borderRadius:8 },
  viewToggleBtnActive: { backgroundColor:C.accent },
  viewToggleText:      { fontSize:12, fontWeight:'600', color:C.muted },
  aiCard:              { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#7C3AED18', borderWidth:1, borderColor:'#7C3AED40', borderRadius:14, padding:12, marginBottom:10 },
  aiLabel:             { fontSize:10, fontWeight:'700', color:C.accentSoft, textTransform:'uppercase', letterSpacing:1 },
  aiMsg:               { fontSize:12, color:C.sub, marginTop:2, lineHeight:18 },
  aiAddBtn:            { backgroundColor:C.accent, borderRadius:8, paddingHorizontal:12, paddingVertical:6 },
  aiAddText:           { color:'#fff', fontSize:12, fontWeight:'700' },
  scheduleArea:        { backgroundColor:C.card, borderRadius:16, padding:14, borderWidth:1, borderColor:C.border },
  scheduleAreaHeader:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  dateLabel:           { fontSize:16, fontWeight:'700', color:C.text },
  dateSub:             { fontSize:12, color:C.muted, fontWeight:'400' },
  addBtn:              { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.accent, borderRadius:10, paddingHorizontal:12, paddingVertical:7 },
  addBtnText:          { color:'#fff', fontSize:13, fontWeight:'700' },
  emptyBox:            { alignItems:'center', paddingVertical:30 },
  emptyText:           { fontSize:15, color:C.sub },
  emptyHint:           { fontSize:12, color:C.muted, marginTop:6 },
  scheduleBlock:       { backgroundColor:C.surface, borderRadius:10, padding:12, borderLeftWidth:3 },
  scheduleBlockTitle:  { fontSize:13, fontWeight:'600', color:C.text },
  scheduleBlockTime:   { fontSize:11, color:C.muted, marginTop:3 },
  scheduleActions:     { flexDirection:'row', gap:8, marginTop:10 },
  startBtn:            { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.green+'18', borderWidth:1, borderColor:C.green+'44', borderRadius:8, paddingHorizontal:10, paddingVertical:6 },
  startBtnText:        { fontSize:11, fontWeight:'700', color:C.green },
  completeBtn:         { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.accent, borderRadius:8, paddingHorizontal:10, paddingVertical:6 },
  completeBtnText:     { fontSize:11, fontWeight:'700', color:'#fff' },
  friendBlock:         { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#FFFFFF08', borderRadius:10, padding:8, borderWidth:1, borderColor:C.border },
  friendBlockName:     { fontSize:10, color:C.muted },
  friendBlockTitle:    { fontSize:12, color:C.sub },
  friendBlockTime:     { fontSize:11, color:C.muted },
  comboOverlay:        { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:999, alignItems:'center', justifyContent:'center', backgroundColor:'#00000088' },
  comboEmoji:          { fontSize:60 },
  comboText:           { fontSize:48, fontWeight:'900', color:C.yellow, marginTop:8 },
  comboSub:            { fontSize:18, fontWeight:'700', color:C.text, marginTop:4 },
});