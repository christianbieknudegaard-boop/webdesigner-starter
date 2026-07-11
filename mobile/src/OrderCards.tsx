import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ORDER_STATUS_LABELS,
  Order,
  rateOrder,
  setOrderStatus,
} from "./api";
import { colors } from "./theme";

interface Props {
  order: Order;
  role: "buyer" | "seller";
  /** Kalles etter vellykket handling så listen kan lastes på nytt. */
  onChanged: () => void;
}

export default function OrderCard({ order, role, onChanged }: Props) {
  const [busy, setBusy] = useState(false);

  const counterpart =
    role === "buyer"
      ? `Selger: ${order.listing.seller?.name ?? "ukjent"}`
      : `Kjøper: ${order.buyer?.name ?? "ukjent"}`;
  const total =
    role === "buyer" ? order.itemPrice + order.shippingPrice : order.itemPrice;

  const action =
    role === "seller" && order.status === "kjopt"
      ? { status: "sendt" as const, label: "Merk som sendt" }
      : role === "buyer" && order.status === "sendt"
        ? { status: "levert" as const, label: "Bekreft mottatt" }
        : null;

  async function runAction(status: "sendt" | "levert") {
    setBusy(true);
    try {
      await setOrderStatus(order.id, status);
      onChanged();
    } catch (e) {
      Alert.alert("Noe gikk galt", e instanceof Error ? e.message : "Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  async function rate(stars: number) {
    setBusy(true);
    try {
      await rateOrder(order.id, stars);
      onChanged();
    } catch (e) {
      Alert.alert("Noe gikk galt", e instanceof Error ? e.message : "Prøv igjen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {order.listing.title}
        </Text>
        <Text style={styles.price}>{total} kr</Text>
      </View>
      <Text style={styles.meta}>
        {order.listing.author} · {counterpart} ·{" "}
        {new Date(order.createdAt).toLocaleDateString("nb-NO")}
      </Text>

      {role === "seller" && order.shipStreet ? (
        <Text style={styles.address}>
          📦 Sendes til: {order.shipName}, {order.shipStreet},{" "}
          {order.shipPostalCode} {order.shipCity}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text
          style={[
            styles.status,
            order.status === "levert" && styles.statusDone,
          ]}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Text>
        {action && (
          <Pressable
            style={[styles.actionButton, busy && { opacity: 0.6 }]}
            onPress={() => runAction(action.status)}
            disabled={busy}
          >
            <Text style={styles.actionText}>
              {busy ? "Lagrer …" : action.label}
            </Text>
          </Pressable>
        )}
      </View>

      {role === "buyer" && order.status === "levert" && (
        order.rating != null ? (
          <Text style={styles.meta}>
            Din vurdering: {"★".repeat(order.rating)}
            {"☆".repeat(5 - order.rating)}
          </Text>
        ) : (
          <View style={styles.rateRow}>
            <Text style={styles.meta}>Vurder selgeren: </Text>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => rate(star)} disabled={busy}>
                <Text style={styles.star}>☆</Text>
              </Pressable>
            ))}
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  title: { fontWeight: "700", color: colors.foreground, flex: 1 },
  price: { fontWeight: "800", color: colors.brandDark },
  meta: { color: colors.muted, fontSize: 13 },
  address: { color: colors.foreground, fontSize: 13, marginTop: 2 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  status: {
    backgroundColor: colors.brandLight,
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusDone: { backgroundColor: colors.brand, color: "#fff" },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rateRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  star: { fontSize: 22, color: colors.accent, paddingHorizontal: 3 },
});
