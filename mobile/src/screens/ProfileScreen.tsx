import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { login, logout, register } from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const profile =
        mode === "login"
          ? await login(email, password)
          : await register(name, city, email, password);
      setUser(profile);
      setPassword("");
    } catch (e) {
      Alert.alert(
        "Innlogging feilet",
        e instanceof Error ? e.message : "Prøv igjen."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>
              {user.city} · medlem siden{" "}
              {new Date(user.memberSince).getFullYear()}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Vurdering</Text>
            <Text style={styles.statValue}>
              {user.salesCount > 0 ? `⭐ ${user.rating.toFixed(1)}` : "–"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fullførte salg</Text>
            <Text style={styles.statValue}>{user.salesCount}</Text>
          </View>
        </View>

        <Pressable style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logg ut</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          {mode === "login" ? "Logg inn" : "Opprett konto"}
        </Text>
        <Text style={styles.meta}>
          {mode === "login"
            ? "Logg inn for å legge ut bøker og følge salgene dine."
            : "Gratis og gjort på under ett minutt."}
        </Text>

        {mode === "register" && (
          <>
            <Text style={styles.label}>Navn</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Fornavn og etternavn"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Sted</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="F.eks. Oslo"
              placeholderTextColor={colors.muted}
            />
          </>
        )}

        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="deg@eksempel.no"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Passord</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={mode === "register" ? "Minst 8 tegn" : "Ditt passord"}
          placeholderTextColor={colors.muted}
          secureTextEntry
        />

        <Pressable
          style={[styles.submit, busy && { opacity: 0.6 }]}
          onPress={submit}
          disabled={busy}
        >
          <Text style={styles.submitText}>
            {busy
              ? "Vent litt …"
              : mode === "login"
                ? "Logg inn"
                : "Opprett konto"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.switchMode}>
            {mode === "login"
              ? "Ny på Bokfink? Opprett konto"
              : "Har du konto fra før? Logg inn"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 26, fontWeight: "800", color: colors.brandDark },
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
  label: {
    fontWeight: "600",
    color: colors.foreground,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.foreground,
  },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchMode: {
    color: colors.brand,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  logout: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 28,
  },
  logoutText: { color: colors.muted, fontWeight: "700" },
});
