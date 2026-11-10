import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AppIcon from '../components/AppIcon';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.roast,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '800',
          letterSpacing: 1.1,
        },
        tabBarIcon: ({ color, size }) => (
          <AppIcon
            name={route.name === 'Discover' ? 'compass' : route.name === 'Leaderboard' ? 'trophy' : 'user'}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'DISCOVER' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'RANKINGS' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}
