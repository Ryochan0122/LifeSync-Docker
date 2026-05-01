import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Picker } from '@react-native-picker/picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import NotificationService from '../utils/NotificationService';
import { useSchedules } from '../context/ScheduleContext';

type Props = { route: RouteProp<RootStackParamList, 'EditSchedule'> };

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
  red:'#EF4444', green:'#10B981',
};

export default function EditScheduleScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { updateSchedule, deleteSchedule } = useSchedules();
  const { schedule } = route.params;

  const [date,     setDate]     = useState(schedule.date);
  const [title,    setTitle]    = useState(schedule.title);
  const [time,     setTime]     = useState(schedule.time || '');
  const [priority, setPriority] = useState<'高'|'中'|'低'>(schedule.priority);
  const [isPublic, setIsPublic] = useState(schedule.isPublic ?? false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { NotificationService.requestPermissions(); }, []);

  const handleSave = async () => {
    if (!date || !title.trim()) {
      Alert.alert('入力エラー', '日付とタイトルを入力してください');
      return;
    }
    setLoading(true);
    try {
      await updateSchedule({
        ...schedule,
        date,
        title: title.trim(),
        time,
        priority,
        isPublic,
        isPrivate: !isPublic,
      });

      if (time) {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        await NotificationService.scheduleNotification(
          `予定: ${title}`, `優先度: ${priority}`, d
        );
      }

      navigation.goBack();
    } catch (e) {
      Alert.alert('エラー', '予定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('削除確認', `「${schedule.title}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteSchedule(schedule.id);
            navigation.goBack();
          } catch {
            Alert.alert('エラー', '削除に失敗しました');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.label}>タイトル *</Text>
        <TextInput
          style={styles.input} value={title} onChangeText={setTitle}
          placeholderTextColor={C.muted} placeholder="タイトルを入力"
        />

        <Text style={[styles.label, { marginTop: 14 }]}>日付 *</Text>
        <TextInput
          style={styles.input} value={date} onChangeText={setDate}
          placeholder="YYYY-MM-DD" placeholderTextColor={C.muted}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>時間</Text>
        <TextInput
          style={styles.input} value={time} onChangeText={setTime}
          placeholder="HH:MM（任意）" placeholderTextColor={C.muted}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>優先度</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            style={{ color: C.text }}
            dropdownIconColor={C.sub}
          >
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
          <Switch
            value={isPublic} onValueChange={setIsPublic}
            trackColor={{ false: C.border, true: C.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 保存ボタン */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>変更を保存</Text>
        }
      </TouchableOpacity>

      {/* 削除ボタン */}
      <TouchableOpacity
        style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
        onPress={handleDelete}
        disabled={loading}
      >
        <Text style={styles.deleteBtnText}>この予定を削除</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 16, paddingBottom: 40 },
  card:        { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  label:       { fontSize: 11, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:       { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 14 },
  pickerWrap:  { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10 },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  switchDesc:  { fontSize: 11, color: C.muted, marginTop: 2 },
  saveBtn:     { backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  deleteBtn:   { backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440', borderRadius: 14, padding: 16, alignItems: 'center' },
  deleteBtnText:{ color: C.red, fontSize: 15, fontWeight: '700' },
});