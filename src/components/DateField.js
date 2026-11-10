import React, { useState } from 'react';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const box = { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border, gap: 8, marginBottom: 4 };

export default function DateField({ value, onChange, label }) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={box}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        {React.createElement('input', {
          type: 'date',
          value,
          onChange: (e) => e.target.value && onChange(e.target.value),
          style: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.text, fontSize: 14, colorScheme: 'dark' },
        })}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={box} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        <Text style={{ flex: 1, color: COLORS.text, fontSize: 14 }}>{label}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={new Date(value + 'T00:00:00')}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setShow(false);
            if (selected) {
              const y = selected.getFullYear();
              const m = String(selected.getMonth() + 1).padStart(2, '0');
              const d = String(selected.getDate()).padStart(2, '0');
              onChange(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
    </>
  );
}