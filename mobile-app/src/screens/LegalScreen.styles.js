import { StyleSheet } from 'react-native';
import { colors, radius } from '../styles/theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 23, paddingTop: 12, paddingBottom: 36 },
  backButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'flex-start', paddingRight: 14 },
  backText: { color: colors.roast, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  heading: { paddingTop: 28, paddingBottom: 28 },
  eyebrow: { color: colors.roast, fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 12, color: colors.ink, fontFamily: 'Georgia', fontSize: 37, lineHeight: 44 },
  updated: { marginTop: 9, color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: .4 },
  intro: { marginTop: 18, color: colors.roast, fontSize: 13, lineHeight: 21 },
  sections: { borderTopWidth: 1, borderTopColor: colors.line },
  section: { flexDirection: 'row', gap: 14, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.line },
  sectionNumber: { width: 24, paddingTop: 3, color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  sectionCopy: { flex: 1 },
  sectionTitle: { marginBottom: 7, color: colors.ink, fontFamily: 'Georgia', fontSize: 18 },
  body: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  switchPolicy: { marginTop: 22, padding: 16, borderRadius: radius.md, backgroundColor: colors.paper },
  switchLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  switchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  switchText: { color: colors.roast, fontSize: 12, fontWeight: '800' },
  footer: { marginTop: 27, color: colors.muted, textAlign: 'center', fontSize: 7, fontWeight: '700', letterSpacing: 1.2 },
});
