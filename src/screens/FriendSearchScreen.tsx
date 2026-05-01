import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSchedules } from '../context/ScheduleContext';
import {
  searchUserByEmail, searchUserByUid,
  sendFriendRequest, getIncomingFriendRequests,
  acceptFriendRequest, rejectFriendRequest,
} from '../utils/firebase';
import { UserProfile } from '../types';

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', green:'#10B981',
  red:'#EF4444', yellow:'#F59E0B',
  text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

function Avatar({ initial, color, size = 44 }: {
  initial: string; color: string; size?: number;
}) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>
        {initial}
      </Text>
    </View>
  );
}

export default function FriendSearchScreen() {
  const { user, userProfile } = useSchedules();
  const [query,        setQuery]        = useState('');
  const [searching,    setSearching]    = useState(false);
  const [result,       setResult]       = useState<UserProfile | null>(null);
  const [notFound,     setNotFound]     = useState(false);
  const [sending,      setSending]      = useState(false);
  const [requests,     setRequests]     = useState<any[]>([]);
  const [reqProfiles,  setReqProfiles]  = useState<Record<string, UserProfile>>({});

  // ─── 受信中のフレンド申請を取得 ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    getIncomingFriendRequests(user.uid).then(async (reqs) => {
      setRequests(reqs);
      // 申請者のプロフィールも取得
      const profiles: Record<string, UserProfile> = {};
      for (const req of reqs) {
        const p = await searchUserByUid(req.fromUid);
        if (p) profiles[req.fromUid] = p;
      }
      setReqProfiles(profiles);
    });
  }, [user]);

  // ─── 検索 ────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    try {
      // UID直接検索 or メール検索
      const found = query.includes('@')
        ? await searchUserByEmail(query.trim())
        : await searchUserByUid(query.trim());
      if (found && found.uid !== user?.uid) {
        setResult(found);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  // ─── フレンド申請送信 ─────────────────────────────────────────
  const handleSendRequest = async () => {
    if (!result || !user) return;
    setSending(true);
    try {
      await sendFriendRequest(user.uid, result.uid);
      Alert.alert('申請送信！', `${result.displayName} にフレンド申請を送りました 🎉`);
      setResult(null);
      setQuery('');
    } catch {
      Alert.alert('エラー', '申請の送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // ─── 申請を承認 ──────────────────────────────────────────────
  const handleAccept = async (req: any) => {
    try {
      await acceptFriendRequest(req.id, req.fromUid, user!.uid);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      Alert.alert('フレンド追加！', `${reqProfiles[req.fromUid]?.displayName ?? '?'} とフレンドになりました 🎉`);
    } catch {
      Alert.alert('エラー', '承認に失敗しました');
    }
  };

  // ─── 申請を拒否 ──────────────────────────────────────────────
  const handleReject = async (req: any) => {
    try {
      await rejectFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch {
      Alert.alert('エラー', '拒否に失敗しました');
    }
  };

  // ─── 自分のUIDをシェア ────────────────────────────────────────
  const handleShareUid = () => {
    Share.share({
      message: `LifeSyncでフレンドになろう！\n私のUID: ${user?.uid}\nアプリ: https://lifesync.app`,
      title: 'LifeSyncフレンド招待',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* 自分のUID共有カード */}
      <View style={styles.myUidCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar
            initial={(userProfile?.displayName?.[0] ?? 'U').toUpperCase()}
            color={userProfile?.avatarColor ?? C.accent}
            size={44}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.myName}>{userProfile?.displayName}</Text>
            <Text style={styles.myUid} numberOfLines={1}>{user?.uid}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareUid}>
          <Icon name="share-2" size={14} color={C.accentSoft} />
          <Text style={styles.shareBtnText}>招待</Text>
        </TouchableOpacity>
      </View>

      {/* 受信中の申請 */}
      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📬 フレンド申請 {requests.length}件</Text>
          {requests.map(req => {
            const p = reqProfiles[req.fromUid];
            return (
              <View key={req.id} style={styles.requestCard}>
                <Avatar
                  initial={(p?.displayName?.[0] ?? '?').toUpperCase()}
                  color={p?.avatarColor ?? C.muted}
                  size={40}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reqName}>{p?.displayName ?? '読み込み中...'}</Text>
                  <Text style={styles.reqHandle}>{p?.handle ?? ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(req)}
                  >
                    <Text style={styles.acceptBtnText}>承認</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(req)}
                  >
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 検索フォーム */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 フレンドを検索</Text>
        <Text style={styles.sectionDesc}>UIDまたはメールアドレスで検索</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="UID or メールアドレス"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={[styles.searchBtn, searching && { opacity: 0.6 }]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching
              ? <ActivityIndicator color="#fff" size="small" />
              : <Icon name="search" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>

        {/* 検索結果 */}
        {notFound && (
          <Text style={styles.notFound}>ユーザーが見つかりませんでした</Text>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Avatar
              initial={(result.displayName?.[0] ?? '?').toUpperCase()}
              color={result.avatarColor ?? C.accent}
              size={48}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resultName}>{result.displayName}</Text>
              <Text style={styles.resultHandle}>{result.handle}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <Text style={styles.resultStat}>🔥 {result.streak}日</Text>
                <Text style={styles.resultStat}>⭐ {result.score?.toLocaleString()} pt</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, sending && { opacity: 0.6 }]}
              onPress={handleSendRequest}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.addBtnText}>申請する</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  content:        { padding: 16, paddingBottom: 40 },
  myUidCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  myName:         { fontSize: 15, fontWeight: '700', color: C.text },
  myUid:          { fontSize: 10, color: C.muted, marginTop: 2, maxWidth: 200 },
  shareBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#7C3AED18', borderWidth: 1, borderColor: '#7C3AED44', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  shareBtnText:   { fontSize: 12, fontWeight: '700', color: C.accentSoft },
  section:        { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle:   { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 4 },
  sectionDesc:    { fontSize: 12, color: C.muted, marginBottom: 12 },
  requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED0A', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#7C3AED30' },
  reqName:        { fontSize: 14, fontWeight: '700', color: C.text },
  reqHandle:      { fontSize: 11, color: C.accentSoft, marginTop: 1 },
  acceptBtn:      { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  acceptBtnText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  rejectBtn:      { backgroundColor: C.red + '20', borderWidth: 1, borderColor: C.red + '40', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  rejectBtnText:  { color: C.red, fontSize: 12, fontWeight: '700' },
  searchRow:      { flexDirection: 'row', gap: 8 },
  searchInput:    { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 14 },
  searchBtn:      { backgroundColor: C.accent, borderRadius: 10, width: 46, alignItems: 'center', justifyContent: 'center' },
  notFound:       { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 12 },
  resultCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED0A', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#7C3AED30' },
  resultName:     { fontSize: 15, fontWeight: '700', color: C.text },
  resultHandle:   { fontSize: 12, color: C.accentSoft, marginTop: 1 },
  resultStat:     { fontSize: 11, color: C.sub },
  addBtn:         { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
});