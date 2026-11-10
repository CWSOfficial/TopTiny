import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';
export default StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    position: 'relative',
  },
  light: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  goldButton: { backgroundColor: colors.gold },
  blackButton: { backgroundColor: '#000000' },
  label: {
    color: colors.cream,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  textLight: { color: colors.espresso },
  arrow: { position: 'absolute', right: 19, color: '#D5B982', fontSize: 17 },
  icon: { position: 'absolute', left: 18, color: colors.cream, fontSize: 16 },
  compact: { height: 42, alignSelf: 'flex-start', paddingHorizontal: 16 },
  compactLabel: { fontSize: 9 },
  disabled: { opacity: 0.6 },
});
