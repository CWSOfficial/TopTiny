import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { colors } from './src/styles/theme';
import styles from './App.styles';

function AppContent() {
  const { booting, online, authReady } = useApp();
  const [minimumSplashComplete, setMinimumSplashComplete] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashComplete(true), 850);
    return () => clearTimeout(timer);
  }, []);
  const showingSplash =
    !minimumSplashComplete ||
    booting ||
    !authReady ||
    online === false ||
    online === null;

  return (
    <>
      <StatusBar
        barStyle={showingSplash ? 'light-content' : 'dark-content'}
        backgroundColor={showingSplash ? colors.espresso : colors.cream}
      />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.safeArea, showingSplash && styles.splashSafeArea]}
      >
        {showingSplash ? <SplashScreen online={online} /> : <RootNavigator />}
      </SafeAreaView>
    </>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
