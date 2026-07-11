import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BASE_URL,
  CONDITION_LABELS,
  FORMAT_LABELS,
  Listing,
  ProductType,
  buyListing,
  fetchListings,
  startChat,
} from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";

const SHIPPING_PRICE = 45;

function ListingRow({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {listing.imageUrl ? (
        <Image
          source={{ uri: new URL(listing.imageUrl, BASE_URL).toString() }}
          style={styles.cover}
          alt={`${listing.title} av ${listing.author}`}
        />
      ) : (
        <View style={[styles.cover, { backgroundColor: listing.coverColor }]}>
          <Text style={styles.coverTitle} numberOfLines={3}>
            {listing.title}
          </Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.author}>
          {listing.author}
          {listing.format ? ` · ${FORMAT_LABELS[listing.format]}` : ""}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{listing.price} kr</Text>
          <Text style={styles.condition}>
            {CONDITION_LABELS[listing.condition]}
          </Text>
        </View>
        <Text style={styles.seller}>
          {listing.seller.name} · {listing.seller.city} · ⭐{" "}
          {listing.seller.rating.toFixed(1)}
        </Text>
      </View>
    </Pressable>
  );
}

function ListingDetail({
  listing,
  onClose,
  onBought,
}: {
  listing: Listing;
  onClose: () => void;
  onBought: () => void;
}) {
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    street: "",
    postalCode: "",
    city: "",
  });
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const isOwn = user?.id === listing.seller.id;
  const addressComplete = Object.values(address).every((v) => v.trim());

  function setAddressField(key: keyof typeof address, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  async function ask() {
    if (!user) {
      Alert.alert(
        "Logg inn først",
        "Gå til «Min side»-fanen for å logge inn eller opprette konto."
      );
      return;
    }
    const body = question.trim();
    if (!body) return;
    setAsking(true);
    try {
      await startChat(listing.id, body);
      setQuestion("");
      Alert.alert(
        "Melding sendt! 💬",
        "Du finner samtalen under Meldinger-fanen."
      );
    } catch (e) {
      Alert.alert(
        "Meldingen ble ikke sendt",
        e instanceof Error ? e.message : "Prøv igjen."
      );
    } finally {
      setAsking(false);
    }
  }

  async function buy() {
    if (!user) {
      Alert.alert(
        "Logg inn først",
        "Gå til «Min side»-fanen for å logge inn eller opprette konto."
      );
      return;
    }
    if (!showAddress) {
      setShowAddress(true);
      return;
    }
    setBuying(true);
    try {
      await buyListing(listing.id, address);
      Alert.alert(
        "Boken er din! 🎉",
        "Selgeren får beskjed og sender boken. Betaling kommer i neste versjon."
      );
      onBought();
    } catch (e) {
      Alert.alert(
        "Kjøpet feilet",
        e instanceof Error ? e.message : "Prøv igjen."
      );
    } finally {
      setBuying(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.detail}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Pressable onPress={onClose}>
          <Text style={styles.detailClose}>‹ Tilbake</Text>
        </Pressable>

        {listing.imageUrl ? (
          <Image
            source={{ uri: new URL(listing.imageUrl, BASE_URL).toString() }}
            style={styles.detailCover}
            alt={`${listing.title} av ${listing.author}`}
          />
        ) : (
          <View
            style={[styles.detailCover, { backgroundColor: listing.coverColor }]}
          >
            <Text style={styles.detailCoverTitle}>{listing.title}</Text>
          </View>
        )}

        <Text style={styles.detailTitle}>{listing.title}</Text>
        <Text style={styles.detailAuthor}>{listing.author}</Text>
        <Text style={styles.condition}>
          {CONDITION_LABELS[listing.condition]}
        </Text>

        {listing.description ? (
          <Text style={styles.detailDescription}>{listing.description}</Text>
        ) : null}

        <Text style={styles.seller}>
          Selges av {listing.seller.name} ({listing.seller.city}) ·{" "}
          {listing.seller.salesCount > 0
            ? `⭐ ${listing.seller.rating.toFixed(1)} · ${listing.seller.salesCount} salg`
            : "Ny selger"}
        </Text>

        <View style={styles.priceBox}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Varen</Text>
            <Text style={styles.priceValue}>{listing.price} kr</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frakt med sporing</Text>
            <Text style={styles.priceValue}>{SHIPPING_PRICE} kr</Text>
          </View>
          <View style={[styles.priceRow, styles.priceTotalRow]}>
            <Text style={styles.priceTotal}>Totalt</Text>
            <Text style={styles.priceTotal}>
              {listing.price + SHIPPING_PRICE} kr
            </Text>
          </View>
        </View>

        {isOwn ? (
          <Text style={styles.ownNotice}>Dette er din egen annonse.</Text>
        ) : (
          <>
            {showAddress && (
              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>Leveringsadresse</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Fullt navn"
                  placeholderTextColor={colors.muted}
                  value={address.name}
                  onChangeText={(v) => setAddressField("name", v)}
                />
                <TextInput
                  style={styles.addressInput}
                  placeholder="Gateadresse"
                  placeholderTextColor={colors.muted}
                  value={address.street}
                  onChangeText={(v) => setAddressField("street", v)}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[styles.addressInput, { width: 100 }]}
                    placeholder="Postnr."
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={4}
                    value={address.postalCode}
                    onChangeText={(v) => setAddressField("postalCode", v)}
                  />
                  <TextInput
                    style={[styles.addressInput, { flex: 1 }]}
                    placeholder="Sted"
                    placeholderTextColor={colors.muted}
                    value={address.city}
                    onChangeText={(v) => setAddressField("city", v)}
                  />
                </View>
              </View>
            )}
            <Pressable
              style={[
                styles.buyButton,
                (buying || (showAddress && !addressComplete)) && {
                  opacity: 0.6,
                },
              ]}
              onPress={buy}
              disabled={buying || (showAddress && !addressComplete)}
            >
              <Text style={styles.buyButtonText}>
                {buying
                  ? "Kjøper …"
                  : showAddress
                    ? "Bekreft kjøp"
                    : "Kjøp nå"}
              </Text>
            </Pressable>

            <View style={styles.askBox}>
              <TextInput
                style={styles.askInput}
                placeholder="Spør selgeren om noe …"
                placeholderTextColor={colors.muted}
                value={question}
                onChangeText={setQuestion}
              />
              <Pressable
                style={[
                  styles.askButton,
                  (asking || !question.trim()) && { opacity: 0.5 },
                ]}
                onPress={ask}
                disabled={asking || !question.trim()}
              >
                <Text style={styles.askButtonText}>💬</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ProductType | undefined>(undefined);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (q: string, t: ProductType | undefined) => {
      try {
        setError(null);
        setListings(await fetchListings(q || undefined, t));
      } catch {
        setError(
          "Fikk ikke kontakt med serveren. Sjekk at nettsiden kjører og at EXPO_PUBLIC_API_URL peker på riktig adresse."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => load(query, type), 300);
    return () => clearTimeout(timer);
  }, [query, type, load]);

  const TYPE_CHIPS: { value: ProductType | undefined; label: string }[] = [
    { value: undefined, label: "Alt" },
    { value: "bok", label: "📚 Bøker" },
    { value: "film", label: "🎬 Film" },
    { value: "musikk", label: "🎵 Musikk" },
  ];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Søk på tittel eller strekkode …"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.typeRow}>
        {TYPE_CHIPS.map((chip) => (
          <Pressable
            key={chip.label}
            onPress={() => setType(chip.value)}
            style={[styles.typeChip, type === chip.value && styles.typeChipActive]}
          >
            <Text
              style={[
                styles.typeChipText,
                type === chip.value && styles.typeChipTextActive,
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingRow listing={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(query, type);
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Ingen bøker matchet søket.</Text>
          }
        />
      )}
      {selected && (
        <ListingDetail
          listing={selected}
          onClose={() => setSelected(null)}
          onBought={() => {
            setSelected(null);
            load(query, type);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 8,
    color: colors.foreground,
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeChip: {
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typeChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeChipText: { color: colors.foreground, fontSize: 13, fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  cover: {
    width: 72,
    height: 108,
    borderRadius: 8,
    padding: 8,
    justifyContent: "flex-start",
  },
  coverTitle: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  author: { color: colors.muted, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: { fontSize: 17, fontWeight: "800", color: colors.brandDark },
  condition: {
    backgroundColor: colors.brandLight,
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  seller: { color: colors.muted, fontSize: 12, marginTop: 6 },
  error: {
    marginTop: 40,
    textAlign: "center",
    color: colors.accent,
    paddingHorizontal: 16,
  },
  empty: { marginTop: 40, textAlign: "center", color: colors.muted },
  detail: { flex: 1, backgroundColor: colors.background },
  detailClose: {
    color: colors.brand,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 14,
  },
  detailCover: {
    width: 160,
    height: 240,
    borderRadius: 12,
    alignSelf: "center",
    padding: 12,
  },
  detailCoverTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  detailTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.brandDark,
    marginTop: 16,
  },
  detailAuthor: { color: colors.muted, fontSize: 16, marginTop: 2 },
  detailDescription: {
    color: colors.foreground,
    marginTop: 12,
    lineHeight: 21,
  },
  priceBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 6,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { color: colors.muted },
  priceValue: { color: colors.foreground },
  priceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  priceTotal: { fontWeight: "800", color: colors.brandDark },
  ownNotice: {
    marginTop: 16,
    textAlign: "center",
    color: colors.muted,
    fontWeight: "600",
  },
  buyButton: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  buyButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  addressBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  addressLabel: { fontWeight: "700", color: colors.brandDark },
  addressInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.foreground,
  },
  askBox: { flexDirection: "row", gap: 8, marginTop: 12 },
  askInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.foreground,
  },
  askButton: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  askButtonText: { fontSize: 18 },
});
