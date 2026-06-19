import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
};

const toISO = (dateObj) => dateObj.toISOString().split('T')[0];

const isActive = (m) => {
  if (!m.is_paid) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(m.end_date + 'T00:00:00') >= today;
};

const daysLeft = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T00:00:00');
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

// ─── Membership Card ─────────────────────────────────────────────────────────

function MembershipCard({ membership, onConfirmPayment }) {
  const [previewReceipt, setPreviewReceipt] = useState(false);

  const active = isActive(membership);
  const pending = !membership.is_paid;
  const expired = membership.is_paid && !active;
  const days = membership.is_paid ? daysLeft(membership.end_date) : null;

  let statusLabel = '';
  let statusColor = COLORS.textSecondary;
  if (active) {
    statusLabel = days <= 5 ? `Vence en ${days}d` : 'Activa';
    statusColor = days <= 5 ? COLORS.warning : COLORS.success;
  } else if (pending) {
    statusLabel = 'Pago pendiente';
    statusColor = COLORS.warning;
  } else if (expired) {
    statusLabel = 'Vencida';
    statusColor = COLORS.danger;
  }

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      {/* Status badge */}
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {membership.amount != null && (
          <Text style={styles.amountText}>
            ${membership.amount.toLocaleString('es-CO')}
          </Text>
        )}
      </View>

      {/* Fechas */}
      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Inicio</Text>
          <Text style={styles.dateValue}>{fmt(membership.start_date)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={COLORS.border} style={{ marginTop: 16 }} />
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Fin</Text>
          <Text style={styles.dateValue}>{fmt(membership.end_date)}</Text>
        </View>
      </View>

      {/* Método de pago */}
      {membership.payment_method && (
        <View style={styles.paymentRow}>
          <Ionicons
            name={membership.payment_method === 'cash' ? 'cash-outline' : 'card-outline'}
            size={14}
            color={COLORS.textSecondary}
          />
          <Text style={styles.paymentText}>
            {membership.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
          </Text>
          {membership.receipt_url && (
            <TouchableOpacity
              onPress={() => setPreviewReceipt(true)}
              style={styles.receiptLink}
            >
              <Ionicons name="eye-outline" size={13} color={COLORS.silver} />
              <Text style={styles.receiptLinkText}>Ver comprobante</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botón confirmar pago */}
      {pending && (
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirmPayment(membership)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.dark} />
          <Text style={styles.confirmBtnText}>Confirmar pago</Text>
        </TouchableOpacity>
      )}

      {/* Modal preview comprobante */}
      <Modal
        visible={previewReceipt}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewReceipt(false)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewReceipt(false)}
          >
            <Ionicons name="close-circle" size={32} color={COLORS.text} />
          </TouchableOpacity>
          <Image
            source={{ uri: membership.receipt_url }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Confirm Payment Modal ────────────────────────────────────────────────────

function ConfirmPaymentModal({ visible, membership, onClose, onSuccess }) {
  const [method, setMethod] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMethod(null);
    setReceipt(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
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
      const asset = result.assets[0];
      setReceipt({ uri: asset.uri, name: 'receipt.jpg', type: 'image/jpeg' });
    }
  };

  const handleConfirm = async () => {
    if (!method) {
      Alert.alert('Error', 'Selecciona el método de pago');
      return;
    }
    setSaving(true);
    try {
      if (method === 'transfer' && receipt) {
        const form = new FormData();
        form.append('payment_method', 'transfer');
        form.append('receipt', { uri: receipt.uri, name: receipt.name, type: receipt.type });
        await client.post(ENDPOINTS.CONFIRM_PAYMENT(membership.id), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await client.post(ENDPOINTS.CONFIRM_PAYMENT(membership.id), {
          payment_method: method,
        });
      }
      onSuccess();
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar el pago');
    } finally {
      setSaving(false);
    }
  };

  if (!membership) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Confirmar pago</Text>
          <Text style={styles.modalSubtitle}>
            {fmt(membership.start_date)} → {fmt(membership.end_date)}
          </Text>

          <Text style={styles.modalLabel}>Método de pago</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodBtn, method === 'cash' && styles.methodBtnActive]}
              onPress={() => setMethod('cash')}
              activeOpacity={0.8}
            >
              <Ionicons name="cash-outline" size={20} color={method === 'cash' ? COLORS.dark : COLORS.silver} />
              <Text style={[styles.methodBtnText, method === 'cash' && styles.methodBtnTextActive]}>
                Efectivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodBtn, method === 'transfer' && styles.methodBtnActive]}
              onPress={() => setMethod('transfer')}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={20} color={method === 'transfer' ? COLORS.dark : COLORS.silver} />
              <Text style={[styles.methodBtnText, method === 'transfer' && styles.methodBtnTextActive]}>
                Transferencia
              </Text>
            </TouchableOpacity>
          </View>

          {method === 'transfer' && (
            <View style={styles.receiptSection}>
              <Text style={styles.modalLabel}>Comprobante (opcional)</Text>
              {receipt ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: receipt.uri }} style={styles.receiptImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeReceiptBtn} onPress={() => setReceipt(null)}>
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.silver} />
                  <Text style={styles.uploadBtnText}>Subir comprobante</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={handleClose}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalBtn, (!method || saving) && styles.confirmModalBtnDisabled]}
              onPress={handleConfirm}
              disabled={!method || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.dark} />
              ) : (
                <Text style={styles.confirmModalText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Create Membership Form ───────────────────────────────────────────────────

function CreateMembershipForm({ userId, onCreated, onCancel }) {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const [startDate, setStartDate] = useState(toISO(today));
  const [startDateObj, setStartDateObj] = useState(today);
  const [showStartPicker, setShowStartPicker] = useState(false);

  const [endDate, setEndDate] = useState(toISO(nextMonth));
  const [endDateObj, setEndDateObj] = useState(nextMonth);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log('CREATE MEMBERSHIP PRESSED');
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Las fechas son obligatorias');
      return;
    }
    if (startDate >= endDate) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        amount: amount ? parseFloat(amount) : null,
      };
      console.log('CREATE MEMBERSHIP PAYLOAD', payload);

      const res = await client.post(ENDPOINTS.CREATE_MEMBERSHIP, payload);
      onCreated(res.data.membership);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la membresía');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.createForm}>
      <Text style={styles.createFormTitle}>Nueva membresía</Text>

      <Text style={styles.formLabel}>Fecha de inicio</Text>
      <TouchableOpacity
        style={styles.datePickerBtn}
        onPress={() => setShowStartPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.datePickerText}>{fmt(startDate)}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDateObj}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowStartPicker(false);
            if (selected) { setStartDateObj(selected); setStartDate(toISO(selected)); }
          }}
        />
      )}

      <Text style={styles.formLabel}>Fecha de fin</Text>
      <TouchableOpacity
        style={styles.datePickerBtn}
        onPress={() => setShowEndPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.datePickerText}>{fmt(endDate)}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDateObj}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowEndPicker(false);
            if (selected) { setEndDateObj(selected); setEndDate(toISO(selected)); }
          }}
        />
      )}

      <Text style={styles.formLabel}>Monto (opcional)</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor={COLORS.textSecondary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelEditBtn} onPress={onCancel}>
          <Text style={styles.cancelEditText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveEditBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.dark} />
          ) : (
            <Text style={styles.saveEditText}>Crear</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserMembershipScreen({ route, navigation }) {
  const { user } = route.params;
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadMemberships = useCallback(async () => {
    try {
      const res = await client.get(ENDPOINTS.MEMBERSHIP_HISTORY(user.id));
      setMemberships(res.data.memberships || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const handleConfirmPayment = (membership) => {
    setSelectedMembership(membership);
    setShowConfirmModal(true);
  };

  const handleCreated = (newMembership) => {
    setMemberships((prev) => [newMembership, ...prev]);
    setCreating(false);
  };

  const activeMembership = memberships.find(isActive);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Membresía</Text>
          <Text style={styles.headerSubtitle}>{user.name} {user.last_name}</Text>
        </View>
        {!creating && (
          <TouchableOpacity style={styles.newBtn} onPress={() => setCreating(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={COLORS.dark} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.silver} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadMemberships(); }}
              tintColor={COLORS.silver}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {creating && (
            <CreateMembershipForm
              userId={user.id}
              onCreated={handleCreated}
              onCancel={() => setCreating(false)}
            />
          )}

          {!creating && activeMembership && (
            <View style={styles.activeSummary}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
              <Text style={styles.activeSummaryText}>
                Activa hasta el{' '}
                <Text style={{ color: COLORS.success, fontWeight: 'bold' }}>
                  {fmt(activeMembership.end_date)}
                </Text>
                {daysLeft(activeMembership.end_date) <= 5 && (
                  <Text style={{ color: COLORS.warning }}> · Vence pronto</Text>
                )}
              </Text>
            </View>
          )}

          {memberships.length === 0 && !creating ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin membresías</Text>
              <Text style={styles.emptySubtitle}>Crea la primera membresía para {user.name}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreating(true)}>
                <Text style={styles.emptyBtnText}>Nueva membresía</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {memberships.length > 0 && (
                <Text style={styles.sectionTitle}>
                  Historial · {memberships.length} {memberships.length === 1 ? 'registro' : 'registros'}
                </Text>
              )}
              {memberships.map((m) => (
                <MembershipCard
                  key={m.id}
                  membership={m}
                  onConfirmPayment={handleConfirmPayment}
                />
              ))}
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <ConfirmPaymentModal
        visible={showConfirmModal}
        membership={selectedMembership}
        onClose={() => { setShowConfirmModal(false); setSelectedMembership(null); }}
        onSuccess={loadMemberships}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, gap: 12 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, lineHeight: 22 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  newBtn: { backgroundColor: COLORS.silver, padding: 10, borderRadius: 12 },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Active summary
  activeSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '44' },
  activeSummaryText: { flex: 1, fontSize: 14, color: COLORS.text },

  // Section title
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Card
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, gap: 12 },
  cardActive: { borderColor: COLORS.success + '55' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: { flex: 1, gap: 2 },
  dateLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentText: { fontSize: 13, color: COLORS.textSecondary },
  receiptLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  receiptLinkText: { fontSize: 13, color: COLORS.silver, textDecorationLine: 'underline' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.silver, borderRadius: 10, paddingVertical: 10 },
  confirmBtnText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },

  // Receipt preview modal
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  previewClose: { position: 'absolute', top: 55, right: 20, zIndex: 10 },
  previewImage: { width: '90%', height: '75%', borderRadius: 12 },

  // Create form
  createForm: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, gap: 4 },
  createFormTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  formLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border, gap: 8, marginBottom: 4 },
  datePickerText: { flex: 1, color: COLORS.text, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  currencySymbol: { color: COLORS.textSecondary, fontSize: 16, marginRight: 4 },
  input: { flex: 1, height: 46, color: COLORS.text, fontSize: 15 },
  formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 12 },
  cancelEditBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  cancelEditText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  saveEditBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.silver, minWidth: 80, alignItems: 'center' },
  saveEditText: { color: COLORS.dark, fontSize: 14, fontWeight: 'bold' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { marginTop: 8, backgroundColor: COLORS.silver, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },

  // Confirm payment modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 4 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10, marginTop: 8 },
  methodRow: { flexDirection: 'row', gap: 12 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.darkGray },
  methodBtnActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  methodBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.silver },
  methodBtnTextActive: { color: COLORS.dark },
  receiptSection: { gap: 4 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16 },
  uploadBtnText: { color: COLORS.silver, fontSize: 14, fontWeight: '600' },
  receiptPreview: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  receiptImage: { width: '100%', height: 140, borderRadius: 12 },
  removeReceiptBtn: { position: 'absolute', top: 8, right: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  confirmModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.silver, alignItems: 'center' },
  confirmModalBtnDisabled: { opacity: 0.5 },
  confirmModalText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
});