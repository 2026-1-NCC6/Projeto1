import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import EnvironmentsScreen from '../screens/EnvironmentsScreen';
import EnvironmentDetailScreen from '../screens/EnvironmentDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import { colors } from '../utils/styles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function EnvironmentStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="AmbientesLista" component={EnvironmentsScreen} options={{ title: 'Ambientes' }} />
      <Stack.Screen name="AmbienteDetalhes" component={EnvironmentDetailScreen} options={{ title: 'Detalhes do ambiente' }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Ambientes" component={EnvironmentStack} options={{ headerShown: false, tabBarIcon: () => null }} />
      <Tab.Screen name="Alertas" component={AlertsScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Preferências" component={PreferencesScreen} options={{ tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}
