import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'; 
import { Schedule } from "../types"; 

// ----------------------------------------------------
// 1. Firebase設定 (ユーザー提供情報)
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAORM_VBQS8MyKCcgklnmQd7-by5AHgg3A",
  authDomain: "lifesync-28cd9.firebaseapp.com",
  projectId: "lifesync-28cd9",
  storageBucket: "lifesync-28cd9.firebasestorage.app",
  messagingSenderId: "106612814355",
  appId: "1:106612814355:web:2bfc1a0b80eb2be017c5e6",
  measurementId: "G-GXMMTJGXH9" 
};

// ----------------------------------------------------
// 2. アプリの初期化とサービス取得
// ----------------------------------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // 認証サービス
export const db = getFirestore(app); // Firestoreサービス

// ----------------------------------------------------
// 3. Firestore用のデータ構造定義と操作関数
// ----------------------------------------------------

// Firestoreに保存する際のデータ型
export interface FirestoreSchedule {
  userId: string;
  date: string;
  title: string;
  time: string;
  priority: '高' | '中' | '低';
  reminders: number[];
  isPublic?: boolean; 
  isPrivate?: boolean; 
  createdAt: Timestamp;
}

const schedulesCollection = collection(db, "schedules");

/**
 * ログインユーザーの予定データをFirestoreから全て取得する
 */
export const getMySchedules = async (userId: string): Promise<Schedule[]> => {
  if (!userId) return [];
  const q = query(schedulesCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as FirestoreSchedule;
    return {
      id: doc.id, 
      date: data.date,
      title: data.title,
      time: data.time,
      priority: data.priority,
      reminders: data.reminders,
      isPublic: data.isPublic || false,
      isPrivate: data.isPrivate || false,
    } as Schedule; 
  });
};

/**
 * 公開されている全ての予定データをFirestoreから取得する
 */
export const getPublicSchedulesFromFirestore = async (currentUserId?: string): Promise<Schedule[]> => {
  // isPublicがtrueのものをクエリ
  let q = query(schedulesCollection, where("isPublic", "==", true));
  
  // (Optional) 自分の投稿を除外したい場合は、ここに where("userId", "!=", currentUserId) を追加しますが、
  // Firestoreの制約（複合クエリ）により、今回はシンプルに全て取得します。

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as FirestoreSchedule;
    return {
      id: doc.id, 
      date: data.date,
      title: data.title,
      time: data.time,
      priority: data.priority,
      reminders: data.reminders,
      isPublic: true,
      isPrivate: false,
      // 共有データにはユーザーIDも表示するために残しておく
      userId: data.userId, 
    } as Schedule; 
  });
};


/**
 * 予定データをFirestoreに追加する
 */
export const addScheduleToFirestore = async (schedule: Omit<Schedule, 'id'>, userId: string): Promise<string> => {
    const data: Omit<FirestoreSchedule, 'createdAt'> = {
    userId,
    date: schedule.date,
    title: schedule.title,
    time: schedule.time,
    priority: schedule.priority,
    reminders: schedule.reminders,
    // isPublicとisPrivateがundefinedの場合、falseをデフォルト値とする
    isPublic: schedule.isPublic ?? false, // ✅ ここを修正
    isPrivate: schedule.isPrivate ?? false, // ✅ ここを修正
};
    
    const docRef = await addDoc(schedulesCollection, { 
      ...data, 
      createdAt: Timestamp.now() 
    });
    return docRef.id; 
};

/**
 * 既存の予定データをFirestoreで更新する
 */
export const updateScheduleInFirestore = async (schedule: Schedule) => {
    if (!schedule.id) throw new Error("Schedule ID is required for update.");
    
    const { id, ...updateData } = schedule; 
    
    const scheduleDocRef = doc(db, "schedules", id);
    await updateDoc(scheduleDocRef, { ...updateData });
};

/**
 * 予定データをFirestoreから削除する
 */
export const deleteScheduleFromFirestore = async (id: string) => {
    if (!id) throw new Error("Schedule ID is required for delete.");
    const scheduleDocRef = doc(db, "schedules", id);
    await deleteDoc(scheduleDocRef);
};

// ─── SNS: 投稿 ────────────────────────────────────────────────

import { Post, UserProfile } from '../types';

const postsCollection     = collection(db, 'posts');
const profilesCollection  = collection(db, 'userProfiles');

