import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import TrainerUsersScreen from '../screens/trainer/TrainerUsersScreen';
import TrainerCalendarScreen from '../screens/trainer/TrainerCalendarScreen';
import TrainerTemplatesScreen from '../screens/trainer/TrainerTemplatesScreen';
import TrainerFinancesScreen from '../screens/trainer/TrainerFinancesScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';
import UserDetailScreen from '../screens/trainer/UserDetailScreen';
import UserRoutinesScreen from '../screens/trainer/UserRoutinesScreen';
import CreateRoutineScreen from '../screens/trainer/CreateRoutineScreen';
import UserMembershipScreen from '../screens/trainer/UserMembershipScreen';
import UserNotesScreen from '../screens/trainer/UserNotesScreen';
import CreateTemplateScreen from '../screens/trainer/CreateTemplateScreen';
import TemplateDetailScreen from '../screens/trainer/TemplateDetailScreen';
import AssignTemplateScreen from '../screens/trainer/AssignTemplateScreen';
import WorkoutSessionScreen from '../screens/trainer/WorkoutSessionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack que envuelve cada tab para poder navegar al perfil desde cualquier pantalla
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerDashboardMain" component={TrainerDashboardScreen} />
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
    </Stack.Navigator>
  );
}

function UsersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerUsersMain" component={TrainerUsersScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
      <Stack.Screen name="UserRoutines" component={UserRoutinesScreen} />
      <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} />
      <Stack.Screen name="UserMembership" component={UserMembershipScreen} />
      <Stack.Screen name="UserNotes" component={UserNotesScreen} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
      
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerCalendarMain" component={TrainerCalendarScreen} />
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
    </Stack.Navigator>
  );
}

function TemplatesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerTemplatesMain" component={TrainerTemplatesScreen} />
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
      <Stack.Screen name="CreateTemplate" component={CreateTemplateScreen} />
      <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
      <Stack.Screen name="AssignTemplate" component={AssignTemplateScreen} />
    </Stack.Navigator>
  );
}

function FinancesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerFinancesMain" component={TrainerFinancesScreen} />
      <Stack.Screen name="TrainerProfile" component={TrainerProfileScreen} />
    </Stack.Navigator>
  );
}

export default function TrainerNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.silver,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + insets.bottom,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Usuarios') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Calendario') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Plantillas') iconName = focused ? 'copy' : 'copy-outline';
          else if (route.name === 'Finanzas') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Usuarios" component={UsersStack} />
      <Tab.Screen name="Calendario" component={CalendarStack} />
      <Tab.Screen name="Plantillas" component={TemplatesStack} />
      <Tab.Screen name="Finanzas" component={FinancesStack} />
    </Tab.Navigator>
  );
}