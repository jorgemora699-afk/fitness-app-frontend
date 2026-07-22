import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function TrainerUsersScreen({ navigation }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const approveUser = async (userId) => {
    try {
      await client.put(
        ENDPOINTS.APPROVE_USER(userId)
      );

      loadUsers();

      Alert.alert(
        'Éxito',
        'Usuario aprobado'
      );

    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Error'
      );
    }
  };

  const rejectUser = async (userId) => {
    Alert.alert(
      'Rechazar usuario',
      '¿Seguro que deseas rechazar esta solicitud?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.put(
                ENDPOINTS.REJECT_USER(userId)
              );

              loadUsers();

            } catch (error) {
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Error'
              );
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(approvedUsers);
    } else {
      const q = search.toLowerCase();

      setFiltered(
        approvedUsers.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      );
    }
  }, [search, approvedUsers]);

  const loadUsers = async () => {
    try {
      const response = await client.get(
        ENDPOINTS.GET_MY_USERS
      );

      const allUsers = response.data.users || [];

      const approved = allUsers.filter(
      u => u.trainer_status === 'approved'
    );

    const pending = allUsers.filter(
      u => u.trainer_status === 'pending'
    );

      setUsers(allUsers);
      setApprovedUsers(approved);
      setPendingUsers(pending);
      setFiltered(approved);

    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron cargar los usuarios'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const getMembershipStatus = (user) => {
    // Por ahora mostramos activo/inactivo basado en is_active
    return user.is_active;
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserDetail', { user: item })}
    >
      {/* Avatar */}
      {item.profile_photo ? (
        <Image source={{ uri: item.profile_photo }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}{item.last_name?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name} {item.last_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          {item.phone && (
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status */}
      <View style={styles.userRight}>
        <View style={[
          styles.statusBadge,
          getMembershipStatus(item) ? styles.statusActive : styles.statusInactive
        ]}>
          <Text style={styles.statusText}>
            {getMembershipStatus(item) ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Mis Usuarios</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userCount}>{approvedUsers.length} usuarios</Text>
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
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuario..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {pendingUsers.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Solicitudes pendientes
          </Text>

          {pendingUsers.map(user => (
            <View key={user.id} style={styles.pendingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>
                  {user.name} {user.last_name}
                </Text>

                <Text style={styles.userEmail}>
                  {user.email}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => approveUser(user.id)}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => rejectUser(user.id)}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.silver} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron usuarios' : 'No tienes usuarios registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!search && 'Comparte tu código para que se registren'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileButton: {
    borderRadius: 20,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 10,
  },

  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f39c12',
  },

  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.silver,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userRight: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
  },
  statusText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.metalGray,
    textAlign: 'center',
  },
  headerProfileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});