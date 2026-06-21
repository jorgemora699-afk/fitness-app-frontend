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
  Modal,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import TimePickerModal from '../../components/TimePickerModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const WEEK_DAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'X', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
];

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getWeekDays = (referenceDate) => {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0=Dom, 1=Lun...
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const fmtTime = (t) => t?.slice(0, 5) || '';

const fmtDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
};

// ─── Schedule Card ────────────────────────────────────────────────────────────

function ScheduleCard({ item, onNotify, onAttendance, onViewDetail }) {
  const { schedule, user } = item;
  const userResponse = schedule.user_response || 'pending';
  const notified = schedule.notified;

  let statusLabel = 'Pendiente';
  let statusColor = COLORS.warning;
  if (schedule.cancelled) {
    statusLabel = 'Cancelado';
    statusColor = COLORS.danger;
  } else if (userResponse === 'confirmed') {
    statusLabel = 'Confirmado';
    statusColor = COLORS.success;
  } else if (userResponse === 'declined') {
    statusLabel = 'Rechazado';
    statusColor = COLORS.danger;
  } else if (schedule.confirmed) {
    statusLabel = 'Confirmado';
    statusColor = COLORS.success;
  }

  return (
    <View style={[styles.scheduleCard, schedule.cancelled && styles.scheduleCardCancelled]}>
      {/* Hora */}
      <View style={styles.timeBlock}>
        <Text style={styles.timeText}>{fmtTime(schedule.start_time)}</Text>
        <View style={styles.timeLine} />
        <Text style={styles.timeTextEnd}>{fmtTime(schedule.end_time)}</Text>
      </View>

      {/* Info */}
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleName}>{user?.name} {user?.last_name}</Text>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Notificación */}
        {!schedule.cancelled && userResponse !== 'declined' && (
          userResponse === 'pending' ? (
            <TouchableOpacity
              style={[styles.notifyBtn, notified && styles.notifyBtnSent]}
              onPress={() => onNotify(schedule.id)}
            >
              <Ionicons
                name={notified ? 'notifications' : 'notifications-outline'}
                size={13}
                color={notified ? COLORS.warning : COLORS.textSecondary}
              />
              <Text style={[styles.notifyBtnText, notified && { color: COLORS.warning }]}>
                {notified ? 'Notificado · esperando' : 'Enviar notificación'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.notifyBtn, styles.notifyBtnDone]}>
              <Ionicons name="checkmark-done-outline" size={13} color={COLORS.success} />
              <Text style={[styles.notifyBtnText, { color: COLORS.success }]}>Notificado</Text>
            </View>
          )
        )}

        {/* Asistencia */}
        {userResponse === 'confirmed' && !schedule.cancelled && (
          <View style={styles.attendanceRow}>
            <TouchableOpacity
              style={[styles.attendanceBtn, schedule.attended === true && styles.attendanceBtnActive]}
              onPress={() => onAttendance(schedule.id, true)}
            >
              <Ionicons name="checkmark-circle-outline" size={13}
                color={schedule.attended === true ? COLORS.dark : COLORS.success} />
              <Text style={[styles.attendanceBtnText, schedule.attended === true && { color: COLORS.dark }]}>
                Asistió
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attendanceBtn, styles.attendanceBtnDanger, schedule.attended === false && styles.attendanceBtnDangerActive]}
              onPress={() => onAttendance(schedule.id, false)}
            >
              <Ionicons name="close-circle-outline" size={13}
                color={schedule.attended === false ? COLORS.dark : COLORS.danger} />
              <Text style={[styles.attendanceBtnText, schedule.attended === false && { color: COLORS.dark }]}>
                No asistió
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ver detalle */}
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() => onViewDetail(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="eye-outline" size={18} color={COLORS.silver} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Schedule Detail Modal ─────────────────────────────────────────────────────

function ScheduleDetailModal({ visible, item, onClose, onConfirm, onEdit, onCancel, onDelete }) {
  if (!item) return null;
  const { schedule, user } = item;
  const userResponse = schedule.user_response || 'pending';

  let statusLabel = 'Pendiente';
  let statusColor = COLORS.warning;
  if (schedule.cancelled) {
    statusLabel = 'Cancelado';
    statusColor = COLORS.danger;
  } else if (userResponse === 'confirmed') {
    statusLabel = 'Confirmado';
    statusColor = COLORS.success;
  } else if (userResponse === 'declined') {
    statusLabel = 'Rechazado';
    statusColor = COLORS.danger;
  } else if (schedule.confirmed) {
    statusLabel = 'Confirmado';
    statusColor = COLORS.success;
  }

  const confirmCancel = () => {
    Alert.alert(
      'Cancelar entrenamiento',
      `¿Cancelar el entrenamiento de ${user?.name}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => { onCancel(schedule.id); onClose(); } },
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar horario',
      `¿Eliminar el horario de ${user?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => { onDelete(schedule.id); onClose(); } },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.modalTitle}>{user?.name} {user?.last_name}</Text>
              <Text style={styles.detailDate}>{fmtDate(schedule.date)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Hora */}
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.silver} />
            <Text style={styles.detailText}>{fmtTime(schedule.start_time)} - {fmtTime(schedule.end_time)}</Text>
          </View>

          {/* Estado */}
          <View style={styles.detailRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.detailText, { color: statusColor, fontWeight: '600' }]}>{statusLabel}</Text>
          </View>

          {/* Rutina */}
          {schedule.routine_id && (
            <View style={styles.detailRow}>
              <Ionicons name="barbell-outline" size={18} color={COLORS.silver} />
              <Text style={styles.detailText}>
                {schedule.routine_name || 'Rutina asignada'}
              </Text>
            </View>
          )}

          {/* Tipo de sesión */}
          {schedule.session_type && (
            <View style={styles.detailRow}>
              <Ionicons name="fitness-outline" size={18} color={COLORS.silver} />
              <Text style={styles.detailText}>{schedule.session_type}</Text>
            </View>
          )}

          {/* Motivo cancelación */}
          {schedule.cancel_reason && (
            <View style={styles.detailRow}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
              <Text style={[styles.detailText, { fontStyle: 'italic' }]}>"{schedule.cancel_reason}"</Text>
            </View>
          )}

          {/* Acciones */}
          <View style={styles.detailActions}>
            {!schedule.cancelled && !schedule.confirmed && userResponse !== 'confirmed' && (
              <TouchableOpacity
                style={styles.detailActionBtn}
                onPress={() => { onConfirm(schedule.id); onClose(); }}
              >
                <Ionicons name="checkmark-outline" size={18} color={COLORS.success} />
                <Text style={styles.detailActionText}>Confirmar</Text>
              </TouchableOpacity>
            )}

            {!schedule.cancelled && (
              <>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  onPress={() => { onEdit(item); onClose(); }}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.silver} />
                  <Text style={styles.detailActionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.detailActionBtn, styles.detailActionBtnDanger]}
                  onPress={confirmCancel}
                >
                  <Ionicons name="close-outline" size={18} color={COLORS.danger} />
                  <Text style={[styles.detailActionText, { color: COLORS.danger }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}

            {schedule.cancelled && (
              <TouchableOpacity
                style={[styles.detailActionBtn, styles.detailActionBtnDanger]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                <Text style={[styles.detailActionText, { color: COLORS.danger }]}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 20 }} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Create Schedule Modal ────────────────────────────────────────────────────

function CreateScheduleModal({ visible, selectedDate, onClose, onCreated }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [sessionType, setSessionType] = useState('Entrenamiento');
  const [date, setDate] = useState(selectedDate);
  const [dateObj, setDateObj] = useState(new Date(selectedDate + 'T12:00:00'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const [endRepeatDate, setEndRepeatDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 3))
  );
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = React.useRef(false);

  const toggleDay = (day) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter(d => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  useEffect(() => {
    if (visible) {
      setDate(selectedDate);
      setDateObj(new Date(selectedDate + 'T12:00:00'));
      setSelectedUser(null);
      setSelectedRoutine(null);
      setRoutines([]);
      setSessionType('Entrenamiento');
      setStartTime('08:00');
      setEndTime('09:00');
      loadUsers();
    }
  }, [visible, selectedDate]);

  useEffect(() => {
    if (selectedUser) {
      setSelectedRoutine(null);
      setRoutines([]);
      loadRoutines(selectedUser.id);
    } else {
      setRoutines([]);
      setSelectedRoutine(null);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await client.get(`${ENDPOINTS.GET_MY_USERS}?status=approved`);
      setUsers(res.data.users || []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRoutines = async (userId) => {
    setLoadingRoutines(true);
    try {
      const res = await client.get(ENDPOINTS.GET_USER_ROUTINES(userId));
      setRoutines(res.data.routines || []);
    } catch {
      setRoutines([]);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const fmtRoutineDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(month) - 1]}`;
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!selectedUser) { Alert.alert('Error', 'Selecciona un usuario'); return; }
    if (startTime >= endTime) { Alert.alert('Error', 'La hora de fin debe ser posterior al inicio'); return; }

    savingRef.current = true;
    setSaving(true);
    try {
      await client.post(ENDPOINTS.CREATE_SCHEDULE, {
        user_id: selectedUser.id,
        date,
        start_time: startTime,
        end_time: endTime,
        routine_id: selectedRoutine?.id || null,
        repeat_days: repeatDays,
        repeat_until: toISO(endRepeatDate),
        session_type: sessionType,
      });
      onCreated();
      onClose();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'No se pudo crear el horario';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView
          style={styles.modalSheet}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Nuevo entrenamiento</Text>

          {/* Fecha */}
          <Text style={styles.modalLabel}>Fecha</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.datePickerText}>{fmtDate(date)}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowDatePicker(false);
                if (selected) { setDateObj(selected); setDate(toISO(selected)); }
              }}
            />
          )}

          {/* Horas */}
          <View style={styles.timesRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Inicio</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.datePickerText}>{startTime}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.datePickerText}>{endTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TimePickerModal
            visible={showStartPicker}
            value={startTime}
            title="Hora de inicio"
            onConfirm={(time) => setStartTime(time)}
            onClose={() => setShowStartPicker(false)}
          />
          <TimePickerModal
            visible={showEndPicker}
            value={endTime}
            title="Hora de fin"
            onConfirm={(time) => setEndTime(time)}
            onClose={() => setShowEndPicker(false)}
          />

          {/* Usuario */}
          <Text style={styles.modalLabel}>Usuario</Text>
          {loadingUsers ? (
            <ActivityIndicator color={COLORS.silver} style={{ marginVertical: 10 }} />
          ) : (
            users.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, selectedUser?.id === u.id && styles.userRowActive]}
                onPress={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {u.name?.charAt(0)}{u.last_name?.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.userRowName, selectedUser?.id === u.id && styles.userRowNameActive]}>
                  {u.name} {u.last_name}
                </Text>
                {selectedUser?.id === u.id && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.silver} />
                )}
              </TouchableOpacity>
            ))
          )}

          {/* Rutinas */}
          {selectedUser && (
            <>
              <Text style={styles.modalLabel}>
                Rutina <Text style={styles.modalLabelOptional}>(opcional)</Text>
              </Text>
              {loadingRoutines ? (
                <ActivityIndicator color={COLORS.silver} style={{ marginVertical: 10 }} />
              ) : routines.length === 0 ? (
                <View style={styles.noRoutines}>
                  <Ionicons name="barbell-outline" size={18} color={COLORS.border} />
                  <Text style={styles.noRoutinesText}>{selectedUser.name} no tiene rutinas registradas</Text>
                </View>
              ) : (
                routines.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.routineRow, selectedRoutine?.id === r.id && styles.routineRowActive]}
                    onPress={() => setSelectedRoutine(selectedRoutine?.id === r.id ? null : r)}
                  >
                    <View style={styles.routineRowLeft}>
                      <Text style={[styles.routineRowName, selectedRoutine?.id === r.id && styles.routineRowNameActive]}>
                        {r.name}
                      </Text>
                      <Text style={styles.routineRowDate}>{fmtRoutineDate(r.date)}</Text>
                    </View>
                    <View style={styles.routineRowRight}>
                      <Text style={styles.routineExCount}>{r.exercises?.length || 0} ej.</Text>
                      {selectedRoutine?.id === r.id && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.silver} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Repetir */}
          <Text style={styles.modalLabel}>Repetir semanalmente</Text>
          <View style={styles.repeatDaysContainer}>
            {WEEK_DAYS.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[styles.repeatDayBtn, repeatDays.includes(day.value) && styles.repeatDayBtnActive]}
                onPress={() => toggleDay(day.value)}
              >
                <Text style={[styles.repeatDayText, repeatDays.includes(day.value) && styles.repeatDayTextActive]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Repetir hasta</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndDatePicker(true)}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.datePickerText}>{fmtDate(toISO(endRepeatDate))}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endRepeatDate}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowEndDatePicker(false);
                if (selected) setEndRepeatDate(selected);
              }}
            />
          )}

          {/* Tipo de sesión */}
          <Text style={styles.modalLabel}>Tipo de sesión</Text>
          <View style={styles.sessionTypeRow}>
            {['Entrenamiento', 'Asesoría', 'Evaluación'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.sessionTypeBtn, sessionType === type && styles.sessionTypeBtnActive]}
                onPress={() => setSessionType(type)}
              >
                <Text style={[styles.sessionTypeText, sessionType === type && styles.sessionTypeTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Acciones */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={onClose}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveModalBtn, (!selectedUser || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!selectedUser || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.dark} />
              ) : (
                <Text style={styles.saveModalText}>Crear</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Edit Schedule Modal ───────────────────────────────────────────────────────

function EditScheduleModal({ visible, item, onClose, onUpdated }) {
  const [date, setDate] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sessionType, setSessionType] = useState('Entrenamiento');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [saving, setSaving] = useState(false);
  const savingRef = React.useRef(false);

  useEffect(() => {
    if (visible && item) {
      const s = item.schedule;
      setDate(s.date);
      const [y, m, d] = s.date.split('-');
      setDateObj(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
      setStartTime(s.start_time?.slice(0, 5) || '08:00');
      setEndTime(s.end_time?.slice(0, 5) || '09:00');
      setSessionType(s.session_type || 'Entrenamiento');
      loadRoutines(item.user.id, s.routine_id);
    }
  }, [visible, item]);

  const loadRoutines = async (userId, currentRoutineId) => {
    setLoadingRoutines(true);
    try {
      const res = await client.get(ENDPOINTS.GET_USER_ROUTINES(userId));
      const list = res.data.routines || [];
      setRoutines(list);
      setSelectedRoutine(list.find(r => r.id === currentRoutineId) || null);
    } catch {
      setRoutines([]);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const fmtRoutineDate = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(month) - 1]}`;
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (startTime >= endTime) { Alert.alert('Error', 'La hora de fin debe ser posterior al inicio'); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      await client.put(ENDPOINTS.UPDATE_SCHEDULE(item.schedule.id), {
        date,
        start_time: startTime,
        end_time: endTime,
        routine_id: selectedRoutine?.id || null,
        session_type: sessionType,
      });
      onUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo actualizar el horario');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView
          style={styles.modalSheet}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Editar entrenamiento</Text>
          <Text style={styles.modalSubtitle}>{item.user?.name} {item.user?.last_name}</Text>

          {/* Fecha */}
          <Text style={styles.modalLabel}>Fecha</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.datePickerText}>{fmtDate(date)}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowDatePicker(false);
                if (selected) { setDateObj(selected); setDate(toISO(selected)); }
              }}
            />
          )}

          {/* Horas */}
          <View style={styles.timesRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Inicio</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.datePickerText}>{startTime}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalLabel}>Fin</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.datePickerText}>{endTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TimePickerModal
            visible={showStartPicker}
            value={startTime}
            title="Hora de inicio"
            onConfirm={(time) => setStartTime(time)}
            onClose={() => setShowStartPicker(false)}
          />
          <TimePickerModal
            visible={showEndPicker}
            value={endTime}
            title="Hora de fin"
            onConfirm={(time) => setEndTime(time)}
            onClose={() => setShowEndPicker(false)}
          />

          {/* Rutina */}
          <Text style={styles.modalLabel}>Rutina <Text style={styles.modalLabelOptional}>(opcional)</Text></Text>
          {loadingRoutines ? (
            <ActivityIndicator color={COLORS.silver} style={{ marginVertical: 10 }} />
          ) : routines.length === 0 ? (
            <View style={styles.noRoutines}>
              <Ionicons name="barbell-outline" size={18} color={COLORS.border} />
              <Text style={styles.noRoutinesText}>Sin rutinas registradas</Text>
            </View>
          ) : (
            routines.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.routineRow, selectedRoutine?.id === r.id && styles.routineRowActive]}
                onPress={() => setSelectedRoutine(selectedRoutine?.id === r.id ? null : r)}
              >
                <View style={styles.routineRowLeft}>
                  <Text style={[styles.routineRowName, selectedRoutine?.id === r.id && styles.routineRowNameActive]}>{r.name}</Text>
                  <Text style={styles.routineRowDate}>{fmtRoutineDate(r.date)}</Text>
                </View>
                <View style={styles.routineRowRight}>
                  <Text style={styles.routineExCount}>{r.exercises?.length || 0} ej.</Text>
                  {selectedRoutine?.id === r.id && <Ionicons name="checkmark-circle" size={18} color={COLORS.silver} />}
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Tipo de sesión */}
          <Text style={styles.modalLabel}>Tipo de sesión</Text>
          <View style={styles.sessionTypeRow}>
            {['Entrenamiento', 'Asesoría', 'Evaluación'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.sessionTypeBtn, sessionType === type && styles.sessionTypeBtnActive]}
                onPress={() => setSessionType(type)}
              >
                <Text style={[styles.sessionTypeText, sessionType === type && styles.sessionTypeTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Acciones */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={onClose}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveModalBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color={COLORS.dark} /> : <Text style={styles.saveModalText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}
// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrainerCalendarScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [weekRef, setWeekRef] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const weekDays = getWeekDays(weekRef);

  const loadSchedules = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await client.get(`${ENDPOINTS.GET_SCHEDULE}?date=${date}`);
      setSchedules(res.data.schedules || []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules(selectedDate);
  }, [selectedDate, loadSchedules]);

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const goToToday = () => {
    const today = new Date();
    setWeekRef(today);
    setSelectedDate(toISO(today));
  };

  const handleConfirm = async (scheduleId) => {
    try {
      await client.post(ENDPOINTS.CONFIRM_SCHEDULE(scheduleId));
      loadSchedules(selectedDate);
    } catch {
      Alert.alert('Error', 'No se pudo confirmar');
    }
  };

  const cancellingRef = React.useRef(false);
  const deletingRef = React.useRef(false);

  const handleCancel = async (scheduleId) => {
    if (cancellingRef.current) return;
    cancellingRef.current = true;
    try {
      await client.post(ENDPOINTS.CANCEL_AS_TRAINER(scheduleId), {});
      loadSchedules(selectedDate);
    } catch {
      console.log('Error cancelar status:', error.response?.status);
      console.log('Error cancelar data:', JSON.stringify(error.response?.data));
      console.log('Error cancelar message:', error.message);
      Alert.alert('Error', 'No se pudo cancelar');
    } finally {
      cancellingRef.current = false;
    }
  };

  const handleDelete = async (scheduleId) => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    try {
      await client.delete(ENDPOINTS.DELETE_SCHEDULE(scheduleId));
      loadSchedules(selectedDate);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar');
    } finally {
      deletingRef.current = false;
    }
  };

  const handleNotify = async (scheduleId) => {
    try {
      await client.post(ENDPOINTS.NOTIFY_SCHEDULE(scheduleId));
      loadSchedules(selectedDate);
    } catch (error) {
      const msg = error?.response?.data?.error || 'No se pudo enviar la notificación';
      Alert.alert('Error', msg);
    }
  };

  const handleAttendance = async (scheduleId, attended) => {
    try {
      await client.post(ENDPOINTS.MARK_ATTENDANCE(scheduleId), { attended });
      loadSchedules(selectedDate);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    }
  };

  const today = toISO(new Date());
  const [syear, smonth, sday] = selectedDate.split('-');
  const selectedDateObj = new Date(parseInt(syear), parseInt(smonth) - 1, parseInt(sday));
  const monthYear = `${MONTHS[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Calendario</Text>
          <Text style={styles.headerMonth}>{monthYear}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('TrainerProfile')}
          style={styles.profileButton}
        >
          {user?.profile_photo ? (
            <Image
              source={{ uri: user.profile_photo }}
              style={styles.headerProfileImage}
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

      {/* Navegación semanal */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={prevWeek} style={styles.weekNavBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.silver} />
        </TouchableOpacity>
        <View style={styles.weekDays}>
          {weekDays.map((day, i) => {
            const iso = toISO(day);
            const isSelected = iso === selectedDate;
            const isToday = iso === today;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(toISO(day))}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                  {DAYS[day.getDay()]}
                </Text>
                <View style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isToday && !isSelected && styles.dayNumberToday
                ]}>
                  <Text style={[
                    styles.dayNumberText,
                    isSelected && styles.dayNumberTextSelected,
                    isToday && !isSelected && styles.dayNumberTextToday
                  ]}>
                    {day.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={nextWeek} style={styles.weekNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.silver} />
        </TouchableOpacity>
      </View>

      {/* Botón Hoy */}
      {selectedDate !== today && (
        <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
          <Text style={styles.todayBtnText}>Hoy</Text>
        </TouchableOpacity>
      )}

      {/* Lista de horarios */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadSchedules(selectedDate); }}
            tintColor={COLORS.silver}
          />
        }
      >
        <View style={styles.selectedDateRow}>
          <Text style={styles.selectedDateText}>
            {DAYS[selectedDateObj.getDay()]}, {selectedDateObj.getDate()} de {MONTHS[selectedDateObj.getMonth()]}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{schedules.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.silver} />
          </View>
        ) : schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Sin entrenamientos</Text>
            <Text style={styles.emptySubtitle}>No hay horarios para este día</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.emptyBtnText}>Crear entrenamiento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map((item, i) => (
            <ScheduleCard
              key={item.schedule?.id || i}
              item={item}
              onNotify={handleNotify}
              onAttendance={handleAttendance}
              onViewDetail={(item) => { setDetailItem(item); setShowDetailModal(true); }}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.dark} />
      </TouchableOpacity>

      <CreateScheduleModal
        visible={showCreateModal}
        selectedDate={selectedDate}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => loadSchedules(selectedDate)}
      />
      <EditScheduleModal
        visible={showEditModal}
        item={editingItem}
        onClose={() => { setShowEditModal(false); setEditingItem(null); }}
        onUpdated={() => loadSchedules(selectedDate)}
      />
      <ScheduleDetailModal
        visible={showDetailModal}
        item={detailItem}
        onClose={() => { setShowDetailModal(false); setDetailItem(null); }}
        onConfirm={handleConfirm}
        onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { paddingTop: 40, alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12 },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  headerMonth: { fontSize: 13, color: COLORS.textSecondary },
  profileButton: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },

  // Week nav
  weekNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  weekNavBtn: { padding: 8 },
  weekDays: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 12, flex: 1 },
  dayBtnSelected: { backgroundColor: COLORS.card },
  dayLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  dayLabelSelected: { color: COLORS.silver },
  dayNumber: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayNumberSelected: { backgroundColor: COLORS.silver },
  dayNumberToday: { borderWidth: 1, borderColor: COLORS.silver },
  dayNumberText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  dayNumberTextSelected: { color: COLORS.dark, fontWeight: 'bold' },
  dayNumberTextToday: { color: COLORS.silver },

  // Today button
  todayBtn: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  todayBtnText: { fontSize: 12, color: COLORS.silver, fontWeight: '600' },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  selectedDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  selectedDateText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  countBadge: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: COLORS.silver, fontWeight: 'bold', fontSize: 13 },

  // Schedule card
  scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, gap: 12 },
  scheduleCardCancelled: { opacity: 0.6 },
  timeBlock: { alignItems: 'center', width: 44 },
  timeText: { fontSize: 13, fontWeight: 'bold', color: COLORS.silver },
  timeLine: { width: 1, height: 16, backgroundColor: COLORS.border, marginVertical: 3 },
  timeTextEnd: { fontSize: 11, color: COLORS.textSecondary },
  scheduleInfo: { flex: 1, gap: 8 },
  scheduleName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // View detail button
  viewBtn: { backgroundColor: COLORS.darkGray, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'center' },

  // Notify button
  notifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.darkGray, alignSelf: 'flex-start' },
  notifyBtnSent: { borderColor: 'rgba(255,193,7,0.4)', backgroundColor: 'rgba(255,193,7,0.08)' },
  notifyBtnDone: { borderColor: 'rgba(76,175,80,0.4)', backgroundColor: 'rgba(76,175,80,0.08)' },
  notifyBtnText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  sessionTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  sessionTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.darkGray },
  sessionTypeBtnActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  sessionTypeText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  sessionTypeTextActive: { color: COLORS.dark, fontWeight: 'bold' },

  // Attendance buttons
  attendanceRow: { flexDirection: 'row', gap: 6 },
  attendanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)', backgroundColor: 'rgba(76,175,80,0.08)' },
  attendanceBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  attendanceBtnDanger: { borderColor: 'rgba(229,57,53,0.4)', backgroundColor: 'rgba(229,57,53,0.08)' },
  attendanceBtnDangerActive: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  attendanceBtnText: { fontSize: 11, color: COLORS.text, fontWeight: '500' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },
  emptyBtn: { marginTop: 8, backgroundColor: COLORS.silver, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },

  // FAB
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: COLORS.silver, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  repeatDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  repeatDayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  repeatDayBtnActive: {
    backgroundColor: COLORS.silver,
    borderColor: COLORS.silver,
  },

  repeatDayText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  repeatDayTextActive: {
    color: COLORS.dark,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: 12 },
  modalLabelOptional: { fontSize: 11, color: COLORS.metalGray, fontWeight: '400', textTransform: 'none' },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  datePickerText: { flex: 1, color: COLORS.text, fontSize: 14 },
  timesRow: { flexDirection: 'row', gap: 12 },

  // Users
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6, backgroundColor: COLORS.darkGray },
  userRowActive: { borderColor: COLORS.silver },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 12, fontWeight: 'bold', color: COLORS.silver },
  userRowName: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  userRowNameActive: { color: COLORS.text, fontWeight: '600' },

  // Routines
  noRoutines: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: COLORS.darkGray, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  noRoutinesText: { fontSize: 13, color: COLORS.textSecondary },
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6, backgroundColor: COLORS.darkGray },
  routineRowActive: { borderColor: COLORS.silver },
  routineRowLeft: { flex: 1, gap: 2 },
  routineRowName: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  routineRowNameActive: { color: COLORS.text, fontWeight: '600' },
  routineRowDate: { fontSize: 11, color: COLORS.metalGray },
  routineRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routineExCount: { fontSize: 12, color: COLORS.textSecondary },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  saveModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.silver, alignItems: 'center' },
  saveModalText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },

  // Detail modal
  detailSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 30 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailText: { fontSize: 14, color: COLORS.text, flex: 1 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  detailActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.darkGray, borderWidth: 1, borderColor: COLORS.border },
  detailActionBtnDanger: { backgroundColor: 'rgba(229,57,53,0.1)', borderColor: 'rgba(229,57,53,0.3)' },
  detailActionText: { fontSize: 13, color: COLORS.silver, fontWeight: '600' },
  headerProfileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});