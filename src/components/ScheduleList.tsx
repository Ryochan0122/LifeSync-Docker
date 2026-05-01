import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { Schedule } from '../types';
import ScheduleCard from './ScheduleCard'; 

interface ScheduleListProps {
  schedules: Schedule[];
  // 編集/詳細表示用のコールバック。Scheduleオブジェクトを受け取る
  onEdit: (schedule: Schedule) => void; 
  startIndex: number; // 現在はCalendarScreenで使用しないが、将来的に必要になる可能性を考慮して保持
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, startIndex }) => {
  if (schedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>この日は予定がありません。🎉</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item }) => (
        <ScheduleCard 
          schedule={item} 
          // ⭐️ onEditをonPressとしてScheduleCardに渡す ⭐️
          onPress={() => onEdit(item)} 
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false} // CalendarScreenのScrollView内で使用するため
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSansJP-Regular',
  },
});

export default ScheduleList;
