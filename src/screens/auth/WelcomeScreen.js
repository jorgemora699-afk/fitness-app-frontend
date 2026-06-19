import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';
import { COLORS, FONTS } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      {/* Imagen de fondo */}
      <Image
        source={require('../../../assets/gym.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay} />

      {/* Contenido */}
      <View style={styles.content}>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Fit Track</Text>
          <Text style={styles.subtitle}>Inteligencia para tu rendimiento</Text>
          <Image
            source={require('../../../assets/icon_sin_fondo.png')}
            style={styles.logo}
            resizeMode="contain"
          />  
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            ¿Eres nuevo? Regístrate con el código de tu entrenador
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
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
    width: 300,
    height: 300,
    marginTop: 50,
  },
});