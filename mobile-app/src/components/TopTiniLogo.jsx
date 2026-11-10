import React from 'react';
import { Image, View } from 'react-native';
import styles from './TopTiniLogo.styles';

const creamLogo = require('../assets/images/toptini-logo-cream.png');
const darkLogo = require('../assets/images/toptini-logo-dark.png');

export default function TopTiniLogo({ light = false, size = 'normal' }) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="TopTini"
        resizeMode="contain"
        source={light ? creamLogo : darkLogo}
        style={[styles.logo, size === 'large' && styles.large]}
      />
    </View>
  );
}
