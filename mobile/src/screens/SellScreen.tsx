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
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import {
  BookCondition,
  CATEGORIES_BY_TYPE,
  CONDITION_LABELS,
  CatalogBook,
  FILM_FORMAT_LABELS,
  FilmFormat,
  ProductType,
  createListing,
  lookupIsbn,
  searchCatalog,
  uploadImage,
} from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";

export default function SellScreen() {
  const { user } = useAuth();
  const [productType, setProductType] = useState<ProductType>("bok");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<BookCondition | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [format, setFormat] = useState<FilmFormat | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
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
    setProductType(book.productType ?? "bok");
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    if (book.category) setCategory(book.category);
    if ((book.productType ?? "bok") === "bok") setFormat(null);
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

  async function pickImage(fromCamera: boolean) {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.7,
        });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!title || !author || !price || !condition || !category) {
      Alert.alert(
        "Mangler noe",
        productType === "film"
          ? "Fyll inn tittel, regissør, pris, kategori og tilstand."
          : "Fyll inn tittel, forfatter, pris, kategori og tilstand."
      );
      return;
    }
    if (productType === "film" && !format) {
      Alert.alert("Mangler format", "Velg DVD, Blu-ray eller 4K.");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = imageUri ? await uploadImage(imageUri) : undefined;
      await createListing({
        productType,
        title,
        author,
        isbn: isbn || undefined,
        category,
        condition,
        format: productType === "film" ? (format ?? undefined) : undefined,
        price: Math.round(Number(price)),
        imageUrl,
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
      setFormat(null);
      setImageUri(null);
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

  if (!user) {
    return (
      <View style={[styles.container, styles.loginPrompt]}>
        <Text style={{ fontSize: 40 }}>🔑</Text>
        <Text style={styles.heading}>Logg inn for å selge</Text>
        <Text style={[styles.sub, { textAlign: "center" }]}>
          Gå til «Min side»-fanen og logg inn eller opprett en konto – så kan
          du legge ut bøker herfra.
        </Text>
      </View>
    );
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
        <Text style={styles.heading}>
          {productType === "film" ? "Selg en film" : "Selg en bok"}
        </Text>
        <Text style={styles.sub}>
          Gratis å legge ut – vi tar først et lite gebyr ved salg.
        </Text>

        <View style={styles.chips}>
          {(["bok", "film"] as ProductType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setProductType(t);
                setCategory((c) =>
                  c && c in CATEGORIES_BY_TYPE[t] ? c : null
                );
                if (t === "bok") setFormat(null);
              }}
              style={[styles.chip, productType === t && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  productType === t && styles.chipTextActive,
                ]}
              >
                {t === "film" ? "🎬 Film" : "📚 Bok"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Steg 1: Finn produktet */}
        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.cardTitle}>
            1. Finn {productType === "film" ? "filmen" : "boken"}
          </Text>
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

        <Text style={styles.label}>
          {productType === "film" ? "Regissør" : "Forfatter"}
        </Text>
        <TextInput
          style={styles.input}
          value={author}
          onChangeText={setAuthor}
          placeholder={
            productType === "film" ? "Regissørens navn" : "Forfatterens navn"
          }
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>
          {productType === "film"
            ? "Strekkode / EAN (valgfritt)"
            : "ISBN (valgfritt)"}
        </Text>
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
          {Object.entries(CATEGORIES_BY_TYPE[productType]).map(
            ([cat, label]) => (
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
                  {label}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {productType === "film" && (
          <>
            <Text style={styles.label}>Format</Text>
            <View style={styles.chips}>
              {(Object.keys(FILM_FORMAT_LABELS) as FilmFormat[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFormat(f)}
                  style={[styles.chip, format === f && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      format === f && styles.chipTextActive,
                    ]}
                  >
                    {FILM_FORMAT_LABELS[f]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

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

        <Text style={styles.label}>
          Bilde av {productType === "film" ? "filmen" : "boken"} (valgfritt)
        </Text>
        <View style={styles.imageRow}>
          <Pressable style={styles.imageButton} onPress={() => pickImage(true)}>
            <Text style={styles.imageButtonText}>📷 Ta bilde</Text>
          </Pressable>
          <Pressable
            style={styles.imageButton}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.imageButtonText}>🖼️ Velg fra galleri</Text>
          </Pressable>
        </View>
        {imageUri && (
          <View style={styles.imagePreviewRow}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              alt="Forhåndsvisning av bokbildet"
            />
            <Pressable onPress={() => setImageUri(null)}>
              <Text style={styles.imageRemove}>Fjern bildet</Text>
            </Pressable>
          </View>
        )}

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
  loginPrompt: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
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
  imageRow: { flexDirection: "row", gap: 8 },
  imageButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  imageButtonText: { color: colors.brand, fontWeight: "600", fontSize: 13 },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  imagePreview: {
    width: 72,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageRemove: { color: colors.accent, fontWeight: "600", fontSize: 13 },
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
