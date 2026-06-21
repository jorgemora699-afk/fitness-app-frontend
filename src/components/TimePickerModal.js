import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { COLORS } from '../utils/constants';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function ScrollPicker({ data, selectedValue, onValueChange }) {
  const flatListRef = useRef(null);
  const selectedIndex = data.indexOf(selectedValue);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index >= 0 && index < data.length) {
      onValueChange(data[index]);
    }
  };

  return (
    <View style={styles.pickerColumn}>
      {/* Indicador de selección */}
      <View style={styles.selectionIndicator} pointerEvents="none" />

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        renderItem={({ item }) => {
          const isSelected = item === selectedValue;
          return (
            <View style={styles.pickerItem}>
              <Text style={[
                styles.pickerItemText,
                isSelected && styles.pickerItemTextSelected,
              ]}>
                {item}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export default function TimePickerModal({ visible, value, onConfirm, onClose, title = 'Seleccionar hora' }) {
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');

  useEffect(() => {
    if (value && visible) {
      const parts = value.split(':');
      if (parts.length === 2) {
        setSelectedHour(parts[0].padStart(2, '0'));
        // Redondear al múltiplo de 5 más cercano
        const min = Math.round(parseInt(parts[1]) / 5) * 5;
        setSelectedMinute(String(min === 60 ? 55 : min).padStart(2, '0'));
      }
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onConfirm(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {/* Previsualización */}
          <View style={styles.preview}>
            <Text style={styles.previewText}>{selectedHour}:{selectedMinute}</Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickersRow}>
            <ScrollPicker
              data={hours}
              selectedValue={selectedHour}
              onValueChange={setSelectedHour}
            />
            <Text style={styles.colon}>:</Text>
            <ScrollPicker
              data={minutes}
              selectedValue={selectedMinute}
              onValueChange={setSelectedMinute}
            />
          </View>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },

  // Preview
  preview: { alignItems: 'center', marginBottom: 20 },
  previewText: { fontSize: 48, fontWeight: 'bold', color: COLORS.silver, letterSpacing: 4 },

  // Pickers
  pickersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: ITEM_HEIGHT * VISIBLE_ITEMS },
  pickerColumn: { width: 80, height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden' },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.silver,
    backgroundColor: 'transparent',
    zIndex: 1,
    },
  pickerItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  pickerItemText: { fontSize: 22, color: COLORS.textSecondary, fontWeight: '500' },
  pickerItemTextSelected: { fontSize: 26, color: COLORS.silver, fontWeight: 'bold' },
  colon: { fontSize: 32, fontWeight: 'bold', color: COLORS.silver, marginHorizontal: 12 },

  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.silver, alignItems: 'center' },
  confirmText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
});