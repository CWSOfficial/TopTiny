import React from 'react';
import { Text } from 'react-native';
import flaticonGlyphMap from '../assets/icons/flaticonGlyphMap';

export default function AppIcon({ name, color, size = 16, style, ...props }) {
  const glyph = flaticonGlyphMap[name];
  if (!glyph) return null;

  return (
    <Text
      {...props}
      allowFontScaling={false}
      style={[
        {
          color,
          fontFamily: 'uicons-regular-rounded',
          fontSize: size,
          includeFontPadding: false,
          textAlign: 'center',
        },
        style,
      ]}
    >
      {String.fromCodePoint(glyph)}
    </Text>
  );
}
