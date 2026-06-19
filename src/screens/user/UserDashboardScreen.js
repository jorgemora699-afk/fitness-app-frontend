import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { Image } from 'react-native';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
};

const daysLeft = (endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T00:00:00');
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

export default function UserDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [membership, setMembership] = useState(null);
  const [todayRoutine, setTodayRoutine] = useState(null);
  const [nextSchedules, setNextSchedules] = useState([]);
  const [pendingSchedules, setPendingSchedules] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [membershipRes, routineRes, scheduleRes, pendingRes] = await Promise.allSettled([
        client.get(ENDPOINTS.ACTIVE_MEMBERSHIP),
        client.get(ENDPOINTS.MY_SCHEDULE),
        client.get(ENDPOINTS.MY_SCHEDULE),
        client.get(ENDPOINTS.PENDING_SCHEDULES),
      ]);

      if (membershipRes.status === 'fulfilled') {
        setMembership(membershipRes.value.data.membership);
      }

      if (routineRes.status === 'fulfilled') {
        const schedules = routineRes.value.data.schedules || [];
        const todaySchedule = schedules.find(s => s.date === today && !s.cancelled);
        setTodayRoutine(todaySchedule || null);
      } else {
        setTodayRoutine(null);
      }


      if (scheduleRes.status === 'fulfilled') {
        const schedules = scheduleRes.value.data.schedules || [];

        const upcoming = schedules
          .filter(schedule => {
            if (schedule.cancelled) return false;

            const scheduleDateTime = new Date(
              `${schedule.date}T${schedule.start_time}`
            );

            return scheduleDateTime > now;
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.start_time}`);
            const dateB = new Date(`${b.date}T${b.start_time}`);

            return dateA - dateB;
          });

        setNextSchedules(upcoming.slice(0, 3));
      } else {
        console.log('PENDING SCHEDULES ERROR:', pendingRes.reason?.response?.data || pendingRes.reason?.message);
      }
      if (pendingRes.status === 'fulfilled') {
        setPendingSchedules(pendingRes.value.data.schedules || []);
      } else {
        console.log('PENDING SCHEDULES ERROR:', pendingRes.reason?.response?.data || pendingRes.reason?.message);
      }
    } catch (error) {
      console.log('Error loading dashboard:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRespond = async (scheduleId, response) => {
    setRespondingId(scheduleId);
    try {
      await client.post(ENDPOINTS.RESPOND_SCHEDULE(scheduleId), { response });
      setPendingSchedules(prev => prev.filter(s => s.id !== scheduleId));
      if (response === 'confirmed') {
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar tu respuesta. Intenta de nuevo.');
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.silver} />
      </View>
    );
  }

  const days = membership ? daysLeft(membership.end_date) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.silver} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
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

        {/* Entrenamientos pendientes de confirmar */}
        {pendingSchedules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirma tu asistencia</Text>
            {pendingSchedules.map(schedule => (
              <View key={schedule.id} style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <Ionicons name="notifications-outline" size={18} color={COLORS.warning} />
                  <Text style={styles.pendingTitle}>Entrenamiento programado</Text>
                </View>
                <Text style={styles.pendingDate}>
                  {fmt(schedule.date)} · {schedule.start_time} - {schedule.end_time}
                </Text>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.btnDecline}
                    onPress={() => handleRespond(schedule.id, 'declined')}
                    disabled={respondingId === schedule.id}
                  >
                    {respondingId === schedule.id ? (
                      <ActivityIndicator size="small" color={COLORS.text} />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={16} color="#ff5252" />
                        <Text style={styles.btnDeclineText}>No voy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnConfirm}
                    onPress={() => handleRespond(schedule.id, 'confirmed')}
                    disabled={respondingId === schedule.id}
                  >
                    {respondingId === schedule.id ? (
                      <ActivityIndicator size="small" color={COLORS.dark} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.dark} />
                        <Text style={styles.btnConfirmText}>Voy a ir</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Membresía */}
        {membership && (
          <View style={styles.membershipCard}>
            <View style={styles.membershipLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={days <= 5 ? COLORS.warning : COLORS.success}
              />
              <View>
                <Text style={styles.membershipLabel}>Membresía activa</Text>
                <Text style={styles.membershipDate}>Vence el {fmt(membership.end_date)}</Text>
              </View>
            </View>
            {days <= 5 && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>{days}d</Text>
              </View>
            )}
          </View>
        )}

        {/* Rutina de hoy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutina de hoy</Text>

          {todayRoutine ? (
            <TouchableOpacity
              style={styles.routineCard}
              onPress={() => navigation.navigate('Rutina')}
              activeOpacity={0.8}
            >
              <View style={styles.routineIconContainer}>
                <Ionicons name="barbell" size={24} color={COLORS.silver} />
              </View>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>Entrenamiento de hoy</Text>
                <Text style={styles.routineExercises}>
                  {todayRoutine.start_time} - {todayRoutine.end_time}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="bed-outline" size={32} color={COLORS.border} />
              <Text style={styles.emptyText}>No tienes rutina para hoy</Text>
              <Text style={styles.emptySubtext}>Día de descanso 💤</Text>
            </View>
          )}
        </View>

        {/* Próximo entrenamiento */}
        {nextSchedules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Próximos entrenamientos
            </Text>

            {nextSchedules.map(schedule => (
              <View
                key={schedule.id}
                style={[
                  styles.scheduleCard,
                  { marginBottom: 10 }
                ]}
              >
                <View style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateText}>
                    {fmt(schedule.date)}
                  </Text>
                </View>

                <View style={styles.scheduleDivider} />

                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTime}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>

                  <View
                    style={[
                      styles.scheduleStatus,
                      schedule.confirmed
                        ? styles.statusConfirmed
                        : styles.statusPending
                    ]}
                  >
                    <Text style={styles.scheduleStatusText}>
                      {schedule.confirmed
                        ? 'Confirmado'
                        : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  profileButton: { borderRadius: 20 },
  membershipCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  membershipLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  membershipLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  membershipDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  warningBadge: { backgroundColor: 'rgba(255, 193, 7, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  warningText: { color: COLORS.warning, fontSize: 13, fontWeight: 'bold' },
  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  routineIconContainer: { backgroundColor: COLORS.darkGray, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  routineExercises: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  emptySubtext: { fontSize: 12, color: COLORS.metalGray },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  scheduleDate: { width: 70 },
  scheduleDateText: { fontSize: 14, fontWeight: 'bold', color: COLORS.silver },
  scheduleDivider: { width: 1, height: 35, backgroundColor: COLORS.border, marginHorizontal: 15 },
  scheduleInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleTime: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  scheduleStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusConfirmed: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  statusPending: { backgroundColor: 'rgba(255, 193, 7, 0.2)' },
  scheduleStatusText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  pendingCard: { backgroundColor: 'rgba(255, 193, 7, 0.08)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  pendingDate: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  pendingActions: { flexDirection: 'row', gap: 10 },
  btnDecline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.4)', backgroundColor: 'rgba(255, 82, 82, 0.08)' },
  btnDeclineText: { color: '#ff5252', fontWeight: '600', fontSize: 14 },
  btnConfirm: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.silver },
  btnConfirmText: { color: COLORS.dark, fontWeight: '700', fontSize: 14 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: COLORS.silver,
  },
});