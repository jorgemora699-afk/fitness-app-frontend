import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Linking,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserDetailScreen({ route, navigation }) {
  const { user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membership, setMembership] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [progress, setProgress] = useState(null);
  const [imc, setImc] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [hiddenIds, setHiddenIds] = useState([]);
  const storageKey = `hidden_schedules_${user.id}`;
  

  useEffect(() => {
    loadData();
    loadHiddenIds();
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [membershipRes, attendanceRes, progressRes, imcRes, historyRes, assignedRes, schedulesRes, sessionsRes] = await Promise.all([
        client.get(ENDPOINTS.MEMBERSHIP_HISTORY(user.id)).catch(e => ({ data: {} })),
        client.get(`${ENDPOINTS.USER_ATTENDANCE(user.id)}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.USER_PROGRESS(user.id)).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.USER_IMC(user.id)).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.GET_WORKOUT_HISTORY(user.id)).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.USER_ASSIGNED_WORKOUTS(user.id)).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.GET_SCHEDULE + `?user_id=${user.id}`).catch(e => ({ data: {} })),
        client.get(ENDPOINTS.SESSION_HISTORY(user.id)).catch(e => ({ data: {} }))
      ]);

      const memberships = membershipRes.data.memberships || [];
      

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeMembership = memberships.find(m => {
        return (
          m.is_paid &&
          new Date(m.end_date + 'T00:00:00') >= today
        );
      });

      setMembership(activeMembership || memberships[0] || null);
      setAttendance(attendanceRes.data.summary || null);
      setProgress(progressRes.data.body_progress?.summary || null);
      setSchedules(schedulesRes.data.schedules || []);
      setAssignedWorkouts(assignedRes.data.assigned_workouts || []);
      setSessionHistory(sessionsRes.data.sessions || []);
      setImc(imcRes.data || null);
      console.log(
        'WORKOUT HISTORY',
        JSON.stringify(historyRes.data, null, 2)
      );
      setWorkoutHistory(historyRes.data.history || []);
    } catch (error) {
      console.log('Error loading user detail:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadHiddenIds = async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      setHiddenIds(stored ? JSON.parse(stored) : []);
    } catch {
      setHiddenIds([]);
    }
  };

  const hideSchedule = async (scheduleId) => {
    const updated = [...hiddenIds, scheduleId];
    setHiddenIds(updated);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const unhideAll = async () => {
    setHiddenIds([]);
    await AsyncStorage.removeItem(storageKey);
  };

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
  age: user.age?.toString() || '',
  weight: user.weight?.toString() || '',
  height: user.height?.toString() || '',
  body_fat: user.body_fat?.toString() || '',
  muscle_mass: user.muscle_mass?.toString() || '',
  goal: user.goal || ''
});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await client.put(ENDPOINTS.UPDATE_USER(user.id), {
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        body_fat: form.body_fat ? parseFloat(form.body_fat) : null,
        muscle_mass: form.muscle_mass ? parseFloat(form.muscle_mass) : null,
        goal: form.goal
      });
      const updated = response.data.user;
      setCurrentUser(updated);
      setForm({
        age: updated.age?.toString() || '',
        weight: updated.weight?.toString() || '',
        height: updated.height?.toString() || '',
        body_fat: updated.body_fat?.toString() || '',
        muscle_mass: updated.muscle_mass?.toString() || '',
        goal: updated.goal || ''
      });
      setEditing(false);
      Alert.alert('Éxito', 'Datos actualizados correctamente');
      loadData();
    } catch (error) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', JSON.stringify(error.response?.data));
      console.log('Error message:', error.message);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const sendWhatsApp = () => {
    if (!currentUser.phone) {
      Alert.alert('Error', 'El usuario no tiene número de teléfono');
      return;
    }
    let phone = currentUser.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '57' + phone;
    const message = `Hola ${user.name}, te escribo para hacerte seguimiento sobre tu plan de entrenamiento. Quedo atento a cualquier inquietud.`;
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  const getMembershipColor = () => {
    if (!membership) return COLORS.danger;
    if (membership.is_paid) return COLORS.success;
    return COLORS.warning;
  };

  const getMembershipText = () => {
    if (!membership) return 'Sin membresía';
    if (membership.is_paid) return 'Al día';
    return 'Pago pendiente';
  };

  const getImcColor = () => {
    if (!imc) return COLORS.textSecondary;
    if (imc.category === 'Peso normal') return COLORS.success;
    if (imc.category === 'Sobrepeso') return COLORS.warning;
    return COLORS.danger;
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Usuario</Text>
        <TouchableOpacity onPress={sendWhatsApp} style={styles.whatsappButton}>
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
        <TouchableOpacity
        onPress={() => setEditing(!editing)}
        style={styles.editButton}
        >
        <Ionicons
            name={editing ? 'close-outline' : 'create-outline'}
            size={24}
            color={COLORS.silver}
        />
        </TouchableOpacity> 
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.silver} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar y nombre */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0).toUpperCase()}{user.last_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name} {user.last_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {/* Membresía badge */}
          <View style={[styles.membershipBadge, { backgroundColor: `${getMembershipColor()}20` }]}>
            <View style={[styles.membershipDot, { backgroundColor: getMembershipColor() }]} />
            <Text style={[styles.membershipText, { color: getMembershipColor() }]}>
              {getMembershipText()}
            </Text>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateRoutine', { user })}
          >
            <Ionicons name="barbell-outline" size={22} color={COLORS.silver} />
            <Text style={styles.actionText}>Crear Rutina</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserRoutines', { user })}
          >
            <Ionicons name="list-outline" size={22} color={COLORS.silver} />
            <Text style={styles.actionText}>Ver Rutinas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserMembership', { user })}
          >
            <Ionicons name="card-outline" size={22} color={COLORS.silver} />
            <Text style={styles.actionText}>Membresía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UserNotes', { user })}
          >
            <Ionicons name="document-text-outline" size={22} color={COLORS.silver} />
            <Text style={styles.actionText}>Notas</Text>
          </TouchableOpacity>
        </View>

        {/* Info personal */}
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información personal</Text>

        {editing ? (
            <>
            <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                style={styles.input}
                placeholder="Edad"
                placeholderTextColor={COLORS.textSecondary}
                value={form.age}
                onChangeText={(v) => setForm(prev => ({ ...prev, age: v }))}
                keyboardType="numeric"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="fitness-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                style={styles.input}
                placeholder="Peso (kg)"
                placeholderTextColor={COLORS.textSecondary}
                value={form.weight}
                onChangeText={(v) => setForm(prev => ({ ...prev, weight: v }))}
                keyboardType="decimal-pad"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="resize-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                style={styles.input}
                placeholder="Altura (cm)"
                placeholderTextColor={COLORS.textSecondary}
                value={form.height}
                onChangeText={(v) => setForm(prev => ({ ...prev, height: v }))}
                keyboardType="decimal-pad"
                />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons
                name="body-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Grasa corporal (%)"
                placeholderTextColor={COLORS.textSecondary}
                value={form.body_fat}
                onChangeText={(v) =>
                  setForm(prev => ({ ...prev, body_fat: v }))
                }
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="barbell-outline"
                size={20}
                color={COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Masa muscular (kg)"
                placeholderTextColor={COLORS.textSecondary}
                value={form.muscle_mass}
                onChangeText={(v) =>
                  setForm(prev => ({ ...prev, muscle_mass: v }))
                }
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                style={styles.input}
                placeholder="Objetivo"
                placeholderTextColor={COLORS.textSecondary}
                value={form.goal}
                onChangeText={(v) => setForm(prev => ({ ...prev, goal: v }))}
                />
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
            >
                {saving ? (
                <ActivityIndicator color={COLORS.dark} />
                ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
                )}
            </TouchableOpacity>
            </>
        ) : (
            <>
            <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Celular</Text>
                <Text style={styles.infoValue}>{currentUser.phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Edad</Text>
                <Text style={styles.infoValue}>{currentUser.age ? `${currentUser.age} años` : 'N/A'}</Text>
                </View>
                <View style={styles.infoCard}>
                <Ionicons name="fitness-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{currentUser.weight ? `${currentUser.weight} kg` : 'N/A'}</Text>
                </View>
                <View style={styles.infoCard}>
                <Ionicons name="resize-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Altura</Text>
                <Text style={styles.infoValue}>{currentUser.height ? `${currentUser.height} cm` : 'N/A'}</Text>
                </View><View style={styles.infoCard}>
                <Ionicons
                  name="body-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.infoLabel}>Grasa corporal</Text>
                <Text style={styles.infoValue}>
                  {currentUser.body_fat
                    ? `${currentUser.body_fat}%`
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.infoLabel}>Masa muscular</Text>
                <Text style={styles.infoValue}>
                  {currentUser.muscle_mass
                    ? `${currentUser.muscle_mass} kg`
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {currentUser.goal && (
                <View style={styles.goalCard}>
                <Ionicons name="flag-outline" size={18} color={COLORS.silver} />
                <View style={styles.goalTexts}>
                    <Text style={styles.infoLabel}>Objetivo</Text>
                    <Text style={styles.goalValue}>{currentUser.goal}</Text>
                </View>
                </View>
            )}
            </>
        )}
        </View>

        {/* IMC */}
        {imc && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IMC</Text>
            <View style={styles.imcCard}>
              <View style={styles.imcLeft}>
                <Text style={[styles.imcValue, { color: getImcColor() }]}>{imc.imc}</Text>
                <Text style={styles.imcLabel}>Índice de Masa Corporal</Text>
              </View>
              <View style={[styles.imcBadge, { backgroundColor: `${getImcColor()}20` }]}>
                <Text style={[styles.imcCategory, { color: getImcColor() }]}>{imc.category}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Asistencia del mes */}
        {attendance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asistencia este mes</Text>
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceStat}>
                <Text style={styles.attendanceNumber}>{attendance.attended}</Text>
                <Text style={styles.attendanceLabel}>Asistencias</Text>
              </View>
              <View style={styles.attendanceDivider} />
              <View style={styles.attendanceStat}>
                <Text style={styles.attendanceNumber}>{attendance.missed}</Text>
                <Text style={styles.attendanceLabel}>Faltas</Text>
              </View>
              <View style={styles.attendanceDivider} />
              <View style={styles.attendanceStat}>
                <Text style={[styles.attendanceNumber, { color: COLORS.silver }]}>
                  {attendance.attendance_rate}%
                </Text>
                <Text style={styles.attendanceLabel}>Asistencia</Text>
              </View>
            </View>
          </View>
        )}

        {/* Progreso de peso */}
        {progress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progreso de peso</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressStat}>
                <Text style={styles.progressLabel}>Peso inicial</Text>
                <Text style={styles.progressValue}>{progress.initial_weight} kg</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
              <View style={styles.progressStat}>
                <Text style={styles.progressLabel}>Peso actual</Text>
                <Text style={styles.progressValue}>{progress.current_weight} kg</Text>
              </View>
              <View style={[
                styles.diffBadge,
                { backgroundColor: progress.difference <= 0 ? 'rgba(76,175,80,0.2)' : 'rgba(229,57,53,0.2)' }
              ]}>
                <Text style={[
                  styles.diffText,
                  { color: progress.difference <= 0 ? COLORS.success : COLORS.danger }
                ]}>
                  {progress.difference > 0 ? '+' : ''}{progress.difference} kg
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Entrenamientos programados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrenamientos</Text>

          {schedules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tiene entrenamientos programados</Text>
            </View>
          ) : (
            schedules
              .filter(s => !s.schedule.cancelled)
              .filter(s => !hiddenIds.includes(s.schedule.id))
              .sort((a, b) => new Date(b.schedule.date) - new Date(a.schedule.date))
              .map((item) => {
                const s = item.schedule;
                const sessionDone = sessionHistory.find(
                  sess => sess.schedule_id === s.id && sess.status === 'completed'
                );

                const scheduleDate = new Date(s.date + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((today - scheduleDate) / (1000 * 60 * 60 * 24));

                const canStart = s.routine_id && diffDays >= 0 && diffDays <= 7;

                return (
                  <View key={s.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleLeft}>
                      <Text style={styles.scheduleDate}>
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('es-CO', {
                          weekday: 'short', day: 'numeric', month: 'short'
                        })}
                      </Text>
                      <Text style={styles.scheduleTime}>
                        {s.start_time} - {s.end_time}
                      </Text>
                      {(s.routine_name || s.routine_id) && (
                        <Text style={styles.scheduleRoutine}>{s.routine_name || 'Rutina asignada'}</Text>
                      )}
                    </View>
                    <View style={styles.scheduleRight}>
                      {sessionDone ? (
                        <View style={styles.badgeRow}>
                          <TouchableOpacity
                            style={styles.confirmedBadge}
                            onPress={() => navigation.navigate('WorkoutSession', { schedule: s, user })}
                          >
                            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                            <Text style={[styles.badgeText, { color: COLORS.success }]}>Completado</Text>
                            <Ionicons name="chevron-forward" size={12} color={COLORS.success} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.hideBtn} onPress={() => hideSchedule(s.id)}>
                            <Ionicons name="eye-off-outline" size={14} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ) : canStart ? (
                        <TouchableOpacity
                          style={styles.startButton}
                          onPress={() => navigation.navigate('WorkoutSession', { schedule: s, user })}
                        >
                          <Ionicons name="play-circle-outline" size={14} color={COLORS.dark} />
                          <Text style={styles.startButtonText}>Iniciar</Text>
                        </TouchableOpacity>
                      ) : diffDays > 7 ? (
                        <View style={styles.badgeRow}>
                          <View style={styles.pendingBadge}>
                            <Ionicons name="lock-closed-outline" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.badgeText}>Vencido</Text>
                          </View>
                          <TouchableOpacity style={styles.hideBtn} onPress={() => hideSchedule(s.id)}>
                            <Ionicons name="eye-off-outline" size={14} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.badgeText}>No disponible</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
          )}

          {hiddenIds.length > 0 && (
            <TouchableOpacity
              style={styles.historyToggleBottom}
              onPress={unhideAll}
            >
              <Ionicons name="eye-outline" size={14} color={COLORS.silver} />
              <Text style={styles.historyToggleText}>
                Mostrar ocultos ({hiddenIds.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 30 }} />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
  },
  backButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    },
    inputIcon: {
    marginRight: 10,
    },
    input: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    fontSize: 15,
    },
    sessionCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.darkGray,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 8,
    },

    historyToggleBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: COLORS.darkGray, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 },
    statusBadgeCompleted: {
      backgroundColor: 'rgba(76,175,80,0.2)',
    },
    statusText: {
      fontSize: 11,
      color: COLORS.textSecondary,
      fontWeight: '600',
    },

    sessionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text,
    },

    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    hideBtn: { backgroundColor: COLORS.darkGray, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },

    sessionDate: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },

    exerciseBlock: {
      marginBottom: 10,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: COLORS.silver,
    },

    exerciseName: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
    },

    exerciseDetail: {
      fontSize: 12,
      color: COLORS.textSecondary,
      marginTop: 2,
    },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.darkGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    historyToggleText: { fontSize: 11, color: COLORS.silver, fontWeight: '600' },
    saveButton: {
      backgroundColor: COLORS.silver,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 5,
      },
    saveButtonText: {
      color: COLORS.dark,
      fontSize: 16,
      fontWeight: 'bold',
      },
    whatsappButton: {
      backgroundColor: 'rgba(37, 211, 102, 0.1)',
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(37, 211, 102, 0.3)',
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 25,
    },
    avatar: {
      width: 85,
      height: 85,
      borderRadius: 42,
      backgroundColor: COLORS.darkGray,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: COLORS.silver,
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 30,
      fontWeight: 'bold',
      color: COLORS.silver,
    },
    userName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginBottom: 12,
    },
    membershipBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    membershipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    membershipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    editButton: {
      backgroundColor: COLORS.card,
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 25,
    },
    actionButton: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    actionText: {
      fontSize: 11,
      color: COLORS.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 12,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 10,
    },
    infoCard: {
      width: '47%',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 14,
      gap: 5,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    infoLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    goalTexts: {
      flex: 1,
    },
    goalValue: {
      fontSize: 14,
      color: COLORS.text,
      marginTop: 2,
    },
    imcCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    imcLeft: {
      gap: 4,
    },
    imcValue: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    imcLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
    imcBadge: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    imcCategory: {
      fontSize: 14,
      fontWeight: '600',
    },
    attendanceCard: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    attendanceStat: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    attendanceNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    attendanceLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
    attendanceDivider: {
      width: 1,
      backgroundColor: COLORS.border,
      marginVertical: 5,
    },
    progressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    progressStat: {
      alignItems: 'center',
      gap: 4,
    },
    progressLabel: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
    progressValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    diffBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    diffText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    emptyCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    emptyText: {
      color: COLORS.textSecondary,
      fontSize: 14,
    },
    scheduleCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scheduleLeft: {
      flex: 1,
      gap: 3,
    },
    scheduleRight: {
      marginLeft: 10,
    },
    scheduleDate: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
      textTransform: 'capitalize',
    },
    scheduleTime: {
      fontSize: 12,
      color: COLORS.textSecondary,
    },
    scheduleRoutine: {
      fontSize: 11,
      color: COLORS.silver,
      marginTop: 2,
    },
    startButton: {
      backgroundColor: COLORS.silver,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    startButtonText: {
      color: COLORS.dark,
      fontSize: 12,
      fontWeight: 'bold',
    },
    confirmedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(76,175,80,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    pendingBadge: {
      backgroundColor: COLORS.darkGray,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    badgeText: {
      fontSize: 11,
      color: COLORS.textSecondary,
      fontWeight: '600',
    },
});