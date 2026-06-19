import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { loginTrainer, loginUser } = useAuth();

  const [role, setRole] = useState('user'); // 'user' o 'trainer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
        if (role === 'trainer') {
        await loginTrainer(email, password);
        } else {
        await loginUser(email, password);
        }
    } catch (error) {
        console.log('Error completo:', JSON.stringify(error.response?.data));
        console.log('Status:', error.response?.status);
        const message = error.response?.data?.error || 'Error al iniciar sesión';
        Alert.alert('Error', message);
    } finally {
        setLoading(false);
    }
    };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Header con imagen */}
      <Image
        source={require('../../../assets/gym.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
      <View style={styles.headerOverlay} />

      <Image
        source={require('../../../assets/icon_sin_fondo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Botón volver */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Formulario */}
          <View style={styles.formContainer}>

            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

            {/* Selector de rol */}
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
                onPress={() => handleRoleChange('user')}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={role === 'user' ? COLORS.dark : COLORS.textSecondary}
                />
                <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>
                  Usuario
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, role === 'trainer' && styles.roleButtonActive]}
                onPress={() => handleRoleChange('trainer')}
              >
                <Ionicons
                  name="barbell"
                  size={18}
                  color={role === 'trainer' ? COLORS.dark : COLORS.textSecondary}
                />
                <Text style={[styles.roleText, role === 'trainer' && styles.roleTextActive]}>
                  Entrenador
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email */}
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

            {/* Contraseña */}
            <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="none"
            />
            <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeButton}
            >
                <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
                />
            </TouchableOpacity>
            </View>

            {/* Botón login */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Olvidé mi contraseña */}
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate(role === 'user' ? 'ResetPassword' : 'TrainerResetPassword')}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Registro */}
            {role === 'user' && (
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>
                  ¿No tienes cuenta?{' '}
                  <Text style={styles.registerTextBold}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
  },
  headerOverlay: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },
  logo: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    width: 400,
    height: 250,
    alignSelf: 'center',
    zIndex: 5,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 35,
    paddingBottom: 40,
    marginTop: height * 0.45,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    alignSelf: 'center',
    color: COLORS.textSecondary,
    marginBottom: 25,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: COLORS.silver,
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    color: COLORS.silver,
    fontSize: 14,
  },
  roleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  roleTextActive: {
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeButton: {
    padding: 5,
    },
  input: {
    flex: 1,
    height: 52,
    color: COLORS.text,
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: COLORS.silver,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  registerTextBold: {
    color: COLORS.silver,
    fontWeight: 'bold',
  },
});