import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';
export default StyleSheet.create({
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 9,
    backgroundColor: colors.cream,
  },
  cityPill: {
    marginLeft: 'auto',
    height: 38,
    maxWidth: 133,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  city: { fontSize: 10, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.espresso,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
