import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, ENDPOINTS } from '../../utils/constants';

export default function TrainerProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
      ]
    );
  };

  const copyCode = () => {
    const Clipboard = require('react-native').Clipboard;
    Clipboard.setString(user?.trainer_code || '');
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset) => {
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', {
        uri: asset.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      const response = await client.post(ENDPOINTS.UPLOAD_TRAINER_PHOTO, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await updateUser(response.data.trainer);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deletePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const response = await client.delete(ENDPOINTS.DELETE_TRAINER_PHOTO);
      await updateUser(response.data.trainer);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    setLoading(true);
    try {
      const response = await client.put(`/api/auth/trainers/me`, form);
      setUser(response.data.trainer);
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
      >
        <View style={styles.photoModalOverlay}>

          <TouchableOpacity
            style={styles.closePhotoButton}
            onPress={() => setShowPhotoModal(false)}
          >
            <Ionicons
              name="close"
              size={30}
              color="#fff"
            />
          </TouchableOpacity>

          <Image
            source={{ uri: user?.profile_photo }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />

          <View style={styles.photoActions}>

            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={() => {
                setShowPhotoModal(false);
                handlePickPhoto();
              }}
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={COLORS.text}
              />
              <Text style={styles.photoActionText}>
                Cambiar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoActionButton}
              onPress={() => {
                setShowPhotoModal(false);

                Alert.alert(
                  'Eliminar foto',
                  '¿Eliminar tu foto de perfil?',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel'
                    },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: deletePhoto
                    }
                  ]
                );
              }}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={COLORS.danger}
              />
              <Text
                style={[
                  styles.photoActionText,
                  { color: COLORS.danger }
                ]}
              >
                Eliminar foto
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editButton}>
          <Ionicons name={editing ? 'close-outline' : 'create-outline'} size={24} color={COLORS.silver} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => {
              if (user?.profile_photo) {
                setShowPhotoModal(true);
              } else {
                handlePickPhoto();
              }
            }}
            style={styles.avatarWrapper}
          >
            {user?.profile_photo ? (
              <Image source={{ uri: user.profile_photo }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Ionicons name="camera" size={16} color={COLORS.text} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>Entrenador Personal</Text>
        </View>

        {/* Código entrenador */}
        <TouchableOpacity style={styles.codeCard} onPress={copyCode}>
          <View style={styles.codeLeft}>
            <Ionicons name="key-outline" size={22} color={COLORS.silver} />
            <View>
              <Text style={styles.codeLabel}>Código de entrenador</Text>
              <Text style={styles.codeValue}>{user?.trainer_code}</Text>
            </View>
          </View>
          <View style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={18} color={COLORS.dark} />
            <Text style={styles.copyText}>Copiar</Text>
          </View>
        </TouchableOpacity>

        {/* Info / Formulario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>

          {editing ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.name}
                  onChangeText={(v) => setForm(prev => ({ ...prev, name: v }))}
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.phone}
                  onChangeText={(v) => setForm(prev => ({ ...prev, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={COLORS.dark} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Correo</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'No registrado'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Miembro desde</Text>
                  <Text style={styles.infoValue}>
                    {new Date(user?.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  editButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  avatarContainer: { alignItems: 'center', paddingVertical: 25 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.darkGray, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.silver },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORS.silver },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.silver },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.darkGray, borderRadius: 12, padding: 5, borderWidth: 1, borderColor: COLORS.border },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  userRole: { fontSize: 14, color: COLORS.textSecondary },
  codeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.darkGray, marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: COLORS.border },
  codeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  codeValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.silver, letterSpacing: 3 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.silver, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5 },
  copyText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 13 },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, padding: 15, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: COLORS.text, fontSize: 15 },
  saveButton: { backgroundColor: COLORS.silver, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold' },
  photoModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.95)',
  justifyContent: 'center',
  alignItems: 'center',
},

fullPhoto: {
  width: '100%',
  height: '70%',
},

closePhotoButton: {
  position: 'absolute',
  top: 60,
  right: 20,
  zIndex: 100,
},

photoActions: {
  position: 'absolute',
  bottom: 40,
  flexDirection: 'row',
  gap: 15,
},

photoActionButton: {
  backgroundColor: COLORS.card,
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
},

photoActionText: {
  color: COLORS.text,
  marginLeft: 8,
  fontWeight: '600',
},
});