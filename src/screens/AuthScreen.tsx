import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../utils/firebase';

const C = {
  bg: '#07070F', card: '#111120', border: '#1C1C30',
  accent: '#7C3AED', pink: '#EC4899', text: '#EEEEFF',
  sub: '#8888AA', muted: '#4A4A6A', red: '#EF4444',
};

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'メールとパスワードを入力してください');
      return;
    }
    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上にしてください');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      // 成功 → AppNavigatorが自動でMainTabに切り替え
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'このメールは既に使われています' :
        e.code === 'auth/user-not-found'        ? 'ユーザーが見つかりません' :
        e.code === 'auth/wrong-password'        ? 'パスワードが間違っています' :
        e.code === 'auth/invalid-email'         ? 'メールアドレスの形式が正しくありません' :
        e.message;
      Alert.alert('エラー', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ロゴ */}
      <View style={styles.logoArea}>
        <Text style={styles.logo}>LifeSync</Text>
        <Text style={styles.tagline}>習慣をシェアして、一緒に成長しよう</Text>
      </View>

      {/* タブ切り替え */}
      <View style={styles.tabRow}>
        {(['signin', 'signup'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, mode === m && styles.tabActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === 'signin' ? 'ログイン' : '新規登録'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* フォーム */}
      <View style={styles.form}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[styles.label, { marginTop: 14 }]}>パスワード</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'signup' ? '6文字以上' : '••••••••'}
          placeholderTextColor={C.muted}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>
                {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        {mode === 'signin' ? 'アカウントがない？' : '既にアカウントがある？'}
        {'  '}
        <Text
          style={{ color: C.accent, fontWeight: '700' }}
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? '新規登録' : 'ログイン'}
        </Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg, padding: 28, justifyContent: 'center' },
  logoArea:        { alignItems: 'center', marginBottom: 40 },
  logo:            { fontSize: 42, fontWeight: '900', color: C.accent, letterSpacing: -1 },
  tagline:         { fontSize: 13, color: C.sub, marginTop: 6 },
  tabRow:          { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  tab:             { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive:       { backgroundColor: C.accent },
  tabText:         { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive:   { color: '#fff' },
  form:            { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  label:           { fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:           { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 13, color: C.text, fontSize: 14 },
  submitBtn:       { backgroundColor: C.accent, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  submitText:      { color: '#fff', fontSize: 15, fontWeight: '800' },
  footer:          { textAlign: 'center', marginTop: 24, fontSize: 13, color: C.sub },
});