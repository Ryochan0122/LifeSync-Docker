import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useSchedules } from '../context/ScheduleContext';
import { PostType } from '../types';

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', pink:'#EC4899',
  green:'#10B981', text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

type Privacy = 'public' | 'friends' | 'private';

const POST_TYPES: { value: PostType; label: string; emoji: string }[] = [
  { value: 'checkin',   label: '達成報告',   emoji: '✅' },
  { value: 'streak',    label: 'Streak自慢', emoji: '🔥' },
  { value: 'challenge', label: 'チャレンジ', emoji: '🎯' },
  { value: 'missed',    label: 'さぼり告白', emoji: '😅' },
];

const PRIVACY_OPTIONS: { value: Privacy; label: string; icon: string }[] = [
  { value: 'public',  label: '全公開',   icon: 'globe' },
  { value: 'friends', label: 'フレンド', icon: 'users' },
  { value: 'private', label: '非公開',   icon: 'lock' },
];

export default function NewPostScreen() {
  const navigation = useNavigation();
  const { createPost, userProfile, schedules } = useSchedules();
  const [content,        setContent]        = useState('');
  const [postType,       setPostType]        = useState<PostType>('checkin');
  const [privacy,        setPrivacy]         = useState<Privacy>('friends');
  const [linkedSchedule, setLinkedSchedule]  = useState<string | null>(null);
  const [posting,        setPosting]         = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.date === today);
  const charLimit = 200;

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', '本文を入力してください');
      return;
    }
    setPosting(true);
    try {
      const linked = todaySchedules.find(s => s.id === linkedSchedule);
      await createPost(content.trim(), postType, linked?.title, privacy);
      navigation.goBack();
    } catch {
      Alert.alert('エラー', '投稿に失敗しました');
    } finally {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={22} color={C.sub} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>今日の進捗を投稿</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!content.trim() || posting) && { opacity: 0.4 }]}
          onPress={handlePost}
          disabled={!content.trim() || posting}
        >
          {posting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.postBtnText}>投稿</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* 投稿タイプ */}
        <Text style={styles.label}>投稿タイプ</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, postType === t.value && styles.typeBtnActive]}
              onPress={() => setPostType(t.value)}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, postType === t.value && { color: C.accentSoft }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* テキスト入力 */}
        <View style={styles.inputCard}>
          <View style={styles.myAvatar}>
            <Text style={styles.myAvatarText}>
              {userProfile?.displayName?.[0] ?? 'M'}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="今日の進捗を共有しよう 💪"
            placeholderTextColor={C.muted}
            multiline
            autoFocus
            value={content}
            onChangeText={t => t.length <= charLimit && setContent(t)}
          />
        </View>
        <Text style={[styles.charCount, (charLimit - content.length) < 20 && { color: '#EF4444' }]}>
          {charLimit - content.length}
        </Text>

        {/* 今日の予定にリンク */}
        {todaySchedules.length > 0 && (
          <>
            <Text style={styles.label}>📅 予定に紐づける（任意）</Text>
            <View style={styles.scheduleList}>
              {todaySchedules.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.scheduleItem, linkedSchedule === s.id && styles.scheduleItemActive]}
                  onPress={() => setLinkedSchedule(linkedSchedule === s.id ? null : s.id)}
                >
                  <Text style={[styles.scheduleTitle, linkedSchedule === s.id && { color: C.accentSoft }]}>
                    {s.title}
                  </Text>
                  <Text style={styles.scheduleTime}>{s.time}</Text>
                  {linkedSchedule === s.id && <Icon name="check-circle" size={16} color={C.accentSoft} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* 公開範囲 */}
        <Text style={styles.label}>🔒 公開範囲</Text>
        <View style={styles.privacyRow}>
          {PRIVACY_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[styles.privacyBtn, privacy === o.value && styles.privacyBtnActive]}
              onPress={() => setPrivacy(o.value)}
            >
              <Icon name={o.icon} size={13} color={privacy === o.value ? C.accentSoft : C.muted} />
              <Text style={[styles.privacyLabel, privacy === o.value && { color: C.accentSoft }]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1C1C30' },
  headerTitle:       { fontSize: 15, fontWeight: '700', color: '#EEEEFF' },
  postBtn:           { backgroundColor: '#7C3AED', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  body:              { padding: 16, gap: 12, paddingBottom: 40 },
  label:             { fontSize: 11, fontWeight: '700', color: '#8888AA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  typeRow:           { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeBtn:           { flex: 1, minWidth: '45%', alignItems: 'center', backgroundColor: '#111120', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1C1C30' },
  typeBtnActive:     { borderColor: '#7C3AED', backgroundColor: '#7C3AED18' },
  typeEmoji:         { fontSize: 20, marginBottom: 4 },
  typeLabel:         { fontSize: 11, fontWeight: '600', color: '#4A4A6A' },
  inputCard:         { flexDirection: 'row', gap: 10, backgroundColor: '#111120', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1C1C30' },
  myAvatar:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  myAvatarText:      { color: '#fff', fontWeight: '800', fontSize: 15 },
  input:             { flex: 1, color: '#EEEEFF', fontSize: 14, lineHeight: 22, minHeight: 80 },
  charCount:         { textAlign: 'right', fontSize: 11, color: '#4A4A6A' },
  scheduleList:      { gap: 6 },
  scheduleItem:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111120', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1C1C30' },
  scheduleItemActive:{ borderColor: '#7C3AED', backgroundColor: '#7C3AED10' },
  scheduleTitle:     { flex: 1, fontSize: 13, fontWeight: '600', color: '#EEEEFF' },
  scheduleTime:      { fontSize: 11, color: '#4A4A6A' },
  privacyRow:        { flexDirection: 'row', gap: 8 },
  privacyBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#111120', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#1C1C30' },
  privacyBtnActive:  { borderColor: '#7C3AED', backgroundColor: '#7C3AED10' },
  privacyLabel:      { fontSize: 12, fontWeight: '600', color: '#4A4A6A' },
});