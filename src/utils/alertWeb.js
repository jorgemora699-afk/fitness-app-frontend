import { Alert, Platform } from 'react-native';

const listeners = new Set();
const queue = [];
let current = null;
let nextId = 1;

const emit = () => listeners.forEach((fn) => fn(current));

const showNext = () => {
  if (current || queue.length === 0) return;
  current = queue.shift();
  emit();
};

export const subscribeAlerts = (fn) => {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
};

export const dismissAlert = () => {
  current = null;
  emit();
  showNext();
};

const sameAlert = (a, b) => a.title === b.title && a.message === b.message;

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const item = {
      id: nextId++,
      title,
      message,
      buttons: Array.isArray(buttons) && buttons.length > 0 ? buttons : [{ text: 'Aceptar' }],
    };
    // Evita apilar avisos idénticos (por ejemplo, varias peticiones fallando a la vez)
    if ((current && sameAlert(current, item)) || queue.some((q) => sameAlert(q, item))) return;
    queue.push(item);
    showNext();
  };
}