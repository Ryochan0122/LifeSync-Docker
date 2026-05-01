import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>このページは使われていません</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07070F' },
  text:      { color: '#8888AA', fontSize: 14 },
});