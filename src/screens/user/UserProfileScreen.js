import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
};

const daysLeft = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T00:00:00');
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

export default function UserProfileScreen({ navigation }) {
  const { logout, user, updateUser } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await client.get(ENDPOINTS.MY_PROFILE);
      setProfile(res.data.user);
      setMembership(res.data.membership || null);
    } catch (error) {
      console.log('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      Alert.alert('Aviso', 'Completa todos los campos');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await client.put(ENDPOINTS.CHANGE_PASSWORD, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      Alert.alert('¡Listo!', 'Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      const response = await client.post(
        ENDPOINTS.UPLOAD_MY_PHOTO,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      await updateUser(response.data.user);

      // refresca la pantalla
      loadProfile();

      Alert.alert('Éxito', 'Foto actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deletePhoto = async () => {
    setUploadingPhoto(true);

    try {
      const response = await client.delete(
        ENDPOINTS.DELETE_MY_PHOTO
      );

      await updateUser(response.data.user);

      loadProfile();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    const options = [
      {
        text: 'Cambiar foto',
        onPress: handlePickPhoto
      }
    ];

    if (profile?.profile_photo) {
      options.push({
        text: 'Eliminar foto',
        style: 'destructive',
        onPress: deletePhoto
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel'
    });

    Alert.alert(
      'Foto de perfil',
      'Selecciona una opción',
      options
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout }
      ]
    );
  };

  const getMembershipColor = () => {
    if (!membership) return COLORS.danger;
    if (membership.is_paid) return COLORS.success;
    return COLORS.warning;
  };

  const getMembershipText = () => {
    if (!membership) return 'Sin membresía activa';
    if (membership.is_paid) return 'Al día';
    return 'Pago pendiente';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.silver} />
      </View>
    );
  }

  const days = membership ? daysLeft(membership.end_date) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => {
              if (profile?.profile_photo) {
                setShowPhotoModal(true);
              } else {
                handlePickPhoto();
              }
            }}
            style={styles.avatarWrapper}
          >
            {profile?.profile_photo ? (
              <Image
                source={{ uri: profile.profile_photo }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0).toUpperCase()}
                  {profile?.last_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.cameraOverlay}>
              {uploadingPhoto ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.text}
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={16}
                  color={COLORS.text}
                />
              )}
            </View>
          </TouchableOpacity>


          <Text style={styles.userName}>
            {profile?.name} {profile?.last_name}
          </Text>

          <Text style={styles.userEmail}>
            {profile?.email}
          </Text>
        
          <View style={[styles.membershipBadge, { backgroundColor: `${getMembershipColor()}20` }]}>
            <View style={[styles.membershipDot, { backgroundColor: getMembershipColor() }]} />
            <Text style={[styles.membershipText, { color: getMembershipColor() }]}>
              {getMembershipText()}
            </Text>
          </View>
        </View>

        {/* Datos personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{profile?.phone || '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{profile?.age ? `${profile.age} años` : '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="fitness-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{profile?.weight ? `${profile.weight} kg` : '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="resize-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Altura</Text>
              <Text style={styles.infoValue}>{profile?.height ? `${profile.height} cm` : '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="body-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Grasa corporal</Text>
              <Text style={styles.infoValue}>{profile?.body_fat ? `${profile.body_fat}%` : '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="barbell-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Masa muscular</Text>
              <Text style={styles.infoValue}>{profile?.muscle_mass ? `${profile.muscle_mass} kg` : '—'}</Text>
            </View>
            {profile?.goal && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Ionicons name="flag-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.infoLabel}>Objetivo</Text>
                  <Text style={styles.infoValue}>{profile.goal}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Membresía */}
        {membership && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membresía</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Inicio</Text>
                <Text style={styles.infoValue}>{fmt(membership.start_date)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Vence</Text>
                <Text style={styles.infoValue}>{fmt(membership.end_date)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Días restantes</Text>
                <Text style={[
                  styles.infoValue,
                  { color: days <= 5 ? COLORS.warning : COLORS.success }
                ]}>
                  {days} días
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Valor</Text>
                <Text style={styles.infoValue}>
                  ${membership.amount?.toLocaleString('es-CO')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setShowPasswordModal(true)}
            >
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionLabel}>Cambiar contraseña</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Cerrar sesión</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
            source={{ uri: profile?.profile_photo }}
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
                deletePhoto();
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

      {/* Modal cambiar contraseña */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={() => {
                setShowPasswordModal(false);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
              }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwordForm.current_password}
                onChangeText={(v) => setPasswordForm(prev => ({ ...prev, current_password: v }))}
                placeholder="Contraseña actual"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showCurrent}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-open-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwordForm.new_password}
                onChangeText={(v) => setPasswordForm(prev => ({ ...prev, new_password: v }))}
                placeholder="Nueva contraseña"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-open-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={passwordForm.confirm_password}
                onChangeText={(v) => setPasswordForm(prev => ({ ...prev, confirm_password: v }))}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.saveButtonText}>Actualizar contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 15 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  avatarSection: { alignItems: 'center', paddingVertical: 25 },
  avatar: { width: 85, height: 85, borderRadius: 42, backgroundColor: COLORS.darkGray, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.silver, marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: COLORS.silver },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6 },
  membershipDot: { width: 8, height: 8, borderRadius: 4 },
  membershipText: { fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  infoLabel: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  actionLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: COLORS.text, fontSize: 15 },
  saveButton: { backgroundColor: COLORS.silver, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
  avatarWrapper: {
  position: 'relative',
  marginBottom: 8,
},

avatarImage: {
  width: 85,
  height: 85,
  borderRadius: 42,
  borderWidth: 2,
  borderColor: COLORS.silver,
},

cameraOverlay: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: COLORS.darkGray,
  borderRadius: 12,
  padding: 5,
  borderWidth: 1,
  borderColor: COLORS.border,
},
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
  zIndex: 10,
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
headerAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  borderWidth: 2,
  borderColor: COLORS.silver,
},

});