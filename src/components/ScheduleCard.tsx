import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Schedule } from '../types';
import Icon from 'react-native-vector-icons/Feather'; // アイコンライブラリを使用

interface ScheduleCardProps {
  schedule: Schedule;
  onPress: () => void;
}

// プライオリティに基づいた色定義
const priorityColors: { [key in Schedule['priority']]: string } = {
  '高': '#E74C3C', // Red
  '中': '#F39C12', // Orange
  '低': '#2ECC71', // Green
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onPress }) => {
  const accentColor = priorityColors[schedule.priority] || '#3498DB'; // Default Blue

  const formattedReminders = useMemo(() => {
    if (!schedule.reminders || schedule.reminders.length === 0) return 'なし';
    return schedule.reminders.map(m => `${m}分前`).join(', ');
  }, [schedule.reminders]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      {/* 左側のアクセントバー */}
      <View style={[styles.priorityBar, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        {/* タイトルと時間 */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {schedule.title}
          </Text>
          <View style={styles.timeWrapper}>
            <Icon name="clock" size={14} color="#666" style={{ marginRight: 4 }} />
            <Text style={styles.time}>{schedule.time}</Text>
          </View>
        </View>

        {/* 詳細情報 */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="alert-triangle" size={14} color="#666" style={styles.icon} />
            <Text style={styles.detailText}>優先度: </Text>
            <Text style={[styles.priorityText, { color: accentColor }]}>{schedule.priority}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="bell" size={14} color="#666" style={styles.icon} />
            <Text style={styles.detailText}>リマインダー: {formattedReminders}</Text>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden', // priorityBarの角丸を制御
  },
  priorityBar: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flexShrink: 1,
    marginRight: 10,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
  }
});

export default ScheduleCard;
