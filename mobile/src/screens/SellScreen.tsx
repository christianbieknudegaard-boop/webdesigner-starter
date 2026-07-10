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
import { BookCondition, CONDITION_LABELS } from "../api";
import { colors } from "../theme";

export default function SellScreen() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<BookCondition | null>(null);

  function submit() {
    if (!title || !author || !price || !condition) {
      Alert.alert("Mangler noe", "Fyll inn tittel, forfatter, pris og tilstand.");
      return;
    }
    // Prototype: annonsen lagres ikke ennå – POST /api/listings kommer.
    Alert.alert(
      "Annonsen er klar! 🎉",
      `«${title}» av ${author} legges ut for ${price} kr. Lagring kommer i neste versjon.`
    );
    setTitle("");
    setAuthor("");
    setPrice("");
    setCondition(null);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.heading}>Selg en bok</Text>
        <Text style={styles.sub}>
          Gratis å legge ut – vi tar først et lite gebyr når boken er solgt.
        </Text>

        <Text style={styles.label}>Tittel</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Boktittel"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Forfatter</Text>
        <TextInput
          style={styles.input}
          value={author}
          onChangeText={setAuthor}
          placeholder="Forfatterens navn"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Pris (kr)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="F.eks. 99"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Tilstand</Text>
        <View style={styles.chips}>
          {(Object.keys(CONDITION_LABELS) as BookCondition[]).map((c) => (
            <Pressable
              key={c}
              onPress={() => setCondition(c)}
              style={[styles.chip, condition === c && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  condition === c && styles.chipTextActive,
                ]}
              >
                {CONDITION_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.submit} onPress={submit}>
          <Text style={styles.submitText}>Legg ut annonsen</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 26, fontWeight: "800", color: colors.brandDark },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 12 },
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.foreground, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  submit: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
