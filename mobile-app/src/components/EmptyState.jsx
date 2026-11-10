import React from 'react';
import { Text, View } from 'react-native';
import AppIcon from './AppIcon';
import PrimaryButton from './PrimaryButton';
import { colors } from '../styles/theme';
import styles from './EmptyState.styles';
export default function EmptyState({
  title,
  message,
  action,
  onAction,
  icon = 'coffee',
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={23} color={colors.roast} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <PrimaryButton
          title={action}
          onPress={onAction}
          variant="light"
          compact
        />
      ) : null}
    </View>
  );
}
