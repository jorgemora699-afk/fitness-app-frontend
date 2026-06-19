import React, { useState, useEffect, useCallback, useRef  } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmt = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1]}`;
};

export default function UserProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imc, setImc] = useState(null);
  const [bodyProgress, setBodyProgress] = useState(null);
  const [records, setRecords] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseProgress, setExerciseProgress] = useState(null);
  const [searchingExercise, setSearchingExercise] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ weight: '', body_fat: '', muscle_mass: '' });
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [exerciseSuggestions, setExerciseSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [imcRes, progressRes, namesRes] = await Promise.all([
        client.get(ENDPOINTS.MY_IMC).catch(() => ({ data: {} })),
        client.get(ENDPOINTS.MY_BODY_PROGRESS).catch(() => ({ data: {} })),
        client.get(ENDPOINTS.MY_EXERCISE_NAMES).catch(() => ({ data: { names: [] } }))
      ]);
      setImc(imcRes.data || null);
      setBodyProgress(progressRes.data.summary || null);
      setRecords(progressRes.data.records || []);
      setExerciseSuggestions(namesRes.data.names || []);
    } catch (error) {
      console.log('Error loading progress:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getImcColor = () => {
    if (!imc) return COLORS.textSecondary;
    if (imc.category === 'Peso normal') return COLORS.success;
    if (imc.category === 'Sobrepeso') return COLORS.warning;
    if (imc.category === 'Bajo peso') return COLORS.warning;
    return COLORS.danger;
  };

  const searchExercise = async (nameOverride) => {
    const name = nameOverride || exerciseName;
    console.log('Buscando ejercicio:', JSON.stringify(name))
    if (!name.trim()) return;
    setSearchingExercise(true);
    try {
      const res = await client.get(`${ENDPOINTS.MY_EXERCISE_PROGRESS}?name=${name}`);
      setExerciseProgress(res.data);
    } catch (error) {
      console.log('Error:', error.response?.data);
      Alert.alert('Sin datos', `No hay registros para "${name}"`);
      setExerciseProgress(null);
    } finally {
      setSearchingExercise(false);
    }
  };

  const fetchSuggestions = async (text) => {
    setExerciseName(text);
    if (text.trim().length < 2) {
      setExerciseSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await client.get(ENDPOINTS.MY_EXERCISE_NAMES);
      const filtered = (res.data.names || []).filter(name =>
        name.toLowerCase().includes(text.toLowerCase())
      );
      setExerciseSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch {
      setExerciseSuggestions([]);
    }
  };

  const selectSuggestion = (name) => {
    setExerciseName(name);
    setShowSuggestions(false);
    setExerciseSuggestions([]);
  };

  const handleAddRecord = async () => {
  if (savingRef.current) return;
  if (!form.weight) {
    Alert.alert('Aviso', 'El peso es requerido');
    return;
  }
  savingRef.current = true;
  setSaving(true);
  try {
    await client.post(ENDPOINTS.ADD_BODY_RECORD, {
      weight: parseFloat(form.weight),
      body_fat: form.body_fat ? parseFloat(form.body_fat) : null,
      muscle_mass: form.muscle_mass ? parseFloat(form.muscle_mass) : null,
      recorded_at: localDate
    });
    setForm({ weight: '', body_fat: '', muscle_mass: '' });
    setShowAddModal(false);
    loadData();
  } catch (error) {
    Alert.alert('Error', 'No se pudo guardar el registro');
  } finally {
    savingRef.current = false;
    setSaving(false);
  }
};

  // Gráfica de peso con SVG
  const renderWeightChart = () => {
    if (records.length < 2) return null;

    const width = 320;
    const height = 160;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const weights = records.map(r => r.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;

    const xStep = (width - paddingLeft - paddingRight) / (records.length - 1);
    const yRange = maxW - minW;

    const getX = (i) => paddingLeft + i * xStep;
    const getY = (w) => paddingTop + ((maxW - w) / yRange) * (height - paddingTop - paddingBottom);

    const points = records.map((r, i) => `${getX(i)},${getY(r.weight)}`).join(' ');

    return (
      <Svg width={width} height={height}>
        {/* Línea de referencia */}
        <Line
          x1={paddingLeft} y1={paddingTop}
          x2={paddingLeft} y2={height - paddingBottom}
          stroke={COLORS.border} strokeWidth="1"
        />
        <Line
          x1={paddingLeft} y1={height - paddingBottom}
          x2={width - paddingRight} y2={height - paddingBottom}
          stroke={COLORS.border} strokeWidth="1"
        />

        {/* Línea del gráfico */}
        <Polyline
          points={points}
          fill="none"
          stroke={COLORS.silver}
          strokeWidth="2"
        />

        {/* Puntos */}
        {records.map((r, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(r.weight)}
            r="4"
            fill={COLORS.silver}
          />
        ))}

        {/* Etiquetas eje Y */}
        <SvgText x="2" y={getY(maxW) + 4} fontSize="9" fill={COLORS.textSecondary}>
          {Math.round(maxW)}
        </SvgText>
        <SvgText x="2" y={getY(minW) + 4} fontSize="9" fill={COLORS.textSecondary}>
          {Math.round(minW)}
        </SvgText>

        {/* Etiquetas eje X — solo primero y último */}
        <SvgText x={getX(0)} y={height - 5} fontSize="9" fill={COLORS.textSecondary} textAnchor="middle">
          {fmt(records[0].recorded_at)}
        </SvgText>
        <SvgText x={getX(records.length - 1)} y={height - 5} fontSize="9" fill={COLORS.textSecondary} textAnchor="middle">
          {fmt(records[records.length - 1].recorded_at)}
        </SvgText>
      </Svg>
    );
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
      <Text style={styles.headerTitle}>Mi Progreso</Text>
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

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.silver} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* IMC */}
        {imc && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>IMC</Text>
            <View style={styles.imcCard}>
              <View style={styles.imcLeft}>
                <Text style={[styles.imcValue, { color: getImcColor() }]}>{imc.imc}</Text>
                <Text style={styles.imcLabel}>Índice de Masa Corporal</Text>
                <Text style={styles.imcDetail}>{imc.weight} kg · {imc.height} cm</Text>
              </View>
              <View style={[styles.imcBadge, { backgroundColor: `${getImcColor()}20` }]}>
                <Text style={[styles.imcCategory, { color: getImcColor() }]}>{imc.category}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Historial de peso */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Historial de peso</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={18} color={COLORS.dark} />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="scale-outline" size={32} color={COLORS.border} />
              <Text style={styles.emptyText}>Sin registros de peso</Text>
              <Text style={styles.emptySubtext}>Toca "Agregar" para registrar tu peso</Text>
            </View>
          ) : (
            <>
              {/* Resumen */}
              {bodyProgress && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryLabel}>Inicial</Text>
                    <Text style={styles.summaryValue}>{bodyProgress.initial_weight} kg</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryLabel}>Actual</Text>
                    <Text style={styles.summaryValue}>{bodyProgress.current_weight} kg</Text>
                  </View>
                  <View style={[
                    styles.diffBadge,
                    { backgroundColor: bodyProgress.difference <= 0 ? 'rgba(76,175,80,0.2)' : 'rgba(229,57,53,0.2)' }
                  ]}>
                    <Text style={[
                      styles.diffText,
                      { color: bodyProgress.difference <= 0 ? COLORS.success : COLORS.danger }
                    ]}>
                      {bodyProgress.difference > 0 ? '+' : ''}{bodyProgress.difference} kg
                    </Text>
                  </View>
                </View>
              )}

              {/* Gráfica */}
              {records.length >= 2 && (
                <View style={styles.chartCard}>
                  {renderWeightChart()}
                </View>
              )}

              {/* Lista de registros */}
              {records.slice().reverse().map((r, i) => (
                <View key={i} style={styles.recordRow}>
                  <Text style={styles.recordDate}>{fmt(r.recorded_at)}</Text>
                  <Text style={styles.recordWeight}>{r.weight} kg</Text>
                  {r.body_fat && <Text style={styles.recordExtra}>{r.body_fat}% grasa</Text>}
                  {r.muscle_mass && <Text style={styles.recordExtra}>{r.muscle_mass} kg músculo</Text>}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Eliminar registro',
                        `¿Eliminar el registro de ${r.weight} kg?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await client.delete(ENDPOINTS.DELETE_BODY_RECORD(r.id));
                                loadData();
                              } catch (error) {
                                Alert.alert('Error', 'No se pudo eliminar el registro');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Progreso por ejercicio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progreso por ejercicio</Text>

          {exerciseSuggestions.length === 0 && !exerciseProgress && (
            <View style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={32} color={COLORS.border} />
              <Text style={styles.emptyText}>Sin ejercicios registrados</Text>
            </View>
          )}

          {exerciseSuggestions.length > 0 && !exerciseProgress && (
            <View style={styles.suggestionsContainer}>
              {exerciseSuggestions.map((name, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.suggestionItem,
                    i === exerciseSuggestions.length - 1 && styles.suggestionItemLast
                  ]}
                  onPress={() => searchExercise(name)}
                >
                  <Ionicons name="barbell-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.suggestionText}>{name}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {exerciseProgress && (
            <>
              <TouchableOpacity
                style={styles.backToListBtn}
                onPress={() => setExerciseProgress(null)}
              >
                <Ionicons name="arrow-back" size={14} color={COLORS.silver} />
                <Text style={styles.backToListText}>Ver todos los ejercicios</Text>
              </TouchableOpacity>

              {exerciseProgress.summary && (
                <View style={styles.exerciseSummaryCard}>
                  <Text style={styles.exerciseSummaryTitle}>{exerciseProgress.summary.exercise_name}</Text>
                  <View style={styles.exerciseStatsRow}>
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatValue}>{exerciseProgress.summary.initial_weight ?? '—'}</Text>
                      <Text style={styles.exerciseStatLabel}>Peso inicial (kg)</Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Text style={styles.exerciseStatValue}>{exerciseProgress.summary.max_weight ?? '—'}</Text>
                      <Text style={styles.exerciseStatLabel}>Máximo (kg)</Text>
                    </View>
                    <View style={styles.exerciseStat}>
                      <Text style={[
                        styles.exerciseStatValue,
                        { color: exerciseProgress.summary.improvement >= 0 ? COLORS.success : COLORS.danger }
                      ]}>
                        {exerciseProgress.summary.improvement > 0 ? '+' : ''}{exerciseProgress.summary.improvement ?? '—'}
                      </Text>
                      <Text style={styles.exerciseStatLabel}>Mejora (kg)</Text>
                    </View>
                  </View>
                </View>
              )}

              {exerciseProgress.progress?.map((p, i) => (
                <View key={i} style={styles.recordRow}>
                  <Text style={styles.recordDate}>{fmt(p.date.split('T')[0])}</Text>
                  <Text style={styles.recordWeight}>{p.exercise.weight ?? '—'} kg</Text>
                  <Text style={styles.recordExtra}>
                    {p.exercise.sets ?? '—'} × {p.exercise.reps ?? '—'} reps
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Modal agregar registro */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar peso</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="fitness-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                value={form.weight}
                onChangeText={(v) => setForm(prev => ({ ...prev, weight: v }))}
                placeholder="Peso (kg) *"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="body-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                value={form.body_fat}
                onChangeText={(v) => setForm(prev => ({ ...prev, body_fat: v }))}
                placeholder="Grasa corporal % (opcional)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="barbell-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                value={form.muscle_mass}
                onChangeText={(v) => setForm(prev => ({ ...prev, muscle_mass: v }))}
                placeholder="Masa muscular kg (opcional)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddRecord}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar registro</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  profileButton: { borderRadius: 20 },
  scrollContent: { paddingTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.silver, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addButtonText: { fontSize: 12, fontWeight: 'bold', color: COLORS.dark },
  imcCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  imcLeft: { gap: 4 },
  imcValue: { fontSize: 32, fontWeight: 'bold' },
  imcLabel: { fontSize: 12, color: COLORS.textSecondary },
  imcDetail: { fontSize: 11, color: COLORS.textSecondary },
  imcBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  imcCategory: { fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 12, color: COLORS.textSecondary },
  summaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  summaryStat: { alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  diffText: { fontSize: 14, fontWeight: 'bold' },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, alignItems: 'center' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  recordDate: { fontSize: 13, color: COLORS.textSecondary, width: 55 },
  recordWeight: { fontSize: 15, fontWeight: 'bold', color: COLORS.silver, flex: 1 },
  recordExtra: { fontSize: 12, color: COLORS.textSecondary },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
  searchButton: { backgroundColor: COLORS.silver, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  exerciseSummaryCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  exerciseSummaryTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  exerciseStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  exerciseStat: { alignItems: 'center', gap: 4 },
  exerciseStatValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.silver },
  exerciseStatLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 10 },
  modalInput: { flex: 1, height: 50, color: COLORS.text, fontSize: 15 },
  saveButton: { backgroundColor: COLORS.silver, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
  suggestionsContainer: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: -4, marginBottom: 12, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestionItemLast: { borderBottomWidth: 0 },
  suggestionText: { fontSize: 14, color: COLORS.text, flex: 1 },
  backToListBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backToListText: { fontSize: 13, color: COLORS.silver, fontWeight: '500' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.silver,
  },
});