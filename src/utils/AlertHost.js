import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { subscribeAlerts, dismissAlert } from '../utils/alertWeb';

const getIcon = (alert) => {
  const title = `${alert.title || ''}`.toLowerCase();
  if (alert.buttons.some((b) => b.style === 'destructive')) {
    return { name: 'warning', color: COLORS.warning };
  }
  if (/error|no se pudo|fall/.test(title)) {
    return { name: 'close-circle', color: COLORS.danger };
  }
  if (/éxito|exito|listo|copiado|actualizad|creada/.test(title)) {
    return { name: 'checkmark-circle', color: COLORS.success };
  }
  return { name: 'information-circle', color: COLORS.silver };
};

export default function AlertHost() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    return subscribeAlerts(setAlert);
  }, []);

  if (Platform.OS !== 'web' || !alert) return null;

  const press = (btn) => {
    dismissAlert();
    if (btn.onPress) btn.onPress();
  };

  // Clic fuera del cuadro o tecla Esc
  const onClose = () => {
    const cancel = alert.buttons.find((b) => b.style === 'cancel');
    if (cancel) press(cancel);
    else if (alert.buttons.length === 1) press(alert.buttons[0]);
  };

  const icon = getIcon(alert);
  const stacked = alert.buttons.length > 2;
  const cancelBtns = alert.buttons.filter((b) => b.style === 'cancel');
  const otherBtns = alert.buttons.filter((b) => b.style !== 'cancel');
  const ordered = stacked ? [...otherBtns, ...cancelBtns] : [...cancelBtns, ...otherBtns];

  return (
    <Modal key={alert.id} visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: icon.color + '22' }]}>
            <Ionicons name={icon.name} size={30} color={icon.color} />
          </View>

          {!!alert.title && <Text style={styles.title}>{alert.title}</Text>}
          {!!alert.message && (
            <Text style={styles.message} selectable>
              {alert.message}
            </Text>
          )}

          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {ordered.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <Pressable
                  key={i}
                  onPress={() => press(btn)}
                  style={({ pressed, hovered }) => [
                    styles.btn,
                    !stacked && styles.btnFlex,
                    isCancel ? styles.btnCancel : isDestructive ? styles.btnDanger : styles.btnPrimary,
                    (pressed || hovered) && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel
                        ? { color: COLORS.textSecondary }
                        : isDestructive
                        ? { color: '#fff' }
                        : { color: COLORS.dark },
                    ]}
                  >
                    {btn.text || 'Aceptar'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    cursor: 'default',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    cursor: 'default',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  buttonsStacked: {
    flexDirection: 'column',
  },
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFlex: { flex: 1 },
  btnPrimary: { backgroundColor: COLORS.silver },
  btnDanger: { backgroundColor: COLORS.danger },
  btnCancel: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'transparent' },
  btnText: { fontSize: 14, fontWeight: 'bold' },
});