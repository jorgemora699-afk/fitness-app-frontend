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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

const toISO = (d) => d.toISOString().split('T')[0];

export default function AssignTemplateScreen({ route, navigation }) {
  const { template } = route.params;
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await client.get(`${ENDPOINTS.GET_MY_USERS}?status=approved`);
      setUsers(res.data.users || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un usuario');
      return;
    }

    setSaving(true);
    try {
      const res = await client.post(ENDPOINTS.ASSIGN_TEMPLATE(template.id), {
        user_ids: selectedUsers,
        dates: [toISO(new Date())]
      });
      Alert.alert(
        'Éxito',
        res.data.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
        const message =
          error.response?.data?.error ||
          'No se pudo asignar la plantilla';

        Alert.alert('Error', message);
      } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Asignar plantilla</Text>
          <Text style={styles.headerSubtitle}>{template.name}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Info plantilla */}
        <View style={styles.templateInfo}>
          <Ionicons name="copy-outline" size={20} color={COLORS.silver} />
          <View style={styles.templateTexts}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateExercises}>
              {template.exercises?.length} ejercicios
            </Text>
          </View>
        </View>

        {/* Seleccionar usuarios */}
        <Text style={styles.sectionTitle}>Selecciona usuarios</Text>

        {loadingUsers ? (
          <ActivityIndicator color={COLORS.silver} style={{ marginVertical: 20 }} />
        ) : users.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes usuarios registrados</Text>
          </View>
        ) : (
          <View style={styles.usersContainer}>
            {/* Seleccionar todos */}
            <TouchableOpacity
              style={[styles.selectAllBtn, selectedUsers.length === users.length && styles.selectAllBtnActive]}
              onPress={() => {
                if (selectedUsers.length === users.length) {
                  setSelectedUsers([]);
                } else {
                  setSelectedUsers(users.map(u => u.id));
                }
              }}
            >
              <Ionicons
                name={selectedUsers.length === users.length ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={selectedUsers.length === users.length ? COLORS.dark : COLORS.textSecondary}
              />
              <Text style={[
                styles.selectAllText,
                selectedUsers.length === users.length && styles.selectAllTextActive
              ]}>
                Seleccionar todos
              </Text>
            </TouchableOpacity>

            {users.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, selectedUsers.includes(u.id) && styles.userRowActive]}
                onPress={() => toggleUser(u.id)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {u.name?.charAt(0)}{u.last_name?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name} {u.last_name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <Ionicons
                  name={selectedUsers.includes(u.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={selectedUsers.includes(u.id) ? COLORS.silver : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Botón asignar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.assignBtn, saving && { opacity: 0.6 }]}
          onPress={handleAssign}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.dark} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.dark} />
              <Text style={styles.assignBtnText}>
                Asignar a {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, gap: 12 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  templateInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  templateTexts: { flex: 1 },
  templateName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  templateExercises: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  usersContainer: { gap: 8, marginBottom: 24 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  selectAllBtnActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  selectAllText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  selectAllTextActive: { color: COLORS.dark, fontWeight: 'bold' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  userRowActive: { borderColor: COLORS.silver },
  userAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.darkGray, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  userAvatarText: { fontSize: 14, fontWeight: 'bold', color: COLORS.silver },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.darkGray, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  summaryText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  summaryBold: { color: COLORS.silver, fontWeight: 'bold' },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.silver, borderRadius: 14, paddingVertical: 16 },
  assignBtnText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
});