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
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

const CATEGORIES = [
  { key: 'lesion', label: 'Lesión', icon: 'medical-outline', color: '#E53935' },
  { key: 'observacion', label: 'Observación', icon: 'eye-outline', color: '#457B9D' },
  { key: 'objetivo', label: 'Objetivo', icon: 'flag-outline', color: '#4CAF50' },
  { key: 'otro', label: 'Otro', icon: 'ellipsis-horizontal-outline', color: '#B0B0B0' },
];

const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[3];

function NoteCard({ note, onEdit, onDelete }) {
  const category = getCategoryInfo(note.category);

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar nota',
      `¿Eliminar "${note.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(note.id) }
      ]
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '22', borderColor: category.color + '55' }]}>
          <Ionicons name={category.icon} size={13} color={category.color} />
          <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => onEdit(note)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.noteActionBtn}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.silver} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.noteActionBtn, styles.noteActionBtnDanger]}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.noteTitle}>{note.title}</Text>
      <Text style={styles.noteContent}>{note.content}</Text>
      <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
    </View>
  );
}

function NoteModal({ visible, note, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'otro'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title,
        content: note.content,
        category: note.category || 'otro'
      });
    } else {
      setForm({ title: '', content: '', category: 'otro' });
    }
  }, [note, visible]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!form.content.trim()) {
      Alert.alert('Error', 'El contenido es requerido');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{note ? 'Editar nota' : 'Nueva nota'}</Text>

          {/* Categoría */}
          <Text style={styles.modalLabel}>Categoría</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  form.category === cat.key && {
                    backgroundColor: cat.color + '22',
                    borderColor: cat.color
                  }
                ]}
                onPress={() => setForm(prev => ({ ...prev, category: cat.key }))}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={form.category === cat.key ? cat.color : COLORS.textSecondary}
                />
                <Text style={[
                  styles.categoryChipText,
                  form.category === cat.key && { color: cat.color, fontWeight: '600' }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Título */}
          <Text style={styles.modalLabel}>Título</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Título de la nota"
              placeholderTextColor={COLORS.textSecondary}
              value={form.title}
              onChangeText={(v) => setForm(prev => ({ ...prev, title: v }))}
            />
          </View>

          {/* Contenido */}
          <Text style={styles.modalLabel}>Contenido</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribe tu nota aquí..."
              placeholderTextColor={COLORS.textSecondary}
              value={form.content}
              onChangeText={(v) => setForm(prev => ({ ...prev, content: v }))}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Acciones */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={onClose}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveModalBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.dark} />
              ) : (
                <Text style={styles.saveModalText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UserNotesScreen({ route, navigation }) {
  const { user } = route.params;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);

  const loadNotes = useCallback(async () => {
    try {
      const url = filterCategory
        ? `${ENDPOINTS.GET_USER_NOTES(user.id)}?category=${filterCategory}`
        : ENDPOINTS.GET_USER_NOTES(user.id);
      const res = await client.get(url);
      setNotes(res.data.notes || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las notas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id, filterCategory]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async (form) => {
    if (editingNote) {
      await client.put(ENDPOINTS.UPDATE_NOTE(editingNote.id), form);
      setNotes(prev => prev.map(n =>
        n.id === editingNote.id ? { ...n, ...form } : n
      ));
    } else {
      const res = await client.post(ENDPOINTS.CREATE_NOTE, {
        user_id: user.id,
        ...form
      });
      setNotes(prev => [res.data.note, ...prev]);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await client.delete(ENDPOINTS.DELETE_NOTE(noteId));
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la nota');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingNote(null);
    setShowModal(true);
  };

  const filteredNotes = filterCategory
    ? notes.filter(n => n.category === filterCategory)
    : notes;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notas privadas</Text>
          <Text style={styles.headerSubtitle}>{user.name} {user.last_name}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleNew}>
          <Ionicons name="add" size={20} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* Filtros por categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterChip,
              filterCategory === cat.key && { backgroundColor: cat.color + '22', borderColor: cat.color }
            ]}
            onPress={() => setFilterCategory(filterCategory === cat.key ? null : cat.key)}
          >
            <Ionicons
              name={cat.icon}
              size={13}
              color={filterCategory === cat.key ? cat.color : COLORS.textSecondary}
            />
            <Text style={[
              styles.filterChipText,
              filterCategory === cat.key && { color: cat.color, fontWeight: '600' }
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.silver} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotes(); }} tintColor={COLORS.silver} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin notas</Text>
              <Text style={styles.emptySubtitle}>
                {filterCategory ? 'No hay notas en esta categoría' : `Agrega notas privadas sobre ${user.name}`}
              </Text>
              {!filterCategory && (
                <TouchableOpacity style={styles.emptyBtn} onPress={handleNew}>
                  <Text style={styles.emptyBtnText}>Nueva nota</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleNew} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={COLORS.dark} />
      </TouchableOpacity>

      <NoteModal
        visible={showModal}
        note={editingNote}
        onClose={() => { setShowModal(false); setEditingNote(null); }}
        onSave={handleSave}
      />
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
  newBtn: { backgroundColor: COLORS.silver, padding: 10, borderRadius: 12 },
  filtersContainer: { paddingHorizontal: 20, paddingBottom: 8, gap: 6, alignItems: 'center', height: 80 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 18, paddingVertical: 18, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.dark, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  noteCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, gap: 8 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  noteActions: { flexDirection: 'row', gap: 8 },
  noteActionBtn: { backgroundColor: COLORS.darkGray, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  noteActionBtnDanger: { backgroundColor: 'rgba(229, 57, 53, 0.1)', borderColor: 'rgba(229, 57, 53, 0.3)' },
  noteTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  noteContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  noteDate: { fontSize: 11, color: COLORS.metalGray },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { marginTop: 8, backgroundColor: COLORS.silver, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: COLORS.silver, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 8 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  modalLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.0, marginBottom: 8, marginTop: 8 },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 18 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 19, paddingVertical: 15, borderRadius: 20, backgroundColor: COLORS.darkGray, borderWidth: 1, borderColor: COLORS.border },
  categoryChipText: { fontSize: 12, color: COLORS.textSecondary },
  inputContainer: { backgroundColor: COLORS.darkGray, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  textAreaContainer: { minHeight: 120 },
  input: { height: 46, color: COLORS.text, fontSize: 15 },
  textArea: { height: 120, paddingTop: 12, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  saveModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.silver, alignItems: 'center' },
  saveModalText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
});