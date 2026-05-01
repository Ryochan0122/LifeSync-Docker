import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSchedules } from '../context/ScheduleContext';
import Icon from 'react-native-vector-icons/Feather';

const C = {
  bg:'#07070F', surface:'#0D0D1A', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', pink:'#EC4899',
  green:'#10B981', yellow:'#F59E0B', red:'#EF4444',
  text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Avatar({ initial, color, status, size = 42 }: {
  initial: string; color: string; status?: string; size?: number;
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

const MOCK_NOT_POSTED = [
  { id: '2', name: 'Keita', initial: 'K', color: '#EC4899' },
  { id: '4', name: 'Hana',  initial: 'H', color: '#10B981' },
];

const MOCK_POSTS = [
  { id:'1', userId:'1', userDisplayName:'Yuki',  userAvatarColor:'#7C3AED', userStreak:42,  type:'checkin'  as const, content:'英語学習 完了！今日で42日連続🔥 毎日続けると本当に力になる', likes:[] as string[], commentCount:3,  createdAt:null, privacy:'friends' as const },
  { id:'2', userId:'3', userDisplayName:'Sora',  userAvatarColor:'#F59E0B', userStreak:128, type:'streak'   as const, content:'128日連続達成🏆 もう習慣になりすぎて逆にやらないと落ち着かない笑', likes:[] as string[], commentCount:8,  createdAt:null, privacy:'friends' as const },
  { id:'3', userId:'5', userDisplayName:'Ren',   userAvatarColor:'#06B6D4', userStreak:21,  type:'checkin'  as const, content:'英単語200個終わった💯 テスト前追い込み！眠いけど頑張る', likes:[] as string[], commentCount:1,  createdAt:null, privacy:'friends' as const },
  { id:'4', userId:'2', userDisplayName:'Keita', userAvatarColor:'#EC4899', userStreak:7,   type:'missed'   as const, content:'朝のルーティンさぼってしまった😅 明日リベンジする！', likes:[] as string[], commentCount:6,  createdAt:null, privacy:'friends' as const },
];

export default function FeedScreen() {
  const navigation  = useNavigation<Nav>();
  const { posts, likePost, userProfile } = useSchedules();
  const [refreshing, setRefreshing]      = useState(false);
  const [beRealActive, setBeRealActive]  = useState(false);
  const [beRealSec,    setBeRealSec]     = useState(120);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const myStreak      = userProfile?.streak      ?? 0;
  const hasPostedToday = userProfile?.hasPostedToday ?? false;

  // ─── BeRealパルスアニメーション ──────────────────────────────
  useEffect(() => {
    if (!beRealActive) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.setValue(1);
  }, [beRealActive]);

  // ─── BeRealタイマー ──────────────────────────────────────────
  useEffect(() => {
    if (!beRealActive) return;
    const interval = setInterval(() => {
      setBeRealSec(prev => {
        if (prev <= 1) { clearInterval(interval); setBeRealActive(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [beRealActive]);

  // ─── デモ用：30秒後にBeReal発火 ─────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setBeRealActive(true); setBeRealSec(120); }, 30000);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const displayPosts = posts.length > 0 ? posts : MOCK_POSTS;

  const ListHeader = () => (
    <View>
      {/* マイステータス */}
      <View style={styles.myStatus}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar
            initial={(userProfile?.displayName?.[0] ?? 'M').toUpperCase()}
            color={userProfile?.avatarColor ?? C.accent}
            size={44}
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.myName}>{userProfile?.displayName ?? 'あなた'}</Text>
              <StreakBadge n={myStreak} />
            </View>
            <Text style={styles.myScore}>{(userProfile?.score ?? 0).toLocaleString()} pt</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('NewPost')}>
          <Icon name="edit-2" size={14} color="#fff" />
          <Text style={styles.postBtnText}>投稿</Text>
        </TouchableOpacity>
      </View>

      {/* BeRealバナー */}
      {beRealActive && (
        <Animated.View style={[styles.beRealBanner, { transform: [{ scale: pulseAnim }] }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.beRealTitle}>📸 LifeSync Time！</Text>
            <Text style={styles.beRealSub}>
              残り {Math.floor(beRealSec / 60)}:{String(beRealSec % 60).padStart(2, '0')} — 今すぐ報告しないとペナルティ！
            </Text>
          </View>
          <TouchableOpacity
            style={styles.beRealBtn}
            onPress={() => { navigation.navigate('NewPost'); setBeRealActive(false); }}
          >
            <Text style={styles.beRealBtnText}>報告する</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ペナルティバナー */}
      {!hasPostedToday && !beRealActive && (
        <TouchableOpacity style={styles.penaltyBanner} onPress={() => navigation.navigate('NewPost')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.penaltyTitle}>⚠️ まだ今日の投稿がありません</Text>
            <Text style={styles.penaltySub}>投稿しないと Streak が途切れます</Text>
          </View>
          <View style={styles.penaltyBtnBox}>
            <Text style={styles.penaltyBtnText}>今すぐ</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 未投稿の友達 */}
      {MOCK_NOT_POSTED.length > 0 && (
        <View style={styles.notPostedBar}>
          <Text style={styles.notPostedLabel}>👀 まだ投稿していない友達</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {MOCK_NOT_POSTED.map(f => (
              <View key={f.id} style={styles.notPostedItem}>
                <Avatar initial={f.initial} color={f.color} size={22} />
                <Text style={styles.notPostedName}>{f.name}</Text>
                <Text style={styles.notPostedTag}>未</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>タイムライン</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayPosts}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const isLiked  = item.likes.includes(userProfile?.uid ?? '');
          const typeIcon = item.type === 'checkin' ? '✅' : item.type === 'streak' ? '🏆' : item.type === 'missed' ? '😅' : '🎯';
          return (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar
                  initial={item.userDisplayName[0]}
                  color={item.userAvatarColor}
                  size={44}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.postName}>{item.userDisplayName}</Text>
                    <StreakBadge n={item.userStreak} />
                  </View>
                </View>
              </View>
              <Text style={styles.postContent}>{typeIcon} {item.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => likePost(item.id, isLiked)}>
                  <Text style={[styles.actionIcon, isLiked && { color: C.pink }]}>
                    {isLiked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={[styles.actionCount, isLiked && { color: C.pink }]}>
                    {item.likes.length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionCount}>{item.commentCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  list:            { padding: 16, paddingBottom: 32 },
  myStatus:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  myName:          { fontSize: 15, fontWeight: '700', color: C.text },
  myScore:         { fontSize: 12, color: C.sub, marginTop: 2 },
  postBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  postBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  beRealBanner:    { backgroundColor: '#0A0A1A', borderWidth: 2, borderColor: C.accent, borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  beRealTitle:     { fontSize: 14, fontWeight: '800', color: C.accentSoft },
  beRealSub:       { fontSize: 11, color: C.sub, marginTop: 3 },
  beRealBtn:       { backgroundColor: C.accent, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  beRealBtnText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  penaltyBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0808', borderWidth: 1, borderColor: '#EF444440', borderRadius: 14, padding: 14, marginBottom: 12 },
  penaltyTitle:    { fontSize: 13, fontWeight: '700', color: C.red },
  penaltySub:      { fontSize: 11, color: C.sub, marginTop: 3 },
  penaltyBtnBox:   { backgroundColor: C.red, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  penaltyBtnText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  notPostedBar:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 12 },
  notPostedLabel:  { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  notPostedItem:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderRadius: 999, paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderWidth: 1, borderColor: C.border },
  notPostedName:   { fontSize: 12, color: C.sub },
  notPostedTag:    { fontSize: 9, color: C.red, fontWeight: '700' },
  sectionTitle:    { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  postCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  postHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  postName:        { fontSize: 14, fontWeight: '700', color: C.text },
  postContent:     { fontSize: 14, color: C.text, lineHeight: 22, marginBottom: 12 },
  postActions:     { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon:      { fontSize: 15, color: C.muted },
  actionCount:     { fontSize: 13, color: C.muted },
});