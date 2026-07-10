import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  BookCondition,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  CatalogBook,
  createListing,
  lookupIsbn,
  searchCatalog,
} from "../api";
import { colors } from "../theme";

export default function SellScreen() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<BookCondition | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Boksøk
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogBook[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Tekstsøk med forslag mens man skriver
  useEffect(() => {
    const q = search.trim();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        setSuggestions(await searchCatalog(q));
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function applyBook(book: CatalogBook) {
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    if (book.category) setCategory(book.category);
    setSuggestions([]);
    setSearch("");
    setLookupMessage(`Fant «${book.title}» – detaljene er fylt inn.`);
  }

  async function handleScannedIsbn(code: string) {
    setScannerOpen(false);
    setLookupMessage("Slår opp boken …");
    const book = await lookupIsbn(code);
    if (book) {
      applyBook(book);
    } else {
      setIsbn(code);
      setLookupMessage(
        `Fant ingen bok med ISBN ${code}. Skriv tittel og forfatter selv.`
      );
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Trenger kameratilgang",
          "Gi appen tilgang til kameraet for å skanne strekkoder, eller søk med tekst i stedet."
        );
        return;
      }
    }
    setScanned(false);
    setScannerOpen(true);
  }

  async function submit() {
    if (!title || !author || !price || !condition || !category) {
      Alert.alert(
        "Mangler noe",
        "Fyll inn tittel, forfatter, pris, kategori og tilstand."
      );
      return;
    }
    setSaving(true);
    try {
      await createListing({
        title,
        author,
        isbn: isbn || undefined,
        category,
        condition,
        price: Math.round(Number(price)),
      });
      Alert.alert(
        "Annonsen er lagt ut! 🎉",
        `«${title}» av ${author} er nå til salgs for ${price} kr.`
      );
      setTitle("");
      setAuthor("");
      setIsbn("");
      setPrice("");
      setCondition(null);
      setCategory(null);
      setLookupMessage(null);
    } catch (e) {
      Alert.alert(
        "Noe gikk galt",
        e instanceof Error ? e.message : "Prøv igjen."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Strekkodeskanner */}
      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
            onBarcodeScanned={({ data }) => {
              if (scanned || !/^97[89]\d{10}$/.test(data)) return;
              setScanned(true);
              void handleScannedIsbn(data);
            }}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerHint}>
              Hold strekkoden på baksiden av boken i ruten
            </Text>
            <View style={styles.scannerFrame} />
            <Pressable
              style={styles.scannerClose}
              onPress={() => setScannerOpen(false)}
            >
              <Text style={styles.scannerCloseText}>Avbryt</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Selg en bok</Text>
        <Text style={styles.sub}>
          Gratis å legge ut – vi tar først et lite gebyr når boken er solgt.
        </Text>

        {/* Steg 1: Finn boken */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Finn boken</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Søk på tittel, forfatter eller ISBN …"
              placeholderTextColor={colors.muted}
            />
            <Pressable style={styles.scanButton} onPress={openScanner}>
              <Text style={styles.scanButtonText}>📷 Skann</Text>
            </Pressable>
          </View>

          {suggestions.map((book) => (
            <Pressable
              key={book.isbn}
              style={styles.suggestion}
              onPress={() => applyBook(book)}
            >
              <Text style={styles.suggestionTitle}>{book.title}</Text>
              <Text style={styles.suggestionMeta}>
                {book.author} · ISBN {book.isbn}
              </Text>
            </Pressable>
          ))}

          {lookupMessage && (
            <Text style={styles.lookupMessage}>{lookupMessage}</Text>
          )}
        </View>

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

        <Text style={styles.label}>ISBN (valgfritt)</Text>
        <TextInput
          style={styles.input}
          value={isbn}
          onChangeText={setIsbn}
          placeholder="F.eks. 9788202433666"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
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

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.chips}>
          {Object.keys(CATEGORY_LABELS).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  category === cat && styles.chipTextActive,
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          ))}
        </View>

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

        <Pressable
          style={[styles.submit, saving && { opacity: 0.6 }]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.submitText}>
            {saving ? "Legger ut …" : "Legg ut annonsen"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 26, fontWeight: "800", color: colors.brandDark },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "700",
    color: colors.brandDark,
    marginBottom: 10,
  },
  searchRow: { flexDirection: "row", gap: 8 },
  scanButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  scanButtonText: { color: "#fff", fontWeight: "700" },
  suggestion: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  suggestionTitle: { fontWeight: "600", color: colors.foreground },
  suggestionMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  lookupMessage: {
    marginTop: 10,
    backgroundColor: colors.brandLight,
    color: colors.brandDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
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
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scannerHint: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  scannerFrame: {
    width: "80%",
    height: 140,
    borderColor: "#fff",
    borderWidth: 3,
    borderRadius: 16,
  },
  scannerClose: {
    marginTop: 32,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  scannerCloseText: { color: colors.foreground, fontWeight: "700" },
});
