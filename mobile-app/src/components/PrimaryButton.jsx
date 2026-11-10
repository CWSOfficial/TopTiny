import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { colors } from '../styles/theme';
import styles from './PrimaryButton.styles';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'dark',
  compact = false,
  loading = false,
  disabled = false,
  icon,
  labelSize,
}) {
  const light = variant === 'light';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        light && styles.light,
        variant === 'black' && styles.blackButton,
        variant === 'gold' && styles.goldButton,
        compact && styles.compact,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={light ? colors.espresso : colors.cream} />
      ) : (
        <>
          {icon ? (
            <Text style={[styles.icon, light && styles.textLight]}>{icon}</Text>
          ) : null}
          <Text
            style={[
              styles.label,
              light && styles.textLight,
              compact && styles.compactLabel,
              labelSize ? { fontSize: labelSize } : null,
            ]}
          >
            {title}
          </Text>
          <Text style={[styles.arrow, light && styles.textLight]}>↗</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
