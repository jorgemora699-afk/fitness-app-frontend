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
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

function ExerciseRow({ ex, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    sets: ex.sets?.toString() || '',
    reps: ex.reps?.toString() || '',
    weight: ex.weight?.toString() || '',
    notes: ex.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await client.put(ENDPOINTS.UPDATE_EXERCISE(ex.id), {
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        notes: form.notes || null
      });
      onUpdate(response.data.exercise);
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar ejercicio',
      `¿Eliminar "${ex.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(ex.id) }
      ]
    );
  };

  if (editing) {
    return (
      <View style={styles.exerciseEditRow}>
        <Text style={styles.exerciseEditName}>{ex.name}</Text>
        <View style={styles.rowInputs}>
          <View style={[styles.inputContainer, styles.rowInput]}>
            <TextInput
              style={styles.input}
              placeholder="Series"
              placeholderTextColor={COLORS.textSecondary}
              value={form.sets}
              onChangeText={(v) => setForm(prev => ({ ...prev, sets: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputContainer, styles.rowInput]}>
            <TextInput
              style={styles.input}
              placeholder="Reps"
              placeholderTextColor={COLORS.textSecondary}
              value={form.reps}
              onChangeText={(v) => setForm(prev => ({ ...prev, reps: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputContainer, styles.rowInput]}>
            <TextInput
              style={styles.input}
              placeholder="Kg"
              placeholderTextColor={COLORS.textSecondary}
              value={form.weight}
              onChangeText={(v) => setForm(prev => ({ ...prev, weight: v }))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { height: 'auto', minHeight: 40 }]}
            placeholder="Notas"
            placeholderTextColor={COLORS.textSecondary}
            value={form.notes}
            onChangeText={(v) => setForm(prev => ({ ...prev, notes: v }))}
            multiline
          />
        </View>
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelEditText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveEditBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.dark} />
            ) : (
              <Text style={styles.saveEditText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.exerciseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{ex.name}</Text>
        {ex.notes ? <Text style={styles.exerciseNotes}>{ex.notes}</Text> : null}
      </View>
      <Text style={[styles.exerciseCell, styles.tableCell]}>{ex.sets ?? '—'}</Text>
      <Text style={[styles.exerciseCell, styles.tableCell]}>{ex.reps ?? '—'}</Text>
      <Text style={[styles.exerciseCell, styles.tableCell]}>{ex.weight != null ? ex.weight : '—'}</Text>
      <View style={styles.exerciseActions}>
        <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="create-outline" size={16} color={COLORS.silver} />
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RoutineCard({ routine, onDelete, onArchive, onUnarchive }) {
  const [expanded, setExpanded] = useState(false);
  const [exercises, setExercises] = useState(routine.exercises || []);
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Editar rutina
  const [editingRoutine, setEditingRoutine] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: routine.name, notes: routine.notes || '' });
  const [routineName, setRoutineName] = useState(routine.name);
  const [routineNotes, setRoutineNotes] = useState(routine.notes || '');
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Copiar rutina
  const [copyingRoutine, setCopyingRoutine] = useState(false);
  const [users, setUsers] = useState([]);
  const [copyUserId, setCopyUserId] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleSaveRoutine = async () => {
    if (!routineForm.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    setSavingRoutine(true);
    try {
      const response = await client.put(ENDPOINTS.UPDATE_ROUTINE(routine.id), {
        name: routineForm.name.trim(),
        notes: routineForm.notes?.trim() || null
      });
      setRoutineName(response.data.routine.name);
      setRoutineNotes(response.data.routine.notes || '');
      setEditingRoutine(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la rutina');
    } finally {
      setSavingRoutine(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await client.get(ENDPOINTS.GET_MY_USERS);
      setUsers(response.data.users || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCopyRoutine = async () => {
    if (!copyUserId) {
      Alert.alert('Error', 'Selecciona un usuario');
      return;
    }
    setSaving(true);
    try {
      const response = await client.post(ENDPOINTS.COPY_ROUTINE(routine.id), { user_id: copyUserId });
      Alert.alert('Éxito', response.data.message);
      setCopyingRoutine(false);
      setCopyUserId(null);
    } catch (error) {
      const message = error.response?.data?.error || 'No se pudo copiar la rutina';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExercise = (updatedEx) => {
    setExercises(prev => prev.map(e => e.id === updatedEx.id ? updatedEx : e));
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      await client.delete(ENDPOINTS.DELETE_EXERCISE(exerciseId));
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    } catch (error) {
      const message =
        error.response?.data?.error ||
        'No se pudo eliminar el ejercicio';

      Alert.alert('Error', message);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      Alert.alert('Error', 'El nombre del ejercicio es requerido');
      return;
    }
    setSaving(true);
    try {
      const response = await client.post(ENDPOINTS.ADD_EXERCISE(routine.id), {
        name: newExercise.name.trim(),
        sets: newExercise.sets ? parseInt(newExercise.sets) : null,
        reps: newExercise.reps ? parseInt(newExercise.reps) : null,
        weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
        notes: newExercise.notes?.trim() || null,
      });
      setExercises(prev => [...prev, response.data.exercise]);
      setNewExercise({ name: '', sets: '', reps: '', weight: '', notes: '' });
      setAddingExercise(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar rutina',
      `¿Eliminar "${routineName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(routine.id) }
      ]
    );
  };

  const confirmArchive = () => {
    Alert.alert(
      'Archivar rutina',
      `¿Deseas archivar "${routineName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Archivar',
          onPress: () => onArchive(routine.id)
        }
      ]
    );
  };

  const confirmUnarchive = () => {
    Alert.alert(
      'Restaurar rutina',
      `¿Deseas restaurar "${routineName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Restaurar',
          onPress: () => onUnarchive(routine.id)
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Card header */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8} style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.routineName}>{routineName}</Text>
          <View style={styles.exercisePill}>
            <Ionicons name="barbell-outline" size={12} color={COLORS.silver} />
            <Text style={styles.exercisePillText}>
              {exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <TouchableOpacity
            onPress={() => { setEditingRoutine(!editingRoutine); setCopyingRoutine(false); }}
            style={styles.cardActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={editingRoutine ? 'close-outline' : 'create-outline'} size={18} color={COLORS.silver} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setCopyingRoutine(!copyingRoutine);
              setEditingRoutine(false);
              if (!copyingRoutine) loadUsers();
            }}
            style={styles.cardActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={copyingRoutine ? 'close-outline' : 'copy-outline'} size={18} color={COLORS.silver} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={routine.is_archived ? confirmUnarchive : confirmArchive}
            style={styles.cardActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={routine.is_archived ? 'arrow-undo-outline' : 'archive-outline'} size={18} color={COLORS.silver} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmDelete}
            style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Editar rutina */}
      {editingRoutine && (
        <View style={styles.editRoutineForm}>
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Nombre de la rutina"
              placeholderTextColor={COLORS.textSecondary}
              value={routineForm.name}
              onChangeText={(v) => setRoutineForm(prev => ({ ...prev, name: v }))}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Notas de la rutina"
              placeholderTextColor={COLORS.textSecondary}
              value={routineForm.notes}
              onChangeText={(v) => setRoutineForm(prev => ({ ...prev, notes: v }))}
              multiline
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={() => {
                setEditingRoutine(false);
                setRoutineForm({ name: routineName, notes: routineNotes });
              }}
            >
              <Text style={styles.cancelEditText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveRoutine} disabled={savingRoutine}>
              {savingRoutine ? (
                <ActivityIndicator size="small" color={COLORS.dark} />
              ) : (
                <Text style={styles.saveEditText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Copiar rutina */}
      {copyingRoutine && (
        <View style={styles.editRoutineForm}>
          <Text style={styles.copyTitle}>Copiar rutina a otro usuario</Text>
          {loadingUsers ? (
            <ActivityIndicator color={COLORS.silver} />
          ) : (
            <>
              <Text style={styles.copyLabel}>Selecciona usuario:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
                 {users.filter(u => u.id !== routine.user_id).map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.userChip, copyUserId === u.id && styles.userChipActive]}
                    onPress={() => setCopyUserId(u.id)}
                  >
                    <Text style={[styles.userChipText, copyUserId === u.id && styles.userChipTextActive]}>
                      {u.name} {u.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => { setCopyingRoutine(false); setCopyUserId(null); }}
                >
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveEditBtn} onPress={handleCopyRoutine} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.dark} />
                  ) : (
                    <Text style={styles.saveEditText}>Copiar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Notas */}
      {routineNotes && expanded && (
        <View style={styles.notesRow}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.notesText}>{routineNotes}</Text>
        </View>
      )}

      {/* Ejercicios */}
      {expanded && (
        <View style={styles.exerciseList}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Ejercicio</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell]}>Series</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell]}>Reps</Text>
            <Text style={[styles.tableHeaderText, styles.tableCell]}>Kg</Text>
            <View style={{ width: 52 }} />
          </View>

          {exercises.map((ex) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              onUpdate={handleUpdateExercise}
              onDelete={handleDeleteExercise}
            />
          ))}

          {exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyExercisesText}>Sin ejercicios registrados</Text>
            </View>
          )}

          {addingExercise ? (
            <View style={styles.addExerciseForm}>
              <View style={styles.inputContainer}>
                <Ionicons name="barbell-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del ejercicio *"
                  placeholderTextColor={COLORS.textSecondary}
                  value={newExercise.name}
                  onChangeText={(v) => setNewExercise(prev => ({ ...prev, name: v }))}
                />
              </View>
              <View style={styles.rowInputs}>
                <View style={[styles.inputContainer, styles.rowInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Series"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newExercise.sets}
                    onChangeText={(v) => setNewExercise(prev => ({ ...prev, sets: v }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputContainer, styles.rowInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Reps"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newExercise.reps}
                    onChangeText={(v) => setNewExercise(prev => ({ ...prev, reps: v }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputContainer, styles.rowInput]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Kg"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newExercise.weight}
                    onChangeText={(v) => setNewExercise(prev => ({ ...prev, weight: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Notas"
                  placeholderTextColor={COLORS.textSecondary}
                  value={newExercise.notes}
                  onChangeText={(v) => setNewExercise(prev => ({ ...prev, notes: v }))}
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => { setAddingExercise(false); setNewExercise({ name: '', sets: '', reps: '', weight: '', notes: '' }); }}
                >
                  <Text style={styles.cancelEditText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveEditBtn} onPress={handleAddExercise} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.dark} />
                  ) : (
                    <Text style={styles.saveEditText}>Agregar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setAddingExercise(true)}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.silver} />
              <Text style={styles.addExerciseBtnText}>Agregar ejercicio</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function UserRoutinesScreen({ route, navigation }) {
  const { user } = route.params;
  const [routines, setRoutines] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutines = useCallback(async () => {
    try {
      const res = await client.get(ENDPOINTS.GET_USER_ROUTINES(user.id));
      setRoutines(res.data.routines || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las rutinas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const handleDelete = async (routineId) => {
    try {
      await client.delete(ENDPOINTS.DELETE_ROUTINE(routineId));
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    } catch (error) {
      console.log('DELETE error status:', error.response?.status);
      console.log('DELETE error data:', JSON.stringify(error.response?.data));
      const message =
        error.response?.data?.error ||
        'No se pudo eliminar la rutina';

      Alert.alert('Error', message);
    }
  };

  const activeRoutines = routines.filter(r => !r.is_archived);
  const archivedRoutines = routines.filter(r => r.is_archived);

  const handleArchiveRoutine = async (routineId) => {
    try {
      await client.put(
        ENDPOINTS.ARCHIVE_ROUTINE(routineId)
      );

      setRoutines(prev =>
        prev.map(r =>
          r.id === routineId
            ? { ...r, is_archived: true }
            : r
        )
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error ||
        'No se pudo archivar la rutina'
      );
    }
  };

  const handleUnarchiveRoutine = async (routineId) => {
    try {
      await client.put(
        ENDPOINTS.UNARCHIVE_ROUTINE(routineId)
      );

      setRoutines(prev =>
        prev.map(r =>
          r.id === routineId
            ? { ...r, is_archived: false }
            : r
        )
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error ||
        'No se pudo restaurar la rutina'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Rutinas</Text>
          <Text style={styles.headerSubtitle}>{user.name} {user.last_name}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{routines.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.silver} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRoutines(); }} tintColor={COLORS.silver} />}
          showsVerticalScrollIndicator={false}
        >
          {routines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin rutinas</Text>
              <Text style={styles.emptySubtitle}>Crea la primera rutina para {user.name}</Text>
            </View>
          ) : (
            <>
              {activeRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onDelete={handleDelete}
                  onArchive={handleArchiveRoutine}
                  onUnarchive={handleUnarchiveRoutine}
                />
              ))}

              {activeRoutines.length === 0 && archivedRoutines.length > 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="barbell-outline" size={52} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>Sin rutinas activas</Text>
                </View>
              )}

              {archivedRoutines.length > 0 && (
                <TouchableOpacity
                  style={styles.archivedToggle}
                  onPress={() => setShowArchived(!showArchived)}
                >
                  <Ionicons name="archive-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.archivedToggleText}>
                    Rutinas archivadas ({archivedRoutines.length})
                  </Text>
                  <Ionicons
                    name={showArchived ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}

              {showArchived && archivedRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onDelete={handleDelete}
                  onArchive={handleArchiveRoutine}
                  onUnarchive={handleUnarchiveRoutine}
                />
              ))}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRoutine', { user })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.dark} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, gap: 12 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, lineHeight: 22 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  countBadge: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  countText: { color: COLORS.silver, fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  cardLeft: { flex: 1, gap: 5 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardActionBtn: { backgroundColor: COLORS.darkGray, padding: 7, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  cardActionBtnDanger: { backgroundColor: 'rgba(229, 57, 53, 0.1)', borderColor: 'rgba(229, 57, 53, 0.3)' },
  routineName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  exercisePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exercisePillText: { fontSize: 12, color: COLORS.silver },
  editRoutineForm: { padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8, backgroundColor: COLORS.darkGray },
  copyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  copyLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  usersScroll: { marginBottom: 8 },
  userChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  userChipActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  userChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  userChipTextActive: { color: COLORS.dark, fontWeight: 'bold' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  notesText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  exerciseList: { borderTopWidth: 1, borderTopColor: COLORS.border },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.darkGray },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableCell: { width: 48, textAlign: 'center' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  exerciseName: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  exerciseNotes: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  exerciseCell: { fontSize: 14, color: COLORS.silver, fontWeight: '600' },
  exerciseActions: { flexDirection: 'row', gap: 12, marginLeft: 8 },
  exerciseEditRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  exerciseEditName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1, marginBottom: 0 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.darkGray, borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.border },
  input: { height: 40, color: COLORS.text, fontSize: 14, flex: 1 },
  editActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelEditBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  cancelEditText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  saveEditBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.silver, minWidth: 80, alignItems: 'center' },
  saveEditText: { color: COLORS.dark, fontSize: 13, fontWeight: 'bold' },
  addExerciseForm: { padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  addExerciseBtnText: { color: COLORS.silver, fontSize: 14, fontWeight: '600' },
  emptyExercises: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 16, alignItems: 'center' },
  emptyExercisesText: { fontSize: 13, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  archivedToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginTop: 8, marginBottom: 12 },
  archivedToggleText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: COLORS.silver, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },
});