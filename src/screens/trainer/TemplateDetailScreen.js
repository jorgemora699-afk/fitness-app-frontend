import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

export default function TemplateDetailScreen({ route, navigation }) {
  const { templateId } = route.params;

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [editing, setEditing] = useState(false);

  // Estado real (lo que está guardado)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState([]);

  // Estado temporal de edición (draft)
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftExercises, setDraftExercises] = useState([]);

  const [saving, setSaving] = useState(false);

  const hasChanges =
    draftName !== name ||
    draftDescription !== description ||
    JSON.stringify(draftExercises) !== JSON.stringify(exercises);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const response = await client.get(ENDPOINTS.GET_TEMPLATE(templateId));
      const data = response.data.template;

      setTemplate(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setExercises(data.exercises || []);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  // Al activar edición: inicializar draft con los valores actuales
  const startEditing = () => {
    setDraftName(name);
    setDraftDescription(description);
    setDraftExercises(exercises.map(ex => ({ ...ex })));
    setEditing(true);
  };

  // Al cancelar: descartar draft sin tocar el estado real
  const cancelEditing = () => {
    setDraftName('');
    setDraftDescription('');
    setDraftExercises([]);
    setEditing(false);
  };

  const updateDraftExercise = (index, field, value) => {
    const updated = [...draftExercises];
    updated[index] = { ...updated[index], [field]: value };
    setDraftExercises(updated);
  };

  const addDraftExercise = () => {
    setDraftExercises([
      ...draftExercises,
      { id: Date.now(), name: '', sets: '', reps: '', weight: '', notes: '' }
    ]);
  };

  const removeDraftExercise = (index) => {
    setDraftExercises(draftExercises.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar plantilla',
      '¿Deseas eliminar esta plantilla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: deleteTemplate }
      ]
    );
  };

  const deleteTemplate = async () => {
    try {
      await client.delete(ENDPOINTS.DELETE_TEMPLATE(template.id));
      Alert.alert('Éxito', 'Plantilla eliminada');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la plantilla');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        name: draftName,
        description: draftDescription,
        exercises: draftExercises.map(ex => ({
          name: ex.name,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps ? parseInt(ex.reps) : null,
          weight: ex.weight ? parseFloat(ex.weight) : null,
          notes: ex.notes || ''
        }))
      };

      const response = await client.put(
        ENDPOINTS.UPDATE_TEMPLATE(template.id),
        payload
      );

      const updatedTemplate = response.data.template;

      // Aplicar al estado real
      setTemplate(updatedTemplate);
      setName(updatedTemplate.name);
      setDescription(updatedTemplate.description || '');
      setExercises(updatedTemplate.exercises || []);

      // Limpiar draft
      setDraftName('');
      setDraftDescription('');
      setDraftExercises([]);
      setEditing(false);

      Alert.alert('Éxito', 'Plantilla actualizada correctamente');
    } catch (error) {
      console.log(error.response?.data || error);
      Alert.alert('Error', 'No se pudo actualizar la plantilla');
    } finally {
      setSaving(false);
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Plantilla</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={editing ? cancelEditing : startEditing}
          >
            <Ionicons
              name={editing ? 'close-outline' : 'create-outline'}
              size={22}
              color={COLORS.silver}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={editing ? { paddingBottom: 90 } : undefined}
      >
        {/* Nombre y descripción */}
        <View style={styles.templateCard}>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nombre"
              placeholderTextColor={COLORS.textSecondary}
            />
          ) : (
            <Text style={styles.templateName}>{name}</Text>
          )}

          {editing ? (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={draftDescription}
              onChangeText={setDraftDescription}
              placeholder="Descripción"
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          ) : (
            !!description && (
              <Text style={styles.description}>{description}</Text>
            )
          )}

          <View style={styles.badge}>
            <Ionicons name="barbell-outline" size={16} color={COLORS.silver} />
            <Text style={styles.badgeText}>
              {editing ? draftExercises.length : exercises.length} ejercicios
            </Text>
          </View>
        </View>

        {/* Ejercicios */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Ejercicios</Text>

          {(editing ? draftExercises : exercises).map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                {editing && (
                  <TouchableOpacity onPress={() => removeDraftExercise(index)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                )}

                {editing ? (
                  <TextInput
                    style={styles.exerciseInput}
                    value={exercise.name}
                    onChangeText={(value) => updateDraftExercise(index, 'name', value)}
                    placeholder="Nombre ejercicio"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                ) : (
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                )}
              </View>

              {editing ? (
                <View style={styles.exerciseEditRow}>
                  <TextInput
                    style={styles.smallInput}
                    value={exercise.sets?.toString() || ''}
                    onChangeText={(value) => updateDraftExercise(index, 'sets', value)}
                    placeholder="Series"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TextInput
                    style={styles.smallInput}
                    value={exercise.reps?.toString() || ''}
                    onChangeText={(value) => updateDraftExercise(index, 'reps', value)}
                    placeholder="Reps"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TextInput
                    style={styles.smallInput}
                    value={exercise.weight?.toString() || ''}
                    onChangeText={(value) => updateDraftExercise(index, 'weight', value)}
                    placeholder="Kg"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              ) : (
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseData}>{exercise.sets || '-'} Series</Text>
                  <Text style={styles.exerciseData}>{exercise.reps || '-'} Reps</Text>
                  <Text style={styles.exerciseData}>{exercise.weight || '-'} Kg</Text>
                </View>
              )}

              {editing ? (
                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  value={exercise.notes || ''}
                  onChangeText={(value) => updateDraftExercise(index, 'notes', value)}
                  placeholder="Notas"
                  placeholderTextColor={COLORS.textSecondary}
                />
              ) : (
                !!exercise.notes && (
                  <Text style={styles.notes}>{exercise.notes}</Text>
                )
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      {editing && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButtonSecondary}
            onPress={addDraftExercise}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.silver} />
            <Text style={styles.footerText}>Ejercicio</Text>
          </TouchableOpacity>

          {hasChanges && (
            <TouchableOpacity
              style={styles.footerButtonPrimary}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={COLORS.text} />
                  <Text style={styles.footerTextPrimary}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  backButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },

  headerActions: {
    flexDirection: 'row',
    gap: 10
  },

  iconButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  templateCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  templateName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text
  },

  description: {
    marginTop: 8,
    color: COLORS.textSecondary,
    lineHeight: 22
  },

  badge: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  badgeText: {
    color: COLORS.silver,
    fontWeight: '600'
  },

  section: {
    paddingHorizontal: 20
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },

  exerciseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },

  exerciseName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16
  },

  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  exerciseData: {
    color: COLORS.silver,
    fontSize: 13
  },

  notes: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13
  },

  input: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15
  },

  exerciseInput: {
    flex: 1,
    backgroundColor: COLORS.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold'
  },

  exerciseEditRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },

  smallInput: {
    flex: 1,
    backgroundColor: COLORS.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    textAlign: 'center',
    color: COLORS.text
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },

  footerButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.silver,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },

  footerButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8
  },

  footerTextPrimary: {
    color: COLORS.background,
    fontWeight: 'bold'
  },

  footerText: {
    color: COLORS.silver,
    fontWeight: '600'
  }
});