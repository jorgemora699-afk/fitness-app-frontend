import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../utils/constants';

import AuthNavigator from './AuthNavigator';
import TrainerNavigator from './TrainerNavigator';
import UserAccessGate from './UserAccessGate';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : role === 'trainer' ? (
        <TrainerNavigator />
      ) : (
        <UserAccessGate  />
      )}
    </NavigationContainer>
  );
}