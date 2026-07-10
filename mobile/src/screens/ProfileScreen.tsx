import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const STATS = [
  { label: "Vurdering", value: "⭐ 4,9" },
  { label: "Fullførte salg", value: "128" },
  { label: "Aktive annonser", value: "3" },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>I</Text>
        </View>
        <View>
          <Text style={styles.name}>Ingrid H.</Text>
          <Text style={styles.meta}>Oslo · medlem siden 2023</Text>
        </View>
      </View>

      <View style={styles.stats}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          🔒 Dette er en demoprofil. Innlogging med Vipps/e-post, meldinger og
          utbetalinger kommer i neste versjon.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.brandDark },
  meta: { color: colors.muted, marginTop: 2 },
  stats: { flexDirection: "row", gap: 10, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: { color: colors.muted, fontSize: 12 },
  statValue: {
    color: colors.brandDark,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  notice: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  noticeText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
