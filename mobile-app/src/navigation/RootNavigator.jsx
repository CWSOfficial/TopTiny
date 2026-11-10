import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../styles/theme';
import MainTabs from './MainTabs';
import AuthScreen from '../screens/AuthScreen';
import VenueDetailScreen from '../screens/VenueDetailScreen';
import SubmitVenueScreen from '../screens/SubmitVenueScreen';
import LegalScreen from '../screens/LegalScreen';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator();
const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream },
};
export default function RootNavigator() {
  const { session, profile } = useApp();
  const authenticated = Boolean(
    session?.user && profile?.id === session.user.id,
  );
  return (
    <NavigationContainer
      key={authenticated ? 'authenticated' : 'guest'}
      theme={theme}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        {authenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
            <Stack.Screen name="SubmitVenue" component={SubmitVenueScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={AuthScreen} />
            <Stack.Screen
              name="Signup"
              component={AuthScreen}
              initialParams={{ mode: 'register' }}
            />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
