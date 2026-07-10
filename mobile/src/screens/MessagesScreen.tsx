import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ConversationDetail,
  ConversationSummary,
  fetchConversation,
  fetchConversations,
  sendChatMessage,
} from "../api";
import { useAuth } from "../AuthContext";
import { colors } from "../theme";

function Thread({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await fetchConversation(conversationId));
    } catch {
      Alert.alert("Feil", "Fikk ikke hentet samtalen.");
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await sendChatMessage(conversationId, body);
      setDraft("");
      await load();
    } catch (e) {
      Alert.alert(
        "Meldingen ble ikke sendt",
        e instanceof Error ? e.message : "Prøv igjen."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.threadContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.threadHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.threadBack}>‹ Tilbake</Text>
          </Pressable>
          {detail && (
            <Text style={styles.threadTitle} numberOfLines={1}>
              {detail.counterpartName} · «{detail.listingTitle}»
            </Text>
          )}
        </View>

        {!detail ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 10 }}
          >
            {detail.messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={m.mine ? styles.bubbleTextMine : styles.bubbleText}>
                  {m.body}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    m.mine && { color: "rgba(255,255,255,0.7)" },
                  ]}
                >
                  {new Date(m.createdAt).toLocaleString("nb-NO", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Skriv en melding …"
            placeholderTextColor={colors.muted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable
            style={[styles.sendButton, (sending || !draft.trim()) && { opacity: 0.5 }]}
            onPress={send}
            disabled={sending || !draft.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setConversations(await fetchConversations());
    } catch {
      // Vis forrige liste ved nettverksglipp.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, openId]);

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 40 }}>💬</Text>
        <Text style={styles.heading}>Logg inn for å se meldinger</Text>
        <Text style={styles.sub}>
          Gå til «Min side»-fanen og logg inn eller opprett en konto.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Ingen samtaler ennå. Finn en bok på Hjem-fanen og spør selgeren!
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => setOpenId(item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>
                  {item.counterpartName}
                  <Text style={styles.rowListing}>
                    {" "}
                    om «{item.listingTitle}»
                  </Text>
                </Text>
                <Text style={styles.rowLast} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
      {openId && <Thread conversationId={openId} onClose={() => setOpenId(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  heading: { fontSize: 22, fontWeight: "800", color: colors.brandDark },
  sub: { color: colors.muted, textAlign: "center" },
  empty: { marginTop: 40, textAlign: "center", color: colors.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowName: { fontWeight: "700", color: colors.foreground },
  rowListing: { fontWeight: "400", color: colors.muted },
  rowLast: { color: colors.muted, marginTop: 3, fontSize: 13 },
  unread: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  threadContainer: { flex: 1, backgroundColor: colors.background },
  threadHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  threadBack: { color: colors.brand, fontWeight: "700", fontSize: 16 },
  threadTitle: { fontWeight: "700", color: colors.brandDark },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandLight,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.brandDark },
  bubbleTextMine: { color: "#fff" },
  bubbleTime: { fontSize: 11, color: colors.muted, marginTop: 4 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: colors.foreground,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "700" },
});
