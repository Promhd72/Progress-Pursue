import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Button, ChoiceCard, IconBadge, Muted, Txt } from "@/components/ui";
import { DEMO_MODE, submitFeedback } from "@/lib/backend";
import type { FeedbackKind } from "@/lib/rapid-math.functions";
import { colors, fonts, radius } from "@/theme";

const KINDS: { id: FeedbackKind; emoji: string; title: string; subtitle: string; placeholder: string }[] = [
  { id: "feature", emoji: "✨", title: "Request a feature", subtitle: "Something you wish the app did", placeholder: "I'd love it if Rapid Math could…" },
  { id: "problem", emoji: "🐞", title: "Report a problem", subtitle: "Something broken or confusing", placeholder: "What happened, and what did you expect?" },
  { id: "idea", emoji: "💡", title: "Share an idea", subtitle: "A technique, a scenario, anything", placeholder: "Here's an idea…" },
  { id: "other", emoji: "💬", title: "Something else", subtitle: "Praise, questions, anything", placeholder: "Tell us anything…" },
];

/** Send feedback or a feature request to the team. */
export default function Feedback() {
  const router = useRouter();
  const [kind, setKind] = useState<FeedbackKind>("feature");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const k = KINDS.find((x) => x.id === kind)!;

  async function send() {
    setSending(true);
    try {
      await submitFeedback({
        data: { kind, message, appVersion: Constants.expoConfig?.version ?? "", platform: Platform.OS },
      });
      setSent(true);
    } catch (err) {
      Alert.alert("Couldn't send", err instanceof Error ? err.message : "Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <IconBadge name="heart-outline" color={colors.success} bg={colors.successSoft} size={64} />
        <Txt variant="title" center style={{ marginTop: 18 }}>Thank you!</Txt>
        <Muted center style={{ marginTop: 8 }}>
          {DEMO_MODE
            ? "Demo mode: your message is saved on this phone. Once the app is connected to its server, messages go straight to the team."
            : "Your message went straight to the team. We read every one, and it shapes what we build next."}
        </Muted>
        <Button title="Done" onPress={() => router.back()} style={{ marginTop: 28, alignSelf: "stretch" }} />
        <Button
          title="Send another"
          variant="ghost"
          onPress={() => {
            setMessage("");
            setSent(false);
          }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Txt variant="title">Help us build Rapid Math</Txt>
          <Muted style={{ marginTop: 6 }}>
            Tell the team what you'd like next, or what's not working. Every message is read.
          </Muted>
        </View>
        <View style={{ gap: 10 }}>
          {KINDS.map((x) => (
            <ChoiceCard key={x.id} selected={kind === x.id} onPress={() => setKind(x.id)} emoji={x.emoji} title={x.title} subtitle={x.subtitle} />
          ))}
        </View>
        <View style={{ gap: 6 }}>
          <Txt variant="label">Your message</Txt>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={k.placeholder}
            placeholderTextColor="#9aa5b1"
            multiline
            maxLength={2000}
            textAlignVertical="top"
            style={styles.input}
          />
          <Muted variant="caption" style={{ alignSelf: "flex-end", fontSize: 12 }}>{message.length}/2000</Muted>
        </View>
        <Button title="Send to the team" icon="paper-plane-outline" disabled={!message.trim()} loading={sending} onPress={send} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.background },
  input: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.foreground,
  },
});
