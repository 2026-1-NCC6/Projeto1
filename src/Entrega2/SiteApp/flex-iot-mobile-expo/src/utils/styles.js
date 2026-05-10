import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0d0f14',
  surface: '#161a23',
  border: '#252a38',
  text: '#e8eaf0',
  muted: '#8b91a8',
  green: '#00e5a0',
  yellow: '#f5c542',
  red: '#ff4757',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  text: { color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  input: { backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: colors.green, padding: 13, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.green, padding: 13, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDanger: { backgroundColor: colors.red, padding: 13, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#06110d', fontWeight: '700' },
  buttonSecondaryText: { color: colors.green, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardDanger: { borderColor: colors.red },
  cardTitle: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  cardValue: { color: colors.text, fontSize: 24, fontWeight: '700' },
  dangerText: { color: colors.red },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: '700' },
  smallButton: { borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  smallButtonActive: { borderColor: colors.green, backgroundColor: 'rgba(0,229,160,0.08)' },
});
