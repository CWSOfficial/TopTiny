import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AppIcon from '../components/AppIcon';
import TopTiniLogo from '../components/TopTiniLogo';
import { colors } from '../styles/theme';
import styles from './SplashScreen.styles';

export default function SplashScreen({ online }) {
  const [checking, setChecking] = useState(false);
  async function retry() {
    setChecking(true);
    try {
      await NetInfo.refresh();
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  }
  return (
    <View style={styles.screen}>
      <View style={styles.topAccent} />
      <View style={styles.center}>
        <Image
          accessibilityLabel="TopTini app icon"
          source={require('../assets/images/toptini-app-icon.png')}
          style={styles.brandIcon}
        />
        <TopTiniLogo light size="large" />
      </View>
      <View style={styles.bottom}>
        {online === false ? (
          <>
            <View style={styles.offlineRow}>
              <AppIcon name="wifi-off" size={16} color={colors.softGold} />
              <Text style={styles.offlineTitle}>No internet connection</Text>
            </View>
            <Text style={styles.offlineBody}>
              Connect to Wi-Fi or mobile data to open your city guide.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={retry}
              style={styles.retry}
            >
              {checking ? (
                <ActivityIndicator size="small" color={colors.cream} />
              ) : (
                <>
                  <Text style={styles.retryText}>TRY AGAIN</Text>
                  <AppIcon name="arrow-right" size={15} color={colors.cream} />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loading}>SETTING THE TABLE…</Text>
          </>
        )}
      </View>
    </View>
  );
}
