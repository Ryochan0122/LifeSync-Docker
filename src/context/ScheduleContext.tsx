import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  db, auth,
  addScheduleToFirestore,
  updateScheduleInFirestore,
  deleteScheduleFromFirestore,
} from '../utils/firebase';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, Timestamp,
  arrayUnion, arrayRemove, getDoc, setDoc,
} from 'firebase/firestore';
import { Schedule, Post, PostType, UserProfile } from '../types';
import { Alert } from 'react-native';

interface FirestoreScheduleData extends Omit<Schedule, 'id'> {
  userId: string;
  createdAt: any;
  isPublic: boolean;
  isPrivate: boolean;
}

interface ScheduleContextType {
  schedules:        Schedule[];
  user:             User | null;
  loading:          boolean;
  addSchedule:      (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule:   (schedule: Schedule) => Promise<void>;
  deleteSchedule:   (id: string) => Promise<void>;
  signOut:          () => Promise<void>;
  posts:            Post[];
  userProfile:      UserProfile | null;
  createPost:       (content: string, type: PostType, scheduleTitle?: string, privacy?: Post['privacy']) => Promise<void>;
  likePost:         (postId: string, isLiked: boolean) => Promise<void>;
  updateActivity:   (activity: { title: string; emoji: string; endsAt: Date } | null) => Promise<void>;
  completeSchedule: (schedule: Schedule) => Promise<number>;
  ghostData:        { date: string; score: number }[];
}

const AVATAR_COLORS = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444'];

function pickColor(uid: string): string {
  const sum = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,        setUser]        = useState<User | null>(null);
  const [schedules,   setSchedules]   = useState<Schedule[]>([]);
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [ghostData,   setGhostData]   = useState<{ date: string; score: number }[]>([]);

