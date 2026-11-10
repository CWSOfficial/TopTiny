import React from 'react';
import { Text, View } from 'react-native';
import styles from './SectionHeading.styles';
export default function SectionHeading({ eyebrow, title, action }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}
