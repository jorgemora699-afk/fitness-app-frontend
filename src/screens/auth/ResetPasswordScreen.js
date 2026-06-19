import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../../api/client';
import { ENDPOINTS, COLORS } from '../../utils/constants';

export default function ResetPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: datos, 2: nueva contraseña
  const [email, setEmail] = useState('');
  const [trainerCode, setTrainerCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    if (!email || !trainerCode) {
      Alert.alert('Error', 'Ingresa tu email y el código del entrenador');
      return;
    }
    setStep(2);
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Ingresa y confirma tu nueva contraseña');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await client.post(ENDPOINTS.RESET_PASSWORD, {
        email,
        trainer_code: trainerCode,
        new_password: newPassword
      });
      Alert.alert('¡Listo!', 'Contraseña actualizada correctamente', [
        { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recuperar contraseña</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Indicador de pasos */}
          <View style={styles.stepsRow}>
            <View style={[styles.step, step >= 1 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.step, step >= 2 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <Text style={styles.stepTitle}>Verificar identidad</Text>
                <Text style={styles.stepSubtitle}>
                  Ingresa tu email y el código de tu entrenador para continuar
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Código del entrenador"
                    placeholderTextColor={COLORS.textSecondary}
                    value={trainerCode}
                    onChangeText={(v) => setTrainerCode(v.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleVerify}>
                  <Text style={styles.buttonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Nueva contraseña</Text>
                <Text style={styles.stepSubtitle}>
                  Ingresa tu nueva contraseña
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={COLORS.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor={COLORS.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.dark} />
                  ) : (
                    <Text style={styles.buttonText}>Actualizar contraseña</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backStep}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.backStepText}>Volver</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },
  backButton: { backgroundColor: COLORS.card, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 0 },
  step: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: COLORS.silver, borderColor: COLORS.silver },
  stepText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary },
  stepTextActive: { color: COLORS.dark },
  stepLine: { width: 60, height: 2, backgroundColor: COLORS.border },
  stepLineActive: { backgroundColor: COLORS.silver },
  formContainer: { paddingHorizontal: 24, paddingTop: 10 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.input, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: COLORS.text, fontSize: 15 },
  button: { backgroundColor: COLORS.silver, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: COLORS.dark, fontSize: 16, fontWeight: 'bold' },
  backStep: { alignItems: 'center', marginTop: 16 },
  backStepText: { color: COLORS.textSecondary, fontSize: 14 },
});