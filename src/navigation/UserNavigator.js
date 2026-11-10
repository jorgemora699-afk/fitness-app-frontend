import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useResponsive from '../hooks/useResponsive';
import { buildTabOptions } from './tabOptions';

import UserDashboardScreen from '../screens/user/UserDashboardScreen';
import UserRoutineScreen from '../screens/user/UserRoutineScreen';
import UserProgressScreen from '../screens/user/UserProgressScreen';
import UserPhotosScreen from '../screens/user/UserPhotosScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserDashboardMain" component={UserDashboardScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

function RoutineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserRoutineMain" component={UserRoutineScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProgressMain" component={UserProgressScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

function PhotosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserPhotosMain" component={UserPhotosScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

export default function UserNavigator() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const tabOptions = buildTabOptions({ isDesktop, insets });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Rutina') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Progreso') iconName = focused ? 'trending-up' : 'trending-up-outline';
          else if (route.name === 'Fotos') iconName = focused ? 'images' : 'images-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Rutina" component={RoutineStack} />
      <Tab.Screen name="Progreso" component={ProgressStack} />
      <Tab.Screen name="Fotos" component={PhotosStack} />
    </Tab.Navigator>
  );
}