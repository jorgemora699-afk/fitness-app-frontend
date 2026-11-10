import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

import AuthNavigator from './AuthNavigator';
import TrainerNavigator from './TrainerNavigator';
import UserAccessGate from './UserAccessGate';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.silver,
  },
};

function WebShell({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 1280, backgroundColor: COLORS.background }}>
        {children}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.silver} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthNavigator />
      ) : (
        <WebShell>
          {role === 'trainer' ? <TrainerNavigator /> : <UserAccessGate />}
        </WebShell>
      )}
    </NavigationContainer>
  );
}