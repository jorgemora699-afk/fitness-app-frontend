import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';


export default function LoginScreen({ navigation }) {
  const { loginTrainer, loginUser } = useAuth();

  const [role, setRole] = useState('user'); // 'user' o 'trainer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

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

      <Image
        source={require('../../../assets/gym.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

      {!isDesktop && (
        <Image
          source={require('../../../assets/icon_sin_fondo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {isDesktop && (
            <Image
              source={require('../../../assets/icon_sin_fondo.png')}
              style={styles.logoDesktop}
              resizeMode="contain"
            />
          )}

          <View style={[styles.formContainer, isDesktop ? styles.formDesktop : { marginTop: height * 0.45 }]}>

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
    backgroundColor: COLORS.dark,
  },
  backgroundImage: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 60,
    fontFamily: 'BebasNeue_400Regular',
    color: COLORS.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.lightGray,
    marginTop: 20,
    letterSpacing: 2,
    fontWeight: '300',
  },
  buttonsContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerText: {
    color: COLORS.lightGray,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  logo: {
    marginTop: 50,
  },
});