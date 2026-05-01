import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const QuestionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>質問画面（未実装）</Text>
    </View>
  );
};

export default QuestionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});