/** 投稿を追加 */
export const addPost = async (post: Omit<Post, 'id'>): Promise<string> => {
  const docRef = await addDoc(postsCollection, {
    ...post,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

/** フレンドのフィードをリアルタイム取得（onSnapshot用） */
export const getPostsQuery = (followingIds: string[]) => {
  // 自分を含めた最大10人分（Firestore in句の制限）
  const ids = followingIds.slice(0, 10);
  return query(
    postsCollection,
    where('userId', 'in', ids.length > 0 ? ids : ['__dummy__']),
  );
};

/** 投稿にいいね（toggle） */
export const toggleLikePost = async (postId: string, userId: string, isLiked: boolean) => {
  const { arrayUnion, arrayRemove } = await import('firebase/firestore');
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
};

/** ユーザープロフィールを取得 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const { getDoc } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

/** プロフィールを作成/更新 */
export const upsertUserProfile = async (profile: Partial<UserProfile> & { uid: string }) => {
  const { setDoc } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', profile.uid);
  await setDoc(ref, profile, { merge: true });
};

/** 今日投稿済みかチェックしてStreakを更新 */
export const updateStreak = async (uid: string) => {
  const { getDoc, setDoc, increment } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  const today = new Date().toISOString().split('T')[0];

  if (snap.exists()) {
    const data = snap.data() as UserProfile & { lastPostDate?: string };
    if (data.lastPostDate === today) return; // 今日はもう更新済み
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = data.lastPostDate === yesterday ? (data.streak ?? 0) + 1 : 1;
    await setDoc(ref, { streak: newStreak, lastPostDate: today, hasPostedToday: true }, { merge: true });
  }
};
// ─── リアルタイムステータス ───────────────────────────────────

export const updateCurrentActivity = async (uid: string, activity: {
  title: string; emoji: string; endsAt: Date;
} | null) => {
  const { setDoc } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', uid);
  await setDoc(ref, {
    currentActivity: activity,
    status: activity ? 'active' : 'idle',
  }, { merge: true });
};

// ─── コンボシステム ──────────────────────────────────────────

export const updateCombo = async (uid: string): Promise<number> => {
  const { getDoc, setDoc, increment } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return 1;

  const data = snap.data();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastDate = data.comboLastDate;

  let newCombo = 1;
  if (lastDate === today) {
    newCombo = (data.comboCount ?? 0) + 1; // 同日連続達成
  } else if (lastDate === yesterday) {
    newCombo = (data.comboCount ?? 0) + 1; // 翌日継続
  }

  await setDoc(ref, {
    comboCount: newCombo,
    comboLastDate: today,
    score: (data.score ?? 0) + newCombo * 5,
  }, { merge: true });

  return newCombo;
};

// ─── 賭けチャレンジ ──────────────────────────────────────────

export const createChallenge = async (challenge: {
  creatorId: string;
  title: string;
  description: string;
  targetDate: string;
  pointAmount: number;
}) => {
  const { addDoc, collection } = await import('firebase/firestore');
  return addDoc(collection(db, 'challenges'), {
    ...challenge,
    stakersFor: [challenge.creatorId],
    stakersAgainst: [],
    status: 'open',
    result: null,
    createdAt: Timestamp.now(),
  });
};

export const stakeChallenge = async (
  challengeId: string, userId: string, side: 'for' | 'against'
) => {
  const { arrayUnion, arrayRemove } = await import('firebase/firestore');
  const ref = doc(db, 'challenges', challengeId);
  await updateDoc(ref, {
    stakersFor:     side === 'for'     ? arrayUnion(userId) : arrayRemove(userId),
    stakersAgainst: side === 'against' ? arrayUnion(userId) : arrayRemove(userId),
  });
};

// ─── BeRealイベント ──────────────────────────────────────────

export const createBeRealEvent = async () => {
  const { addDoc, collection } = await import('firebase/firestore');
  const deadline = new Date(Date.now() + 2 * 60 * 1000); // 2分後
  return addDoc(collection(db, 'beRealEvents'), {
    triggeredAt: Timestamp.now(),
    deadline,
    respondedUserIds: [],
    missedUserIds: [],
  });
};

export const respondToBeReal = async (eventId: string, userId: string) => {
  const { arrayUnion } = await import('firebase/firestore');
  const ref = doc(db, 'beRealEvents', eventId);
  await updateDoc(ref, { respondedUserIds: arrayUnion(userId) });
};

// ─── ゴーストデータ記録 ──────────────────────────────────────

export const recordDailyScore = async (uid: string, score: number) => {
  const { setDoc } = await import('firebase/firestore');
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'ghostData', `${uid}_${today}`);
  await setDoc(ref, { uid, date: today, score, createdAt: Timestamp.now() });
};

export const getGhostData = async (uid: string): Promise<{ date: string; score: number }[]> => {
  const { getDocs, collection, query, where, orderBy, limit } = await import('firebase/firestore');
  const q = query(
    collection(db, 'ghostData'),
    where('uid', '==', uid),
    orderBy('date', 'desc'),
    limit(14)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as { date: string; score: number });
};
// ─── フレンド検索・追加 ──────────────────────────────────────

export const searchUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const { getDocs, collection: col, query: q2, where: wh } = await import('firebase/firestore');
  const q = q2(col(db, 'userProfiles'), wh('handle', '==', `@${email.split('@')[0]}`));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
};

export const searchUserByUid = async (uid: string): Promise<UserProfile | null> => {
  const { getDoc } = await import('firebase/firestore');
  const ref = doc(db, 'userProfiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
};

export const sendFriendRequest = async (fromUid: string, toUid: string) => {
  const { addDoc, collection: col } = await import('firebase/firestore');
  await addDoc(col(db, 'friendRequests'), {
    fromUid,
    toUid,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

export const getIncomingFriendRequests = async (uid: string) => {
  const { getDocs, collection: col, query: q2, where: wh } = await import('firebase/firestore');
  const q = q2(
    col(db, 'friendRequests'),
    wh('toUid', '==', uid),
    wh('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const acceptFriendRequest = async (requestId: string, fromUid: string, toUid: string) => {
  const { arrayUnion, updateDoc: upd } = await import('firebase/firestore');
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  await updateDoc(doc(db, 'userProfiles', fromUid), { followingIds: arrayUnion(toUid) });
  await updateDoc(doc(db, 'userProfiles', toUid), {
    followingIds: arrayUnion(fromUid),
    followerIds: arrayUnion(fromUid),
  });
};

export const rejectFriendRequest = async (requestId: string) => {
  const { updateDoc: upd } = await import('firebase/firestore');
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
};

export const removeFriend = async (myUid: string, friendUid: string) => {
  const { arrayRemove } = await import('firebase/firestore');
  await updateDoc(doc(db, 'userProfiles', myUid), {
    followingIds: arrayRemove(friendUid),
    followerIds: arrayRemove(friendUid),
  });
  await updateDoc(doc(db, 'userProfiles', friendUid), {
    followingIds: arrayRemove(myUid),
    followerIds: arrayRemove(myUid),
  });
};