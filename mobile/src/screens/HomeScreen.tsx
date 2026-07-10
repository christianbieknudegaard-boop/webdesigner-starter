import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BASE_URL, CONDITION_LABELS, Listing, fetchListings } from "../api";
import { colors } from "../theme";

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <View style={styles.card}>
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
        <Text style={styles.author}>{listing.author}</Text>
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
    </View>
  );
}

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      setError(null);
      setListings(await fetchListings(q || undefined));
    } catch {
      setError(
        "Fikk ikke kontakt med serveren. Sjekk at nettsiden kjører og at EXPO_PUBLIC_API_URL peker på riktig adresse."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Søk på tittel, forfatter eller ISBN …"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingRow listing={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(query);
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Ingen bøker matchet søket.</Text>
          }
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
    marginBottom: 12,
    color: colors.foreground,
  },
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
});
