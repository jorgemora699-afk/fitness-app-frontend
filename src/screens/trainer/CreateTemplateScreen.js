import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

export default function CreateTemplateScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [exercises, setExercises] = useState([
    {
      name: '',
      sets: '',
      reps: '',
      weight: '',
      notes: ''
    }
  ]);

  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        sets: '',
        reps: '',
        weight: '',
        notes: ''
      }
    ]);
  };

  const removeExercise = (index) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Debes ingresar un nombre para la plantilla');
      return;
    }

    const validExercises = exercises.filter(
      ex => ex.name.trim() !== ''
    );

    if (validExercises.length === 0) {
      Alert.alert('Error', 'Agrega al menos un ejercicio');
      return;
    }

    try {
      setSaving(true);

      await client.post(
        ENDPOINTS.CREATE_TEMPLATE,
        {
          name,
          description,
          exercises: validExercises.map(ex => ({
            name: ex.name,
            sets: ex.sets ? parseInt(ex.sets) : null,
            reps: ex.reps ? parseInt(ex.reps) : null,
            weight: ex.weight ? parseFloat(ex.weight) : null,
            notes: ex.notes || null
          }))
        }
      );

      Alert.alert(
        'Éxito',
        'Plantilla creada correctamente',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.log(error.response?.data);
      Alert.alert(
        'Error',
        'No se pudo crear la plantilla'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.dark}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Nueva Plantilla
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>
            Nombre de la plantilla
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Rutina Hipertrofia"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>
            Descripción
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción opcional"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.sectionTitle}>
              Ejercicios
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={addExercise}
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.dark}
              />
            </TouchableOpacity>
          </View>

          {exercises.map((exercise, index) => (
            <View
              key={index}
              style={styles.exerciseCard}
            >
              <View style={styles.exerciseTop}>
                <Text style={styles.exerciseTitle}>
                  Ejercicio {index + 1}
                </Text>

                {exercises.length > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      removeExercise(index)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor={
                  COLORS.textSecondary
                }
                value={exercise.name}
                onChangeText={(value) =>
                  updateExercise(
                    index,
                    'name',
                    value
                  )
                }
              />

              <View style={styles.row}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="Series"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  keyboardType="numeric"
                  value={exercise.sets}
                  onChangeText={(value) =>
                    updateExercise(
                      index,
                      'sets',
                      value
                    )
                  }
                />

                <TextInput
                  style={styles.smallInput}
                  placeholder="Reps"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  keyboardType="numeric"
                  value={exercise.reps}
                  onChangeText={(value) =>
                    updateExercise(
                      index,
                      'reps',
                      value
                    )
                  }
                />

                <TextInput
                  style={styles.smallInput}
                  placeholder="Peso"
                  placeholderTextColor={
                    COLORS.textSecondary
                  }
                  keyboardType="numeric"
                  value={exercise.weight}
                  onChangeText={(value) =>
                    updateExercise(
                      index,
                      'weight',
                      value
                    )
                  }
                />
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notas"
                placeholderTextColor={
                  COLORS.textSecondary
                }
                value={exercise.notes}
                onChangeText={(value) =>
                  updateExercise(
                    index,
                    'notes',
                    value
                  )
                }
                multiline
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color={COLORS.dark}
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Guardar Plantilla
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20
  },

  backButton: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold'
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 25
  },

  label: {
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '600'
  },

  input: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top'
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold'
  },

  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  addButton: {
    backgroundColor: COLORS.silver,
    padding: 8,
    borderRadius: 10
  },

  exerciseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  exerciseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  exerciseTitle: {
    color: COLORS.text,
    fontWeight: 'bold'
  },

  row: {
    flexDirection: 'row',
    gap: 10
  },

  smallInput: {
    flex: 1,
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },

  saveButton: {
    backgroundColor: COLORS.silver,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center'
  },

  saveButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 16
  }
});