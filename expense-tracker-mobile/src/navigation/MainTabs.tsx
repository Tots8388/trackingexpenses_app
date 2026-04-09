import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionFormScreen from '../screens/TransactionFormScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import BudgetFormScreen from '../screens/BudgetFormScreen';
import RecurringScreen from '../screens/RecurringScreen';
import RecurringFormScreen from '../screens/RecurringFormScreen';
import ProfileScreen from '../screens/ProfileScreen';

// --- Stack param lists ---

export type TransactionStackParamList = {
  TransactionList: undefined;
  TransactionForm: { id?: number };
};

export type BudgetStackParamList = {
  BudgetList: undefined;
  BudgetForm: { id?: number };
};

export type RecurringStackParamList = {
  RecurringList: undefined;
  RecurringForm: { id?: number };
};

// --- Nested stacks ---

const TxStack = createNativeStackNavigator<TransactionStackParamList>();
function TransactionsStack() {
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TransactionList" component={TransactionsScreen} />
      <TxStack.Screen name="TransactionForm" component={TransactionFormScreen} />
    </TxStack.Navigator>
  );
}

const BdgStack = createNativeStackNavigator<BudgetStackParamList>();
function BudgetsStack() {
  return (
    <BdgStack.Navigator screenOptions={{ headerShown: false }}>
      <BdgStack.Screen name="BudgetList" component={BudgetsScreen} />
      <BdgStack.Screen name="BudgetForm" component={BudgetFormScreen} />
    </BdgStack.Navigator>
  );
}

const RecStack = createNativeStackNavigator<RecurringStackParamList>();
function RecurringStackNav() {
  return (
    <RecStack.Navigator screenOptions={{ headerShown: false }}>
      <RecStack.Screen name="RecurringList" component={RecurringScreen} />
      <RecStack.Screen name="RecurringForm" component={RecurringFormScreen} />
    </RecStack.Navigator>
  );
}

// --- Bottom tabs ---

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopColor: theme.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'home',
            Transactions: 'list',
            Reports: 'bar-chart',
            Budgets: 'wallet',
            More: 'ellipsis-horizontal',
          };
          return <Ionicons name={icons[route.name] || 'ellipsis-horizontal'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsStack} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsStack} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

// "More" tab contains Recurring + Profile
const MoreNavStack = createNativeStackNavigator();
function MoreStack() {
  return (
    <MoreNavStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreNavStack.Screen name="Profile" component={ProfileScreen} />
      <MoreNavStack.Screen name="RecurringStack" component={RecurringStackNav} />
    </MoreNavStack.Navigator>
  );
}
