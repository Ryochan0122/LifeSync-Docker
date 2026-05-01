// src/utils/StorageService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Schedule } from "../types";

const STORAGE_KEY = "schedules";

// 全予定取得
export const loadSchedules = async (): Promise<Schedule[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("取得エラー:", e);
    return [];
  }
};

// 全予定保存
export const saveSchedules = async (schedules: Schedule[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  } catch (e) {
    console.error("保存エラー:", e);
  }
};

// 予定追加（個別保存用）
export const saveSchedule = async (schedule: Schedule) => {
  try {
    const schedules = await loadSchedules();
    const updated = [...schedules, { ...schedule, id: Date.now().toString() }];
    await saveSchedules(updated);
  } catch (e) {
    console.error("追加保存エラー:", e);
  }
};

// 予定削除
export const deleteSchedule = async (id: string) => {
  try {
    const schedules = await loadSchedules();
    const updated = schedules.filter((s) => s.id !== id);
    await saveSchedules(updated);
  } catch (e) {
    console.error("削除エラー:", e);
  }
};