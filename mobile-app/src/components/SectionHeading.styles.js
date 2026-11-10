import { StyleSheet } from 'react-native';
import { colors } from '../styles/theme';
export default StyleSheet.create({
  row: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: colors.roast,
    fontWeight: '800',
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 25,
    color: colors.ink,
    marginTop: 5,
  },
});
