import { Platform } from 'react-native';

export async function appendArchivo(formData, campo, asset, opts = {}) {
  const name = opts.name || asset.fileName || asset.name || 'archivo.jpg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(asset.uri)).blob();
    formData.append(campo, blob, name);
  } else {
    formData.append(campo, {
      uri: asset.uri,
      name,
      type: opts.type || asset.mimeType || asset.type || 'image/jpeg',
    });
  }
}