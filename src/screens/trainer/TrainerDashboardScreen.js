import React, { useState, useEffect } from 'react';
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
  Clipboard,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

export default function TrainerDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [inactive, setInactive] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);

  useEffect(() => {
    loadData();
  }, []);
  
  const getLocalDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const loadData = async () => {
    try {
      const today = getLocalDate();
      const [usersRes, expiringRes, inactiveRes, schedulesRes] = await Promise.all([
        client.get(`${ENDPOINTS.GET_MY_USERS}?status=approved`),
        client.get(ENDPOINTS.EXPIRING_MEMBERSHIPS),
        client.get(`${ENDPOINTS.INACTIVE_USERS}?days=7`),
        client.get(`${ENDPOINTS.GET_SCHEDULE}?date=${today}`)
      ]);

      setUsers(usersRes.data.users || []);
      setExpiring(expiringRes.data.expiring || []);
      setInactive(inactiveRes.data.inactive_users || []);
      const filtered = (schedulesRes.data.schedules || []).filter(
        item => !item.schedule.cancelled && item.schedule.user_response !== 'declined'
      );
      setTodaySchedules(filtered);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
        {
            text: 'Cancelar',
            style: 'cancel'
        },
        {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: logout
        }
        ]
    );
    };

  const copyCode = () => {
    Clipboard.setString(user?.trainer_code || '');
    Alert.alert('✅ Copiado', 'Código copiado al portapapeles');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
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

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.silver} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.trainerName}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('TrainerProfile')}
          style={styles.profileButton}
        >
          {user?.profile_photo ? (
            <Image
              source={{ uri: user.profile_photo }}
              style={styles.headerProfileImage}
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

        {/* Código del entrenador */}
        <TouchableOpacity style={styles.codeCard} onPress={copyCode}>
          <View style={styles.codeLeft}>
            <Ionicons name="key-outline" size={20} color={COLORS.silver} />
            <View style={styles.codeTexts}>
              <Text style={styles.codeLabel}>Tu código de entrenador</Text>
              <Text style={styles.codeValue}>{user?.trainer_code}</Text>
            </View>
          </View>
          <View style={styles.copyButton}>
            <Ionicons name="copy-outline" size={18} color={COLORS.dark} />
            <Text style={styles.copyText}>Copiar</Text>
          </View>
        </TouchableOpacity>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color={COLORS.silver} />
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={28} color={COLORS.silver} />
            <Text style={styles.statNumber}>{todaySchedules.length}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning" size={28} color={COLORS.warning} />
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{expiring.length}</Text>
            <Text style={styles.statLabel}>Por vencer</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="moon" size={28} color={COLORS.danger} />
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>{inactive.length}</Text>
            <Text style={styles.statLabel}>Inactivos</Text>
          </View>
        </View>

        {/* Entrenamientos de hoy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrenamientos de hoy</Text>
          {todaySchedules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay entrenamientos programados para hoy</Text>
            </View>
          ) : (
            todaySchedules.map((item, index) => (
              <View key={index} style={styles.scheduleCard}>
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleTimeText}>{item.schedule.start_time}</Text>
                  <Text style={styles.scheduleTimeEnd}>{item.schedule.end_time}</Text>
                </View>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleName}>
                    {item.user?.name} {item.user?.last_name}
                  </Text>
                  <View style={[
                    styles.scheduleStatus,
                    item.schedule.confirmed ? styles.statusConfirmed : styles.statusPending
                  ]}>
                    <Text style={styles.scheduleStatusText}>
                      {item.schedule.confirmed ? 'Confirmado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Membresías por vencer */}
        {expiring.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membresías por vencer</Text>
            {expiring.map((item, index) => (
              <View key={index} style={styles.alertCard}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>
                    {item.user?.name} {item.user?.last_name}
                  </Text>
                  <Text style={styles.alertDetail}>
                    Vence en {item.days_left} día(s)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => {
                    const { Linking } = require('react-native');
                    Linking.openURL(item.whatsapp_url);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Usuarios inactivos */}
        {inactive.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usuarios inactivos</Text>
            {inactive.map((item, index) => (
              <View key={index} style={styles.alertCard}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>
                    {item.user?.name} {item.user?.last_name}
                  </Text>
                  <Text style={styles.alertDetail}>
                    {item.days_absent ? `${item.days_absent} días sin entrenar` : 'Sin registro de asistencia'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => {
                    const { Linking } = require('react-native');
                    Linking.openURL(item.whatsapp_url);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                </TouchableOpacity>
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
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  trainerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 12,
  },
  codeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeTexts: {
    gap: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  profileButton: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    },
  headerProfileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.silver,
    letterSpacing: 3,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.silver,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  copyText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleTime: {
    alignItems: 'center',
    width: 55,
  },
  scheduleTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.silver,
  },
  scheduleTimeEnd: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scheduleDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border,
    marginHorizontal: 15,
  },
  scheduleInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  scheduleStatusText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  alertDetail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  whatsappButton: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    padding: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
});