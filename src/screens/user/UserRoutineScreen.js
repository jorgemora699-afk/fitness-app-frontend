import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../../api/client';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { Modal } from 'react-native';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const WEEKDAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const toISO = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
};

const isToday = (dateStr) => dateStr === toISO(new Date());


function VideoModal({ visible, videoUrl, onClose }) {
  const player = useVideoPlayer(videoUrl || '', (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={28}
              color={COLORS.text}
            />
          </TouchableOpacity>

          {videoUrl && (
            <VideoView
              style={{
                width: '100%',
                height: 300,
                borderRadius: 12,
              }}
              player={player}
              fullscreenOptions={{
                enable: true
              }}
            />
          )}

        </View>
      </View>
    </Modal>
  );
}

export default function UserRoutineScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState({});
  const [savingExercise, setSavingExercise] = useState(null);
  const savingRef = useRef(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const scheduleRes = await client.get(ENDPOINTS.MY_SCHEDULE);
      const schedules = scheduleRes.data.schedules || [];
      const todaySchedule = schedules.find(
        s => s.date === selectedDate && !s.cancelled
      );

      setSchedule(todaySchedule || null);

      if (!todaySchedule || !todaySchedule.routine_id) {
        setRoutine(null);
        setSession(null);
        setLogs({});
        return;
      }

      const [myRoutinesRes, sessionRes] = await Promise.all([
        client.get('/api/routines/me/all').catch(() => ({ data: {} })),
        client.get(ENDPOINTS.GET_MY_SESSION_BY_SCHEDULE(todaySchedule.id)).catch(() => ({ data: {} }))
      ]);

      const routines = myRoutinesRes.data.routines || [];
      const found = routines.find(r => r.id === todaySchedule.routine_id);
      found?.exercises?.forEach(ex => {
        console.log(ex.name, ex.video_url);
      });
      setRoutine(found || null);

      const currentSession = sessionRes.data.session || null;
      setSession(currentSession);

      // Precargar logs si hay sesión
      if (currentSession?.logs) {
        const existingLogs = {};
        currentSession.logs.forEach(log => {
          existingLogs[log.exercise_id] = {
            sets: log.performed_sets?.toString() || '',
            reps: log.performed_reps?.toString() || '',
            weight: log.performed_weight?.toString() || '',
            notes: log.notes || '',
            saved: true
          };
        });
        setLogs(existingLogs);
      } else {
        setLogs({});
      }

    } catch (error) {
      console.log('Error loading routine:', error.message);
      setRoutine(null);
      setSession(null);
      setLogs({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const changeDay = (delta) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + delta);
    setSelectedDate(toISO(current));
    setDateObj(current);
  };

  const updateLog = (exerciseId, field, value) => {
    setLogs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
        saved: false
      }
    }));
  };

  const ensureSession = async () => {
    if (session) return session;
    try {
      const res = await client.post(ENDPOINTS.START_MY_SESSION, {
        schedule_id: schedule.id
      });
      const newSession = res.data.session;
      setSession(newSession);
      return newSession;
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
      return null;
    }
  };

  const saveExerciseLog = async (exercise) => {
    if (savingRef.current) return;
    const log = logs[exercise.id];
    if (!log || (!log.sets && !log.reps && !log.weight)) {
      Alert.alert('Aviso', 'Ingresa al menos un dato para guardar');
      return;
    }

    savingRef.current = true;
    setSavingExercise(exercise.id);

    try {
      const currentSession = await ensureSession();
      if (!currentSession) return;

      await client.post(
        ENDPOINTS.LOG_EXERCISE_IN_SESSION(currentSession.id),
        {
          exercise_id: exercise.id,
          performed_sets: log.sets ? parseInt(log.sets) : null,
          performed_reps: log.reps ? parseInt(log.reps) : null,
          performed_weight: log.weight ? parseFloat(log.weight) : null,
          notes: log.notes || null
        }
      );

      setLogs(prev => ({
        ...prev,
        [exercise.id]: { ...prev[exercise.id], saved: true }
      }));
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el ejercicio');
    } finally {
      savingRef.current = false;
      setSavingExercise(null);
    }
  };

  const getLogForExercise = (exerciseId) => {
    if (!session?.logs) return null;
    return session.logs.find(l => l.exercise_id === exerciseId) || null;
  };

  const isCompleted = session?.status === 'completed';
  const canRegister = isToday(selectedDate) && !isCompleted;

  const doFinish = async () => {
    try {
      await client.put(ENDPOINTS.FINISH_MY_SESSION(session.id));
      Alert.alert('¡Listo!', 'Entrenamiento finalizado correctamente', [
        { text: 'OK', onPress: () => loadData() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar el entrenamiento');
    }
  };

  const finishSession = () => {
    const unsaved = routine?.exercises?.filter(
      ex => logs[ex.id] && !logs[ex.id].saved
    );
    if (unsaved?.length > 0) {
      Alert.alert(
        'Atención',
        'Tienes ejercicios sin guardar. ¿Deseas finalizar de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', onPress: () => doFinish() }
        ]
      );
      return;
    }
    doFinish();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.silver} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Rutina</Text>
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

      {/* Selector de fecha */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDay(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateCenter}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateWeekday}>
            {WEEKDAYS[new Date(selectedDate + 'T12:00:00').getDay()]}
          </Text>
          <Text style={styles.dateText}>{fmt(selectedDate)}</Text>
          {isToday(selectedDate) && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>HOY</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDay(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={22} color={COLORS.silver} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setShowDatePicker(false);
            if (selected) {
              setDateObj(selected);
              setSelectedDate(toISO(selected));
            }
          }}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={COLORS.silver}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!schedule ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Sin entrenamiento</Text>
            <Text style={styles.emptySubtitle}>
              {isToday(selectedDate)
                ? 'Hoy es tu día de descanso 💤'
                : 'No hay entrenamiento para este día'}
            </Text>
          </View>
        ) : !routine ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Sin rutina asignada</Text>
            <Text style={styles.emptySubtitle}>Tu entrenador aún no asignó una rutina</Text>
          </View>
        ) : (
          <>
            {/* Info del entrenamiento */}
            <View style={styles.scheduleInfoCard}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.scheduleInfoText}>
                {schedule.start_time} - {schedule.end_time}
              </Text>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.completedText}>Completado</Text>
                </View>
              )}
            </View>

            {/* Nombre de la rutina */}
            <View style={styles.routineHeader}>
              <Text style={styles.routineName}>{routine.name}</Text>
              {routine.notes && (
                <Text style={styles.routineNotes}>{routine.notes}</Text>
              )}
            </View>

            {/* Ejercicios */}
            {routine.exercises?.map((ex) => {
              const log = logs[ex.id] || {};
              const isSaved = log.saved === true;
              const sessionLog = getLogForExercise(ex.id);

              return (
                <View key={ex.id} style={[
                  styles.exerciseCard,
                  isSaved && styles.exerciseCardLogged
                ]}>
                  <View style={styles.exerciseHeader}>
                    <Ionicons
                      name="barbell-outline"
                      size={16}
                      color={isSaved ? COLORS.success : COLORS.silver}
                    />
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    {isSaved && (
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    )}
                  </View>

                  {ex.notes && (
                    <Text style={styles.exerciseNotes}>{ex.notes}</Text>
                  )}

                  {ex.video_url && (
                    <TouchableOpacity
                      style={styles.videoButton}
                      onPress={() => {
                        setSelectedVideo(ex.video_url);
                        setVideoVisible(true);
                      }}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={20}
                        color={COLORS.silver}
                      />

                      <Text style={styles.videoButtonText}>
                        Ver técnica
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Planeado */}
                  <View style={styles.statsRow}>
                    <Text style={styles.statsRowLabel}>Planeado</Text>
                    <View style={styles.statsItems}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{ex.sets ?? '—'}</Text>
                        <Text style={styles.statLabel}>Series</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{ex.reps ?? '—'}</Text>
                        <Text style={styles.statLabel}>Reps</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{ex.weight ?? '—'}</Text>
                        <Text style={styles.statLabel}>Kg</Text>
                      </View>
                    </View>
                  </View>

                  {/* Realizado — solo lectura si completado */}
                  {isCompleted && sessionLog && (
                    <View style={[styles.statsRow, styles.statsRowDone]}>
                      <Text style={[styles.statsRowLabel, { color: COLORS.success }]}>Realizado</Text>
                      <View style={styles.statsItems}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: COLORS.success }]}>
                            {sessionLog.performed_sets ?? '—'}
                          </Text>
                          <Text style={styles.statLabel}>Series</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: COLORS.success }]}>
                            {sessionLog.performed_reps ?? '—'}
                          </Text>
                          <Text style={styles.statLabel}>Reps</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: COLORS.success }]}>
                            {sessionLog.performed_weight ?? '—'}
                          </Text>
                          <Text style={styles.statLabel}>Kg</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Inputs para registrar — solo si es hoy y no está completado */}
                  {canRegister && (
                    <>
                      <Text style={styles.inputsLabel}>Registrar:</Text>
                      <View style={styles.inputsRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Series</Text>
                          <TextInput
                            style={styles.input}
                            value={log.sets || ''}
                            onChangeText={(v) => updateLog(ex.id, 'sets', v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={COLORS.textSecondary}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.input}
                            value={log.reps || ''}
                            onChangeText={(v) => updateLog(ex.id, 'reps', v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={COLORS.textSecondary}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Kg</Text>
                          <TextInput
                            style={styles.input}
                            value={log.weight || ''}
                            onChangeText={(v) => updateLog(ex.id, 'weight', v)}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={COLORS.textSecondary}
                          />
                        </View>
                      </View>
                      <TextInput
                        style={styles.notesInput}
                        value={log.notes || ''}
                        onChangeText={(v) => updateLog(ex.id, 'notes', v)}
                        placeholder="Notas (opcional)"
                        placeholderTextColor={COLORS.textSecondary}
                      />
                      {isSaved ? (
                        <TouchableOpacity
                          style={styles.editExerciseButton}
                          onPress={() => setLogs(prev => ({
                            ...prev,
                            [ex.id]: { ...prev[ex.id], editing: true, saved: false }
                          }))}
                        >
                          <Ionicons name="create-outline" size={16} color={COLORS.silver} />
                          <Text style={styles.editExerciseText}>Editar</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.saveExerciseButton}
                          onPress={() => saveExerciseLog(ex)}
                          disabled={savingExercise === ex.id}
                        >
                        {savingExercise === ex.id ? (
                          <ActivityIndicator size="small" color={COLORS.dark} />
                        ) : (
                          <>
                            <Ionicons
                              name={isSaved ? 'checkmark-outline' : 'save-outline'}
                              size={16}
                              color={COLORS.dark}
                            />
                            <Text style={styles.saveExerciseText}>
                              {isSaved ? 'Guardado' : 'Guardar'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                )}
                    </>
                  )}
                </View>
              );
            })}
          </>
        )}
        {canRegister && session && (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={finishSession}
          >
            <Ionicons name="flag-outline" size={20} color={COLORS.dark} />
            <Text style={styles.finishText}>Finalizar entrenamiento</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      <VideoModal
        visible={videoVisible}
        videoUrl={selectedVideo}
        onClose={() => {
          setVideoVisible(false);
          setSelectedVideo(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  profileButton: { borderRadius: 20 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  dateArrow: { backgroundColor: COLORS.card, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  dateCenter: { alignItems: 'center', flex: 1, gap: 2 },
  dateWeekday: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  todayBadge: { backgroundColor: COLORS.silver, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  todayBadgeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.dark, letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  scheduleInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  scheduleInfoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(76,175,80,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  completedText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  routineHeader: { marginBottom: 16 },
  routineName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  routineNotes: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  exerciseCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  exerciseCardLogged: { borderColor: 'rgba(76,175,80,0.4)' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  exerciseNotes: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  statsRow: { marginTop: 10 },
  statsRowDone: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  statsRowLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statsItems: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.silver },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  inputsLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  inputsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1, gap: 4 },
  inputLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  input: { backgroundColor: COLORS.input, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, color: COLORS.text, fontSize: 15, fontWeight: '600', textAlign: 'center', borderWidth: 1, borderColor: COLORS.border },
  notesInput: { backgroundColor: COLORS.input, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  saveExerciseButton: { backgroundColor: COLORS.silver, borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  saveExerciseButtonSaved: { backgroundColor: 'rgba(76,175,80,0.2)' },
  saveExerciseText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 13 },
  editExerciseButton: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  editExerciseText: { color: COLORS.silver, fontSize: 13, fontWeight: '600' },
  finishButton: { backgroundColor: COLORS.silver, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  finishText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.silver,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  videoButtonText: {
    color: COLORS.silver,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
  },

  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
});