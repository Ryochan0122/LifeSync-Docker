import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useSchedules } from '../context/ScheduleContext';
import Icon from 'react-native-vector-icons/Feather';

const C = {
  bg:'#07070F', card:'#111120', border:'#1C1C30',
  accent:'#7C3AED', accentSoft:'#9D5FFF', red:'#EF4444',
  text:'#EEEEFF', sub:'#8888AA', muted:'#4A4A6A',
};

export default function SettingsScreen() {
  const { user, signOut, userProfile } = useSchedules();

  const handleSignOut = () => {
    Alert.alert('サインアウト', '本当にサインアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'サインアウト', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>設定</Text>

        {/* プロフィールカード */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: userProfile?.avatarColor ?? C.accent }]}>
            <Text style={styles.avatarText}>
              {(userProfile?.displayName?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName}>{userProfile?.displayName ?? 'ユーザー'}</Text>
            <Text style={styles.handle}>{userProfile?.handle ?? ''}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* ステータス */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 ステータス</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>🔥 Streak</Text>
            <Text style={styles.rowValue}>{userProfile?.streak ?? 0} 日</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>⭐ スコア</Text>
            <Text style={styles.rowValue}>{(userProfile?.score ?? 0).toLocaleString()} pt</Text>
          </View>
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 アカウント</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>UID</Text>
            <Text style={[styles.rowValue, { fontSize: 10, color: C.muted }]} numberOfLines={1}>
              {user?.uid ?? 'N/A'}
            </Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>メール</Text>
            <Text style={styles.rowValue}>{user?.email ?? 'N/A'}</Text>
          </View>
        </View>

        {/* サインアウト */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Icon name="log-out" size={16} color={C.red} />
          <Text style={styles.signOutText}>サインアウト</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  container:     { padding: 20, paddingBottom: 40 },
  title:         { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 20 },
  profileCard:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  avatar:        { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  displayName:   { fontSize: 16, fontWeight: '700', color: C.text },
  handle:        { fontSize: 12, color: C.accentSoft, marginTop: 2 },
  email:         { fontSize: 11, color: C.muted, marginTop: 2 },
  section:       { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel:      { fontSize: 14, color: C.text },
  rowValue:      { fontSize: 14, color: C.sub, maxWidth: '60%', textAlign: 'right' },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444440', borderRadius: 14, padding: 16, marginTop: 8 },
  signOutText:   { color: C.red, fontSize: 15, fontWeight: '700' },
});