import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';
export default StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: 15,
  },
  photo: {
    height: 205,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.espresso,
  },
  photoImage: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,17,12,.24)',
  },
  photoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newBadge: {
    backgroundColor: 'rgba(255,252,247,.92)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  newBadgeText: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: colors.roast,
  },
  photoText: {},
  category: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#E6C996',
    fontWeight: '800',
  },
  name: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: colors.white,
    marginTop: 5,
  },
  meta: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2EADF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: { flex: 1 },
  address: { fontSize: 12, fontWeight: '700', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 10, color: colors.ink, fontWeight: '800' },
  ratingCount: { fontSize: 9, color: colors.muted },
  city: { fontSize: 10, color: colors.muted, marginTop: 3 },
});
