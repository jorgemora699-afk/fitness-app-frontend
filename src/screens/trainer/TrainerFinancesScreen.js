import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';


const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day} ${MONTHS[parseInt(month) - 1].slice(0, 3)} ${year}`;
};

export default function TrainerFinancesScreen({ navigation }) {
  const { user } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFinances = useCallback(async () => {
    try {
      const res = await client.get(
        `${ENDPOINTS.FINANCES}?month=${month}&year=${year}`
      );
      setData(res.data);
    } catch (error) {
      console.log('Error loading finances:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => {
    setLoading(true);
    loadFinances();
  }, [loadFinances]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();

  const getPaymentMethodLabel = (method) => {
    if (method === 'cash') return 'Efectivo';
    if (method === 'transfer') return 'Transferencia';
    return method || '—';
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'cash') return 'cash-outline';
    if (method === 'transfer') return 'card-outline';
    return 'help-outline';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finanzas</Text>
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

      {/* Selector de mes */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthText}>{MONTHS[month - 1]}</Text>
          <Text style={styles.yearText}>{year}</Text>
        </View>
        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
          disabled={isCurrentMonth}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={isCurrentMonth ? COLORS.border : COLORS.silver}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.silver} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFinances(); }} tintColor={COLORS.silver} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Resumen */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Ionicons name="cash-outline" size={28} color={COLORS.silver} />
              <Text style={styles.summaryAmount}>
                ${(data?.total_collected || 0).toLocaleString('es-CO')}
              </Text>
              <Text style={styles.summaryLabel}>Total recaudado</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summarySmallCard}>
                <Ionicons name="receipt-outline" size={22} color={COLORS.silver} />
                <Text style={styles.summarySmallNumber}>{data?.count || 0}</Text>
                <Text style={styles.summarySmallLabel}>Pagos</Text>
              </View>
              <View style={styles.summarySmallCard}>
                <Ionicons name="people-outline" size={22} color={COLORS.silver} />
                <Text style={styles.summarySmallNumber}>
                  {[...new Set((data?.payments || []).map(p => p.user_id))].length}
                </Text>
                <Text style={styles.summarySmallLabel}>Usuarios</Text>
              </View>
            </View>
          </View>

          {/* Métodos de pago */}
          {data?.payments?.length > 0 && (
            <View style={styles.methodsContainer}>
              {['cash', 'transfer'].map(method => {
                const methodPayments = data.payments.filter(p => p.payment_method === method);
                if (methodPayments.length === 0) return null;
                const total = methodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                return (
                  <View key={method} style={styles.methodCard}>
                    <Ionicons name={getPaymentMethodIcon(method)} size={20} color={COLORS.silver} />
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodLabel}>{getPaymentMethodLabel(method)}</Text>
                      <Text style={styles.methodCount}>{methodPayments.length} pago{methodPayments.length > 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.methodAmount}>${total.toLocaleString('es-CO')}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Lista de pagos */}
          <Text style={styles.sectionTitle}>
            Detalle de pagos
          </Text>

          {!data?.payments?.length ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bar-chart-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Sin pagos</Text>
              <Text style={styles.emptySubtitle}>No hay pagos registrados en {MONTHS[month - 1]} {year}</Text>
            </View>
          ) : (
            data.payments.map((payment, index) => (
              <View key={payment.id || index} style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons
                      name={getPaymentMethodIcon(payment.payment_method)}
                      size={18}
                      color={COLORS.silver}
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentUser}>
                      {payment.user_name || `Usuario #${payment.user_id}`}
                    </Text>
                    <Text style={styles.paymentDates}>
                      {fmt(payment.start_date)} → {fmt(payment.end_date)}
                    </Text>
                    <Text style={styles.paymentMethod}>
                      {getPaymentMethodLabel(payment.payment_method)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.paymentAmount}>
                  ${(payment.amount || 0).toLocaleString('es-CO')}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, marginBottom: 8 },
  monthArrow: { backgroundColor: COLORS.card, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  monthArrowDisabled: { opacity: 0.4 },
  monthCenter: { alignItems: 'center' },
  monthText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  yearText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20 },
  summaryContainer: { gap: 10, marginBottom: 20 },
  summaryCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: COLORS.text },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summarySmallCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  summarySmallNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  summarySmallLabel: { fontSize: 12, color: COLORS.textSecondary },
  methodsContainer: { gap: 8, marginBottom: 20 },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  methodCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  methodAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.silver },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  paymentIconContainer: { backgroundColor: COLORS.darkGray, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  paymentInfo: { flex: 1 },
  paymentUser: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  paymentDates: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  paymentMethod: { fontSize: 11, color: COLORS.metalGray, marginTop: 2 },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.silver },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
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
});