import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';
export default StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 21,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.softGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontFamily: 'Georgia', fontSize: 22, color: colors.ink },
  message: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 7,
    marginBottom: 16,
  },
});
