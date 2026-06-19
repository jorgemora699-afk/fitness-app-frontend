import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';

export default function MembershipBlockedScreen({ membershipInfo, onRetry }) {
  const { user, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleRetry = async () => {
    setChecking(true);
    await onRetry();
    setChecking(false);
  };

  const isExpired = membershipInfo?.error?.includes('No hay membresía activa');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={COLORS.warning} />
        </View>

        <Text style={styles.title}>
          {isExpired ? 'Membresía vencida' : 'Sin membresía activa'}
        </Text>

        <Text style={styles.subtitle}>
          {isExpired
            ? 'Tu membresía ha vencido. Para continuar usando la app, contacta a tu entrenador para renovar tu pago.'
            : 'Aún no tienes una membresía activa. Contacta a tu entrenador para activar tu acceso.'}
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.silver} />
          <Text style={styles.infoText}>
            Una vez tu entrenador confirme tu pago, podrás volver a entrenar con normalidad.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color={COLORS.dark} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={COLORS.dark} />
              <Text style={styles.retryButtonText}>Verificar de nuevo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.silver,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 14,
  },
  retryButtonText: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});