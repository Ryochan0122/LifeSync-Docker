import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch, ScrollView, ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import NotificationService from '../utils/NotificationService';
import { useSchedules } from '../context/ScheduleContext';

type Props = { route: RouteProp<RootStackParamList, 'AddSchedule'> };

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

export default function AddScheduleScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addSchedule } = useSchedules();

  const [date,     setDate]     = useState(route.params?.defaultDate ?? new Date().toISOString().split('T')[0]);
  const [title,    setTitle]    = useState('');
  const [time,     setTime]     = useState('');
  const [priority, setPriority] = useState<'高'|'中'|'低'>('中');
  const [isPublic, setIsPublic] = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { NotificationService.requestPermissions(); }, []);

  const handleAdd = async () => {
    if (!date || !title.trim()) {
      Alert.alert('入力エラー', '日付とタイトルを入力してください');
      return;
    }
    setLoading(true);
    try {
      await addSchedule({ date, title: title.trim(), time, priority, reminders: [10], isPublic, isPrivate: !isPublic });

      if (time) {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        await NotificationService.scheduleNotification(`予定: ${title}`, `優先度: ${priority}`, d);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('エラー', '予定の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={styles.container}>

      <View style={styles.card}>
        <Text style={styles.label}>タイトル *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle}
          placeholder="例：英語学習 30分" placeholderTextColor={C.muted} />

        <Text style={[styles.label, { marginTop: 14 }]}>日付 *</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate}
          placeholder="YYYY-MM-DD" placeholderTextColor={C.muted} />

        <Text style={[styles.label, { marginTop: 14 }]}>時間</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime}
          placeholder="HH:MM（任意）" placeholderTextColor={C.muted} />

        <Text style={[styles.label, { marginTop: 14 }]}>優先度</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={priority} onValueChange={setPriority}
            style={{ color: C.text }} dropdownIconColor={C.sub}>
            <Picker.Item label="🔴 高" value="高" />
            <Picker.Item label="🟠 中" value="中" />
            <Picker.Item label="🟢 低" value="低" />
          </Picker>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>フレンドに公開</Text>
            <Text style={styles.switchDesc}>フィードに表示されます</Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic}
            trackColor={{ false: C.border, true: C.accent }} thumbColor="#fff" />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, loading && { opacity: 0.6 }]}
        onPress={handleAdd} disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.addBtnText}>予定を追加する</Text>
        }
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, paddingBottom: 40 },
  card:        { backgroundColor: '#111120', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1C1C30' },
  label:       { fontSize: 11, fontWeight: '700', color: '#8888AA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:       { backgroundColor: '#07070F', borderWidth: 1, borderColor: '#1C1C30', borderRadius: 10, padding: 12, color: '#EEEEFF', fontSize: 14 },
  pickerWrap:  { backgroundColor: '#07070F', borderWidth: 1, borderColor: '#1C1C30', borderRadius: 10 },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#EEEEFF' },
  switchDesc:  { fontSize: 11, color: '#4A4A6A', marginTop: 2 },
  addBtn:      { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  addBtnText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
});