import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import AlertHost from './src/components/AlertHost';
import './src/utils/alertWeb';

export default function App() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <AlertHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}