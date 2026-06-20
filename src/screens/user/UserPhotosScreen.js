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
  Image,
  Modal,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3;

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const ANGLES = [
  { key: 'frontal', label: 'Frontal', icon: 'body-outline' },
  { key: 'lateral', label: 'Lateral', icon: 'walk-outline' },
  { key: 'trasera', label: 'Trasera', icon: 'body-outline' },
];

function UploadModal({ visible, onClose, onUploaded }) {
  const [angle, setAngle] = useState('frontal');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => { setAngle('frontal'); setImage(null); };
  const handleClose = () => { reset(); onClose(); };

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso para continuar');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, name: 'photo.jpg', type: 'image/jpeg' });
    }
  };

  const handleUpload = async () => {
    if (!image) { Alert.alert('Error', 'Selecciona o toma una foto'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', { uri: image.uri, name: image.name, type: image.type });
      form.append('angle', angle);
      await client.post(ENDPOINTS.UPLOAD_PHOTO, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded();
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Nueva foto de progreso</Text>
          <Text style={styles.modalLabel}>Ángulo</Text>
          <View style={styles.anglesRow}>
            {ANGLES.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[styles.angleChip, angle === a.key && styles.angleChipActive]}
                onPress={() => setAngle(a.key)}
              >
                <Ionicons name={a.icon} size={16} color={angle === a.key ? COLORS.dark : COLORS.silver} />
                <Text style={[styles.angleChipText, angle === a.key && styles.angleChipTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modalLabel}>Foto</Text>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickButtons}>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera-outline" size={24} color={COLORS.silver} />
                <Text style={styles.pickBtnText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images-outline" size={24} color={COLORS.silver} />
                <Text style={styles.pickBtnText}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={handleClose}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalBtn, (!image || uploading) && { opacity: 0.5 }]}
              onPress={handleUpload}
              disabled={!image || uploading}
            >
              {uploading ? <ActivityIndicator size="small" color={COLORS.dark} /> : <Text style={styles.confirmModalText}>Subir foto</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MonthSection({ monthData, onPhotoPress, onDelete }) {
  return (
    <View style={styles.monthSection}>
      <Text style={styles.monthTitle}>{MONTHS[monthData.month - 1]} {monthData.year}</Text>
      <View style={styles.photosRow}>
        {ANGLES.map(angle => {
          const photo = monthData.photos[angle.key];
          return (
            <View key={angle.key} style={styles.photoSlot}>
              <TouchableOpacity
                onPress={() => photo && onPhotoPress(photo)}
                activeOpacity={photo ? 0.8 : 1}
              >
                {photo ? (
                  <View>
                    <Image source={{ uri: photo.photo_url }} style={styles.photoImg} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => onDelete(photo)}
                    >
                      <Ionicons name="trash" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyPhotoSlot}>
                    <Ionicons name="image-outline" size={20} color={COLORS.border} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoAngleLabel}>{angle.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CompareModal({ visible, onClose, months, onPhotoPress }) {
  const [period1, setPeriod1] = useState(null);
  const [period2, setPeriod2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAngle, setSelectedAngle] = useState('frontal');
  const [step, setStep] = useState(1);

  const reset = () => {
    setPeriod1(null);
    setPeriod2(null);
    setComparison(null);
    setStep(1);
    setSelectedAngle('frontal');
  };

  const handleClose = () => { reset(); onClose(); };

  const selectPeriod = (m) => {
    if (step === 1) {
      setPeriod1(m);
      setStep(2);
    } else {
      setPeriod2(m);
      loadComparison(period1, m);
    }
  };

  const loadComparison = async (p1, p2) => {
    setLoading(true);
    try {
      const res = await client.get(
        `${ENDPOINTS.COMPARE_PHOTOS}?month1=${p1.month}&year1=${p1.year}&month2=${p2.month}&year2=${p2.year}`
      );
      setComparison(res.data.comparison);
      setStep(3);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la comparación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.compareHeader}>
            <Text style={styles.modalTitle}>Comparar meses</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {step === 1 && (
            <>
              <Text style={styles.compareInstruction}>Selecciona el primer mes</Text>
              {months.map((m, i) => (
                <TouchableOpacity key={i} style={styles.monthOption} onPress={() => selectPeriod(m)}>
                  <Text style={styles.monthOptionText}>{MONTHS[m.month - 1]} {m.year}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.compareInstruction}>
                Primer mes: <Text style={{ color: COLORS.silver }}>{MONTHS[period1.month - 1]} {period1.year}</Text>
              </Text>
              <Text style={styles.compareInstruction}>Selecciona el segundo mes</Text>
              {months.map((m, i) => (
                <TouchableOpacity key={i} style={styles.monthOption} onPress={() => selectPeriod(m)}>
                  <Text style={styles.monthOptionText}>{MONTHS[m.month - 1]} {m.year}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 3 && loading && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.silver} />
            </View>
          )}

          {step === 3 && !loading && comparison && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de ángulo */}
              <View style={styles.anglesRow}>
                {ANGLES.map(a => (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.angleChip, selectedAngle === a.key && styles.angleChipActive]}
                    onPress={() => setSelectedAngle(a.key)}
                  >
                    <Text style={[styles.angleChipText, selectedAngle === a.key && styles.angleChipTextActive]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comparación lado a lado */}
              <View style={styles.compareRow}>
                <View style={styles.compareCol}>
                  <Text style={styles.comparePeriodLabel}>
                    {MONTHS_SHORT[comparison.period_1.month - 1]} {comparison.period_1.year}
                  </Text>
                  {comparison.period_1.photos[selectedAngle] ? (
                    <TouchableOpacity onPress={() => onPhotoPress(comparison.period_1.photos[selectedAngle])}>
                      <Image
                        source={{ uri: comparison.period_1.photos[selectedAngle].photo_url }}
                        style={styles.comparePhoto}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.comparePhoto, styles.emptyComparePhoto]}>
                      <Ionicons name="image-outline" size={32} color={COLORS.border} />
                      <Text style={styles.emptyCompareText}>Sin foto</Text>
                    </View>
                  )}
                </View>
                <View style={styles.compareCol}>
                  <Text style={styles.comparePeriodLabel}>
                    {MONTHS_SHORT[comparison.period_2.month - 1]} {comparison.period_2.year}
                  </Text>
                  {comparison.period_2.photos[selectedAngle] ? (
                    <TouchableOpacity onPress={() => onPhotoPress(comparison.period_2.photos[selectedAngle])}>
                      <Image
                        source={{ uri: comparison.period_2.photos[selectedAngle].photo_url }}
                        style={styles.comparePhoto}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.comparePhoto, styles.emptyComparePhoto]}>
                      <Ionicons name="image-outline" size={32} color={COLORS.border} />
                      <Text style={styles.emptyCompareText}>Sin foto</Text>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.resetCompareBtn} onPress={reset}>
                <Text style={styles.resetCompareText}>Nueva comparación</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function UserPhotosScreen({ navigation }) {

  const { user } = useAuth();
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadPhotos = useCallback(async () => {
    try {
      const res = await client.get(ENDPOINTS.PHOTOS_BY_MONTH);
      setMonths(res.data.months || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las fotos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleDelete = (photo) => {
    Alert.alert(
      'Eliminar foto',
      '¿Eliminar esta foto de progreso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(ENDPOINTS.DELETE_PHOTO(photo.id));
              loadPhotos();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la foto');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Fotos</Text>
        <View style={styles.headerActions}>
          {months.length >= 2 && (
            <TouchableOpacity style={styles.compareBtn} onPress={() => setShowCompare(true)}>
              <Ionicons name="git-compare-outline" size={18} color={COLORS.silver} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.uploadBtn} onPress={() => setShowUpload(true)}>
            <Ionicons name="add" size={20} color={COLORS.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile')}
            style={styles.profileButton}
          >
            {user?.profile_photo ? (
              <Image
                source={{
                  uri: `${user.profile_photo}?t=${Date.now()}`
                }}
                style={styles.headerAvatar}
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={38}
                color={COLORS.silver}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.privacyBanner}>
        <Ionicons name="lock-closed-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.privacyText}>Tus fotos son privadas, solo tú puedes verlas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.silver} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPhotos(); }} tintColor={COLORS.silver} />}
          showsVerticalScrollIndicator={false}
        >
          {months.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin fotos de progreso</Text>
              <Text style={styles.emptySubtitle}>Sube tu primera foto para empezar a documentar tu evolución</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowUpload(true)}>
                <Text style={styles.emptyBtnText}>Subir primera foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            months.map((m) => (
              <MonthSection
                key={`${m.year}-${m.month}`}
                monthData={m}
                onPhotoPress={setPreviewPhoto}
                onDelete={handleDelete}
              />
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Preview modal con zoom */}
      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewPhoto(null)}
          >
            <Ionicons name="close-circle" size={32} color={COLORS.text} />
          </TouchableOpacity>
          {previewPhoto && (
            <ImageViewer
              imageUrls={[{ url: previewPhoto.photo_url }]}
              enableSwipeDown
              onSwipeDown={() => setPreviewPhoto(null)}
              renderIndicator={() => null}
              backgroundColor="#000"
            />
          )}
        </View>
      </Modal>

      <UploadModal visible={showUpload} onClose={() => setShowUpload(false)} onUploaded={loadPhotos} />
      <CompareModal visible={showCompare} onClose={() => setShowCompare(false)} months={months} onPhotoPress={setPreviewPhoto} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareBtn: { backgroundColor: COLORS.card, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  uploadBtn: { backgroundColor: COLORS.silver, padding: 10, borderRadius: 12 },
  profileButton: { borderRadius: 20 },
  privacyBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingBottom: 16 },
  privacyText: { fontSize: 12, color: COLORS.textSecondary },
  scrollContent: { paddingHorizontal: 20 },
  monthSection: { marginBottom: 24 },
  monthTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  photosRow: { flexDirection: 'row', gap: 10 },
  photoSlot: { width: PHOTO_SIZE, gap: 6 },
  photoImg: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 12, backgroundColor: COLORS.card },
  deletePhotoBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: 8, padding: 4 },
  emptyPhotoSlot: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  photoAngleLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
  emptyBtn: { marginTop: 8, backgroundColor: COLORS.silver, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  previewClose: { position: 'absolute', top: 55, right: 20, zIndex: 10 },
  previewImage: { width: '90%', height: '75%', borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 4 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 8 },
  anglesRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  angleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.darkGray, borderWidth: 1, borderColor: COLORS.border },
  angleChipActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  angleChipText: { fontSize: 13, color: COLORS.silver, fontWeight: '500' },
  angleChipTextActive: { color: COLORS.dark, fontWeight: 'bold' },
  pickButtons: { flexDirection: 'row', gap: 10 },
  pickBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  pickBtnText: { color: COLORS.silver, fontSize: 13, fontWeight: '500' },
  imagePreview: { position: 'relative', borderRadius: 12, overflow: 'hidden', alignSelf: 'center' },
  previewImg: { width: 160, height: 213, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  confirmModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.silver, alignItems: 'center' },
  confirmModalText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
  compareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  compareInstruction: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  monthOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  monthOptionText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  compareRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  compareCol: { flex: 1, alignItems: 'center', gap: 8 },
  comparePeriodLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.silver },
  comparePhoto: { width: '100%', aspectRatio: 3/4, borderRadius: 12 },
  emptyComparePhoto: { backgroundColor: COLORS.darkGray, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyCompareText: { fontSize: 12, color: COLORS.textSecondary },
  resetCompareBtn: { marginTop: 20, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  resetCompareText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.silver,
  },
});