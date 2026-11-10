import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const texto = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length === 0) { window.alert(texto); return; }
    if (buttons.length === 1) { window.alert(texto); buttons[0].onPress?.(); return; }

    const cancel = buttons.find(b => b.style === 'cancel');
    const acciones = buttons.filter(b => b !== cancel);

    if (acciones.length === 1) {
      if (window.confirm(texto)) acciones[0].onPress?.();
      else cancel?.onPress?.();
      return;
    }
    // Varias acciones: pedir número
    const lista = acciones.map((b, i) => `${i + 1}) ${b.text}`).join('\n');
    const r = parseInt(window.prompt(`${texto}\n\n${lista}`), 10);
    if (r >= 1 && r <= acciones.length) acciones[r - 1].onPress?.();
  };
}