  // ─── 1. 認証状態の監視 ──────────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setSchedules([]);
        setPosts([]);
        setUserProfile(null);
        setGhostData([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── 2. プロフィール初期化・取得 ────────────────────────────

  useEffect(() => {
    if (!user) return;
    const initProfile = async () => {
      const ref = doc(db, 'userProfiles', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid:            user.uid,
          displayName:    user.displayName ?? user.email?.split('@')[0] ?? 'User',
          handle:         `@${user.email?.split('@')[0] ?? 'user'}`,
          avatarColor:    pickColor(user.uid),
          streak:         0,
          score:          0,
          status:         'active',
          hasPostedToday: false,
          followingIds:   [user.uid],
          followerIds:    [],
        };
        await setDoc(ref, newProfile);
        setUserProfile(newProfile);
      } else {
        setUserProfile(snap.data() as UserProfile);
      }
    };
    initProfile();
  }, [user]);

  // ─── 3. ゴーストデータ取得 ───────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const fetchGhost = async () => {
      try {
        const { getDocs, orderBy, limit } = await import('firebase/firestore');
        const q = query(
          collection(db, 'ghostData'),
          where('uid', '==', user.uid),
          orderBy('date', 'desc'),
          limit(14)
        );
        const snap = await getDocs(q);
        setGhostData(snap.docs.map(d => d.data() as { date: string; score: number }));
      } catch {
        // インデックス未作成の場合は空のまま
      }
    };
    fetchGhost();
  }, [user]);

  // ─── 4. スケジュールのリアルタイム監視 ──────────────────────

  useEffect(() => {
    if (!user || loading) return;
    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Schedule[] = snapshot.docs.map(d => {
        const data = d.data() as FirestoreScheduleData;
        return {
          id:        d.id,
          date:      data.date,
          title:     data.title,
          time:      data.time,
          priority:  data.priority,
          reminders: data.reminders || [],
          isPublic:  data.isPublic  || false,
          isPrivate: data.isPrivate || false,
        };
      });
      setSchedules(fetched);
    }, (error) => {
      console.error('Firestoreスケジュールエラー:', error);
      Alert.alert('データエラー', 'スケジュールの読み込みに失敗しました');
    });
    return () => unsubscribe();
  }, [user, loading]);

  // ─── 5. フィードのリアルタイム監視 ──────────────────────────

  useEffect(() => {
    if (!user || !userProfile) return;
    const ids = [...new Set([user.uid, ...userProfile.followingIds])].slice(0, 10);
    const q = query(collection(db, 'posts'), where('userId', 'in', ids));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Post[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      fetched.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setPosts(fetched);
    }, (error) => {
      console.error('Firestoreフィードエラー:', error);
    });
    return () => unsubscribe();
  }, [user, userProfile?.followingIds]);

  // ─── 6. Streak更新 ───────────────────────────────────────────

  const updateStreak = useCallback(async () => {
    if (!user) return;
    const ref = doc(db, 'userProfiles', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as UserProfile & { lastPostDate?: string };
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (data.lastPostDate === today) return;
    const newStreak = data.lastPostDate === yesterday ? (data.streak ?? 0) + 1 : 1;
    const newScore  = (data.score ?? 0) + newStreak * 10;
    await setDoc(ref, { streak: newStreak, score: newScore, lastPostDate: today, hasPostedToday: true }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, streak: newStreak, score: newScore, hasPostedToday: true } : prev);
  }, [user]);

  // ─── 7. リアルタイムステータス更新 ──────────────────────────

  const updateActivity = useCallback(async (
    activity: { title: string; emoji: string; endsAt: Date } | null
  ) => {
    if (!user) return;
    const ref = doc(db, 'userProfiles', user.uid);
    await setDoc(ref, {
      currentActivity: activity,
      status: activity ? 'active' : 'idle',
    }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, currentActivity: activity as any, status: activity ? 'active' : 'idle' } : prev);
  }, [user]);

  // ─── 8. 予定達成 + コンボ更新 ───────────────────────────────

  const completeSchedule = useCallback(async (schedule: Schedule): Promise<number> => {
    if (!user) return 0;
    try {
      // 達成フラグをFirestoreに記録
      const scheduleRef = doc(db, 'schedules', schedule.id);
      await updateDoc(scheduleRef, { completedAt: new Date().toISOString() });

      // リアルタイムステータスをクリア
      await updateActivity(null);

      // コンボ更新
      const ref = doc(db, 'userProfiles', user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      const today     = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastDate  = data.comboLastDate;
      let newCombo = 1;
      if (lastDate === today)      newCombo = (data.comboCount ?? 0) + 1;
      else if (lastDate === yesterday) newCombo = (data.comboCount ?? 0) + 1;
      const newScore = (data.score ?? 0) + newCombo * 5;
      await setDoc(ref, { comboCount: newCombo, comboLastDate: today, score: newScore }, { merge: true });
      setUserProfile(prev => prev ? { ...prev, score: newScore } : prev);

      // 本日スコアをゴーストデータとして記録
      const ghostRef = doc(db, 'ghostData', `${user.uid}_${today}`);
      await setDoc(ghostRef, { uid: user.uid, date: today, score: newScore, createdAt: Timestamp.now() });

      return newCombo;
    } catch (error) {
      console.error('達成記録に失敗:', error);
      return 0;
    }
  }, [user, updateActivity]);

  // ─── 9. CRUD: スケジュール ───────────────────────────────────

  const addSchedule = useCallback(async (schedule: Omit<Schedule, 'id'>) => {
    if (!user) return;
    try {
      await addScheduleToFirestore(
        { ...schedule, isPublic: schedule.isPublic ?? false, isPrivate: schedule.isPrivate ?? false },
        user.uid
      );
    } catch (error) {
      console.error('予定の追加に失敗:', error);
      throw new Error('予定の追加中にエラーが発生しました');
    }
  }, [user]);

  const updateSchedule = useCallback(async (schedule: Schedule) => {
    if (!user) return;
    try {
      await updateScheduleInFirestore(schedule);
    } catch (error) {
      console.error('予定の更新に失敗:', error);
      throw new Error('予定の更新中にエラーが発生しました');
    }
  }, [user]);

  const deleteSchedule = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteScheduleFromFirestore(id);
    } catch (error) {
      console.error('予定の削除に失敗:', error);
      throw new Error('予定の削除中にエラーが発生しました');
    }
  }, [user]);

  // ─── 10. SNS: 投稿作成 ───────────────────────────────────────

  const createPost = useCallback(async (
    content: string,
    type: PostType,
    scheduleTitle?: string,
    privacy: Post['privacy'] = 'friends',
  ) => {
    if (!user || !userProfile) return;
    try {
      await addDoc(collection(db, 'posts'), {
        userId:          user.uid,
        userDisplayName: userProfile.displayName,
        userAvatarColor: userProfile.avatarColor,
        userStreak:      userProfile.streak,
        type,
        content,
        scheduleTitle:   scheduleTitle ?? null,
        privacy,
        likes:           [],
        commentCount:    0,
        createdAt:       Timestamp.now(),
      });
      await updateStreak();
    } catch (error) {
      console.error('投稿の作成に失敗:', error);
      throw new Error('投稿の作成中にエラーが発生しました');
    }
  }, [user, userProfile, updateStreak]);

  // ─── 11. SNS: いいね ─────────────────────────────────────────

  const likePost = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      console.error('いいねに失敗:', error);
    }
  }, [user]);

  // ─── 12. サインアウト ────────────────────────────────────────

  const signOut = useCallback(async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('サインアウト失敗:', error);
      Alert.alert('エラー', 'サインアウト中に問題が発生しました');
    }
  }, []);

  const contextValue: ScheduleContextType = {
    schedules,
    user,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    signOut,
    posts,
    userProfile,
    createPost,
    likePost,
    updateActivity,
    completeSchedule,
    ghostData,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a ScheduleProvider');
  }
  return context;
};