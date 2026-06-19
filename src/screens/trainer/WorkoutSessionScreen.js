import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

export default function WorkoutSessionScreen({ route, navigation }) {
  const { schedule, user } = route.params;

  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [logs, setLogs] = useState({});
  const [savingExercise, setSavingExercise] = useState(null);
  const savingRef = useRef(false);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      // 1. Verificar si ya hay sesión para este schedule
      const existingRes = await client.get(
        ENDPOINTS.GET_SESSION_BY_SCHEDULE(schedule.id)
      );

      let currentSession = existingRes.data.session;

      // 2. Si no hay sesión, iniciarla
      if (!currentSession) {
        const startRes = await client.post(ENDPOINTS.START_SESSION, {
          schedule_id: schedule.id
        });
        currentSession = startRes.data.session;
      }

      setSession(currentSession);

      // 3. Cargar ejercicios de la rutina
      const routineRes = await client.get(
        ENDPOINTS.GET_USER_ROUTINES(user.id)
      );
      const routines = routineRes.data.routines || [];
      const routine = routines.find(r => r.id === schedule.routine_id);

      if (routine) {
        setExercises(routine.exercises || []);

        // 4. Precargar logs existentes si la sesión ya tenía datos
        const existingLogs = {};
        (currentSession.logs || []).forEach(log => {
          existingLogs[log.exercise_id] = {
            sets: log.performed_sets?.toString() || '',
            reps: log.performed_reps?.toString() || '',
            weight: log.performed_weight?.toString() || '',
            notes: log.notes || '',
            saved: true
          };
        });
        setLogs(existingLogs);
      }
    } catch (error) {
      console.log('Error iniciando sesión:', error.message);
      Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
    } finally {
      setLoading(false);
    }
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

  const saveExerciseLog = async (exercise) => {
    if (savingRef.current) return;
    const log = logs[exercise.id];
    if (!log) {
      Alert.alert('Aviso', 'Ingresa al menos un dato para guardar');
      return;
    }

    savingRef.current = true;
    setSavingExercise(exercise.id);

    try {
      await client.post(
        ENDPOINTS.LOG_EXERCISE_IN_SESSION(session.id),
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

  const finishSession = async () => {
    const unsaved = exercises.filter(
      ex => logs[ex.id] && !logs[ex.id].saved
    );

    if (unsaved.length > 0) {
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

  const doFinish = async () => {
    setFinishing(true);
    try {
      await client.put(ENDPOINTS.FINISH_SESSION(session.id));
      Alert.alert('¡Listo!', 'Entrenamiento finalizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar la sesión');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.silver} />
        <Text style={styles.loadingText}>Iniciando entrenamiento...</Text>
      </View>
    );
  }

  const isCompleted = session?.status === 'completed';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{user.name} {user.last_name}</Text>
          <Text style={styles.headerSubtitle}>
            {new Date(schedule.date + 'T00:00:00').toLocaleDateString('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isCompleted ? 'rgba(76,175,80,0.15)' : 'rgba(255,193,7,0.15)' }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isCompleted ? COLORS.success : '#FFC107' }
          ]} />
          <Text style={[
            styles.statusText,
            { color: isCompleted ? COLORS.success : '#FFC107' }
          ]}>
            {isCompleted ? 'Completado' : 'En curso'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Esta rutina no tiene ejercicios</Text>
          </View>
        ) : (
          exercises.map((exercise) => {
            const log = logs[exercise.id] || {};
            const isSaved = log.saved === true;
            const isEditing = log.editing === true;

            return (
              <View key={exercise.id} style={[
                styles.exerciseCard,
                isSaved && styles.exerciseCardSaved
              ]}>
                {/* Nombre del ejercicio */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleRow}>
                    <Ionicons
                      name="barbell-outline"
                      size={18}
                      color={isSaved ? COLORS.success : COLORS.silver}
                    />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                  </View>
                  {isSaved && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  )}
                </View>

                {/* Valores planeados */}
                <View style={styles.plannedRow}>
                  <Text style={styles.plannedLabel}>Planeado:</Text>
                  <Text style={styles.plannedValue}>
                    {exercise.sets || '-'} series · {exercise.reps || '-'} reps · {exercise.weight || '-'} kg
                  </Text>
                </View>

                {/* Inputs para registrar */}
                {!isCompleted && (
                  <>
                    <Text style={styles.inputsLabel}>Realizado:</Text>
                    <View style={styles.inputsRow}>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Series</Text>
                        <TextInput
                          style={styles.input}
                          value={log.sets || ''}
                          onChangeText={(v) => updateLog(exercise.id, 'sets', v)}
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
                          onChangeText={(v) => updateLog(exercise.id, 'reps', v)}
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
                          onChangeText={(v) => updateLog(exercise.id, 'weight', v)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={COLORS.textSecondary}
                        />
                      </View>
                    </View>

                    <TextInput
                      style={styles.notesInput}
                      value={log.notes || ''}
                      onChangeText={(v) => updateLog(exercise.id, 'notes', v)}
                      placeholder="Notas (opcional)"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    {isSaved && !isEditing ? (
                    <TouchableOpacity
                        style={styles.editExerciseButton}
                        onPress={() => setLogs(prev => ({
                        ...prev,
                        [exercise.id]: { ...prev[exercise.id], editing: true, saved: false }
                        }))}
                    >
                        <Ionicons name="create-outline" size={16} color={COLORS.silver} />
                        <Text style={styles.editExerciseText}>Editar</Text>
                    </TouchableOpacity>
                    ) : (
                    <TouchableOpacity
                      style={[
                        styles.saveExerciseButton,
                        isSaved && styles.saveExerciseButtonSaved
                      ]}
                      onPress={() => saveExerciseLog(exercise)}
                      disabled={savingExercise === exercise.id}
                    >
                      {savingExercise === exercise.id ? (
                        <ActivityIndicator size="small" color={COLORS.dark} />
                      ) : (
                        <>
                          <Ionicons
                            name={isSaved ? 'checkmark-outline' : 'save-outline'}
                            size={16}
                            color={COLORS.dark}
                          />
                          <Text style={styles.saveExerciseText}>
                            {isSaved ? 'Guardado' : 'Guardar ejercicio'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    )}
                  </>
                )}


                {/* Vista de solo lectura si está completado */}
                {isCompleted && isSaved && (
                  <View style={styles.completedRow}>
                    <Text style={styles.plannedLabel}>Realizado:</Text>
                    <Text style={styles.plannedValue}>
                      {log.sets || '-'} series · {log.reps || '-'} reps · {log.weight || '-'} kg
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Botón finalizar */}
        {!isCompleted && (
          <View style={styles.finishContainer}>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={finishSession}
              disabled={finishing}
            >
              {finishing ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <>
                  <Ionicons name="flag-outline" size={20} color={COLORS.dark} />
                  <Text style={styles.finishText}>Finalizar entrenamiento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    gap: 10,
  },
  backButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseCardSaved: {
    borderColor: 'rgba(76,175,80,0.4)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  plannedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  editExerciseButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    },
    editExerciseText: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: '600',
    },
  plannedLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  plannedValue: {
    fontSize: 12,
    color: COLORS.silver,
    fontWeight: '500',
  },
  inputsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  saveExerciseButton: {
    backgroundColor: COLORS.silver,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  saveExerciseButtonSaved: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  saveExerciseText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  finishContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  finishButton: {
    backgroundColor: COLORS.silver,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  finishText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: 'bold',
  },
});