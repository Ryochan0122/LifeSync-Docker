import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { Picker } from "@react-native-picker/picker";

type Props = {
  reminders: number[];
  setReminders: (reminders: number[]) => void;
  disabled?: boolean; // ← 有料限定時の無効化対応
};

export default function ReminderPicker({ reminders, setReminders, disabled = false }: Props) {
  const [selectedValue, setSelectedValue] = useState("10");
  const [customValue, setCustomValue] = useState("");

  const addReminder = () => {
    if (disabled) return; // 無効時は何もしない

    const valueToAdd = customValue || selectedValue;
    if (!valueToAdd || isNaN(Number(valueToAdd))) return;

    const numValue = parseInt(valueToAdd, 10);
    if (!reminders.includes(numValue)) {
      setReminders([...reminders, numValue]);
    }

    setCustomValue("");
  };

  return (
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: "bold" }}>リマインダー設定</Text>
      <Picker
        selectedValue={selectedValue}
        onValueChange={setSelectedValue}
        enabled={!disabled}
      >
        <Picker.Item label="5分前" value="5" />
        <Picker.Item label="10分前" value="10" />
        <Picker.Item label="30分前" value="30" />
        <Picker.Item label="1時間前" value="60" />
        <Picker.Item label="1日前" value="1440" />
      </Picker>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          marginTop: 10,
          padding: 5,
          backgroundColor: disabled ? "#f0f0f0" : "#fff",
        }}
        placeholder="分数を入力（任意）"
        keyboardType="numeric"
        value={customValue}
        onChangeText={setCustomValue}
        editable={!disabled}
      />

      <Button title="追加" onPress={addReminder} disabled={disabled} />

      <FlatList
        style={{ marginTop: 10 }}
        data={reminders}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => <Text>• {item}分前</Text>}
      />
    </View>
  );
}