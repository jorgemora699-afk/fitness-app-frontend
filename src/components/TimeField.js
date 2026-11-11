import React, { useState } from 'react';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import TimePickerModal from './TimePickerModal';

const box = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.darkGray,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: COLORS.border,
  gap: 8,
};

export default function TimeField({ value, onChange, title }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={box}>
        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
        {React.createElement('input', {
          type: 'time',
          value,
          onChange: (e) => e.target.value && onChange(e.target.value),
          style: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: COLORS.text,
            fontSize: 14,
            colorScheme: 'dark',
          },
        })}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={box} onPress={() => setShow(true)}>
        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
        <Text style={{ flex: 1, color: COLORS.text, fontSize: 14 }}>{value}</Text>
      </TouchableOpacity>
      <TimePickerModal
        visible={show}
        value={value}
        title={title}
        onConfirm={(time) => onChange(time)}
        onClose={() => setShow(false)}
      />
    </>
  );
}