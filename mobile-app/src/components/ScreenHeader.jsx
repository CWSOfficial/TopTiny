import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';
import TopTiniLogo from './TopTiniLogo';
import { colors } from '../styles/theme';
import styles from './ScreenHeader.styles';

export default function ScreenHeader({ city, onCityPress, onProfilePress }) {
  return (
    <View style={styles.header}>
      <TopTiniLogo />
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onCityPress}
        style={styles.cityPill}
      >
        <AppIcon name="map-pin" size={13} color={colors.roast} />
        <Text numberOfLines={1} style={styles.city}>
          {city}
        </Text>
        <AppIcon name="chevron-down" size={14} color={colors.muted} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={onProfilePress}
        style={styles.avatar}
      >
        <AppIcon name="user" size={16} color={colors.softGold} />
      </TouchableOpacity>
    </View>
  );
}
