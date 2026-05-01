import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from '../types';

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
  prioHigh:'#E74C3C', prioMid:'#F39C12', prioLow:'#2ECC71',
};

function ScheduleRow({ item }: { item: Schedule }) {
  const color = item.priority === '高' ? C.prioHigh : item.priority === '中' ? C.prioMid : C.prioLow;
  return (
    <View style={[styles.row, { borderLeftColor: color }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.time ? <Text style={styles.rowTime}>{item.time}</Text> : null}
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.priorityText, { color }]}>{item.priority}</Text>
      </View>
    </View>
  );
}

type Tab = 'past' | 'future';

export default function HistoryScreen() {
  const [schedules,  setSchedules]  = useState<Schedule[]>([]);
  const [activeTab,  setActiveTab]  = useState<Tab>('future');

  useEffect(() => {
    AsyncStorage.getItem('schedules').then(data => {
      if (data) {
        const parsed: Schedule[] = JSON.parse(data);
        parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setSchedules(parsed);
      }
    });
  }, []);

  const now = Date.now();
  const filtered = schedules.filter(s =>
    activeTab === 'past'
      ? new Date(s.date).getTime() < now
      : new Date(s.date).getTime() >= now
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>予定履歴</Text>
      <View style={styles.tabRow}>
        {(['future', 'past'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'future' ? 'これから' : '過去'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filtered.length === 0
        ? <Text style={styles.empty}>予定はありません</Text>
        : <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item.date}-${i}`}
            renderItem={({ item }) => <ScheduleRow item={item} />}
            contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg, padding: 20 },
  title:          { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 14 },
  tabRow:         { flexDirection: 'row', backgroundColor: C.card, borderRadius: 10, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  tab:            { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabActive:      { backgroundColor: C.accent },
  tabText:        { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive:  { color: '#fff' },
  empty:          { textAlign: 'center', marginTop: 40, fontSize: 15, color: C.sub },
  row:            { backgroundColor: C.card, borderRadius: 12, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center' },
  rowTitle:       { fontSize: 14, fontWeight: '600', color: C.text },
  rowTime:        { fontSize: 12, color: C.muted, marginTop: 3 },
  priorityBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priorityText:   { fontSize: 12, fontWeight: '700' },
});