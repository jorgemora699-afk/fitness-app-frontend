import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

const EMPTY_EXERCISE = () => ({
  key: Math.random().toString(36).slice(2),
  name: '',
  sets: '',
  reps: '',
  weight: '',
  notes: '',
});

function ExerciseCard({ exercise, index, onChange, onRemove }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View style={styles.exerciseIndex}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.exerciseCardTitle}>Ejercicio</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="barbell-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Nombre del ejercicio"
          placeholderTextColor={COLORS.textSecondary}
          value={exercise.name}
          onChangeText={(v) => onChange('name', v)}
        />
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputContainer, styles.rowInput]}>
          <TextInput
            style={styles.input}
            placeholder="Series"
            placeholderTextColor={COLORS.textSecondary}
            value={exercise.sets}
            onChangeText={(v) => onChange('sets', v)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, styles.rowInput]}>
          <TextInput
            style={styles.input}
            placeholder="Reps"
            placeholderTextColor={COLORS.textSecondary}
            value={exercise.reps}
            onChangeText={(v) => onChange('reps', v)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, styles.rowInput]}>
          <TextInput
            style={styles.input}
            placeholder="Kg"
            placeholderTextColor={COLORS.textSecondary}
            value={exercise.weight}
            onChangeText={(v) => onChange('weight', v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Notas (opcional)"
          placeholderTextColor={COLORS.textSecondary}
          value={exercise.notes}
          onChangeText={(v) => onChange('notes', v)}
        />
      </View>
    </View>
  );
}

export default function CreateRoutineScreen({ route, navigation }) {
  const { user } = route.params;
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([EMPTY_EXERCISE()]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => setExercises((prev) => [...prev, EMPTY_EXERCISE()]);

  const removeExercise = (key) => {
    if (exercises.length === 1) {
      Alert.alert('Aviso', 'Debe haber al menos un ejercicio');
      return;
    }
    setExercises((prev) => prev.filter((e) => e.key !== key));
  };

  const updateExercise = (key, field, value) => {
    setExercises((prev) =>
      prev.map((e) => (e.key === key ? { ...e, [field]: value } : e))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la rutina es obligatorio');
      return;
    }
    if (exercises.some((e) => !e.name.trim())) {
      Alert.alert('Error', 'Todos los ejercicios deben tener nombre');
      return;
    }

    setSaving(true);
    try {
      await client.post(ENDPOINTS.CREATE_ROUTINE, {
        user_id: user.id,
        name: name.trim(),
        notes: notes.trim() || null,
        exercises: exercises.map((e) => ({
          name: e.name.trim(),
          sets: e.sets ? parseInt(e.sets) : null,
          reps: e.reps ? parseInt(e.reps) : null,
          weight: e.weight ? parseFloat(e.weight) : null,
          notes: e.notes.trim() || null,
        })),
      });
      Alert.alert('Éxito', 'Rutina creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la rutina');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nueva Rutina</Text>
          <Text style={styles.headerSubtitle}>{user.name} {user.last_name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.dark} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Información general</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre de la rutina *"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color={COLORS.textSecondary}
            style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 14 }]}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas generales (opcional)"
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionTitle}>Ejercicios</Text>
          <View style={styles.exerciseCountBadge}>
            <Text style={styles.exerciseCountText}>{exercises.length}</Text>
          </View>
        </View>

        {exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.key}
            exercise={ex}
            index={idx}
            onChange={(field, value) => updateExercise(ex.key, field, value)}
            onRemove={() => removeExercise(ex.key)}
          />
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addExercise} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.silver} />
          <Text style={styles.addButtonText}>Agregar ejercicio</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, gap: 12 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, lineHeight: 22 },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  saveButton: { backgroundColor: COLORS.silver, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12, minWidth: 80, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  textAreaContainer: { alignItems: 'flex-start' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, color: COLORS.text, fontSize: 15 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  exercisesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
  exerciseCountBadge: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  exerciseCountText: { color: COLORS.silver, fontWeight: 'bold', fontSize: 13 },
  exerciseCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12, gap: 10 },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  exerciseIndex: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.darkGray, justifyContent: 'center', alignItems: 'center' },
  exerciseIndexText: { fontSize: 12, fontWeight: 'bold', color: COLORS.silver },
  exerciseCardTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  rowInput: { flex: 1, marginBottom: 0 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  addButtonText: { color: COLORS.silver, fontSize: 15, fontWeight: '600' },
});