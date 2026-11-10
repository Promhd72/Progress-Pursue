import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { Card, ErrorState, Ionicons, Loading, Muted, Pill, Row, Txt, type IconName } from "@/components/ui";
import { deleteAccount, signOut, updateProfile } from "@/lib/account";
import { MAX_LEVEL, TRACK_LABELS, TRACKS } from "@/lib/curriculum";
import { rankForXp } from "@/lib/drill-engine";
import { getReminderPrefs, keyHaptic, trainedTodayFrom, updateReminderPrefs, type ReminderPrefs } from "@/lib/native";
import { DAILY_TARGETS, getOnboarding, saveOnboarding, type DailyTargetId } from "@/lib/onboarding";
import { resolveIsPro } from "@/lib/plan";
import { useOverview, useProfile } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";

const TIMES = [8, 13, 18, 20, 22];

export default function Profile() {
  const router = useRouter();
  const qc = useQueryClient();
  const profileQ = useProfile();
  const overviewQ = useOverview();
  const [name, setName] = useState("");
  const [reminder, setReminder] = useState<ReminderPrefs>(() => getReminderPrefs());
  const [target, setTarget] = useState<DailyTargetId>(() => getOnboarding().dailyTarget);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profileQ.data?.name) setName(profileQ.data.name);
  }, [profileQ.data?.name]);

  if (profileQ.isLoading) return <Loading />;
  if (!profileQ.data) return <ErrorState message="Check your connection and try again." onRetry={() => profileQ.refetch()} />;
  const p = profileQ.data;
  const rank = rankForXp(p.xp);
  const isPro = resolveIsPro(p);
  const trainedToday = trainedTodayFrom(p.last_active_date);

  async function saveName() {
    const clean = name.trim();
    if (!clean || clean === p.name) return;
    try {
      await updateProfile(p.id, { name: clean });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      Alert.alert("Couldn't save your name", err instanceof Error ? err.message : "Try again.");
    }
  }

  async function applyReminder(next: ReminderPrefs) {
    setBusy(true);
    const saved = await updateReminderPrefs(next, trainedToday);
    setReminder(saved);
    setBusy(false);
    if (next.enabled && !saved.enabled) {
      Alert.alert("Notifications are off", "Turn on notifications for Rapid Math in iPhone Settings to get reminders.");
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete your account?",
      "All your Rapid Math data (progress, streaks, history) will be permanently removed. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              Alert.alert("Couldn't delete your account", err instanceof Error ? err.message : "Try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Row gap={14}>
        <View style={styles.avatar}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 26 }} color={colors.white}>
            {(p.name || p.email || "?").slice(0, 1).toUpperCase()}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading" numberOfLines={1}>{p.name || "Your profile"}</Txt>
          <Muted variant="caption" numberOfLines={1}>{p.email}</Muted>
        </View>
        <Pill label={isPro ? "Pro" : "Free"} color={isPro ? colors.primary : colors.mutedForeground} bg={isPro ? colors.primarySoft : colors.muted} />
      </Row>

      <Row gap={10}>
        <Mini label="Rank" value={rank.name} />
        <Mini label="Total XP" value={p.xp.toLocaleString()} />
        <Mini label="Best streak" value={`${p.longest_streak}d`} />
      </Row>

      <Section title="Account">
        <Card style={{ padding: 0 }}>
          <View style={styles.rowItem}>
            <Txt variant="label" style={{ width: 70 }}>Name</Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={saveName}
              returnKeyType="done"
              placeholder="Your name"
              style={styles.inlineInput}
            />
          </View>
          <Divider />
          <View style={styles.rowItem}>
            <Txt variant="label" style={{ width: 70 }}>Email</Txt>
            <Muted style={{ flex: 1, textAlign: "right" }} numberOfLines={1}>{p.email}</Muted>
          </View>
        </Card>
      </Section>

      <Section title="Daily habit">
        <Card style={{ gap: 16 }}>
          <Row gap={12}>
            <Ionicons name="notifications-outline" size={22} color={colors.warm} />
            <View style={{ flex: 1 }}>
              <Txt variant="label">Daily reminder</Txt>
              <Muted variant="caption">Skipped on days you've trained</Muted>
            </View>
            <Switch
              value={reminder.enabled}
              disabled={busy}
              trackColor={{ true: colors.primary, false: colors.border }}
              onValueChange={(enabled) => {
                keyHaptic();
                void applyReminder({ ...reminder, enabled });
              }}
            />
          </Row>
          {reminder.enabled && (
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {TIMES.map((h) => (
                <Chip key={h} label={`${h}:00`} selected={reminder.hour === h} onPress={() => applyReminder({ ...reminder, hour: h, minute: 0 })} />
              ))}
            </Row>
          )}
          <Divider />
          <Txt variant="label">Daily goal</Txt>
          <Row gap={8}>
            {DAILY_TARGETS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  keyHaptic();
                  setTarget(t.id);
                  saveOnboarding({ dailyTarget: t.id });
                  void qc.invalidateQueries({ queryKey: ["curriculum"] });
                }}
                style={[styles.segment, target === t.id && styles.segmentOn]}
              >
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }}>{t.minutes} min</Txt>
                <Muted variant="caption" style={{ fontSize: 12 }}>{t.label}</Muted>
              </Pressable>
            ))}
          </Row>
        </Card>
      </Section>

      <Section title="Curriculum">
        <Card style={{ padding: 0 }}>
          {TRACKS.map((t, i) => {
            const row = overviewQ.data?.tracks.find((r) => r.track === t);
            return (
              <View key={t}>
                {i > 0 && <Divider />}
                <View style={styles.rowItem}>
                  <Txt variant="label" style={{ flex: 1 }}>{TRACK_LABELS[t]}</Txt>
                  <Muted variant="caption">
                    L{row?.current_level ?? 1} · {row?.highest_level_passed ?? 0}/{MAX_LEVEL} passed
                  </Muted>
                </View>
              </View>
            );
          })}
          <Divider />
          <LinkRow icon="map-outline" label="See the full curriculum" onPress={() => router.push("/curriculum")} />
          <Divider />
          <LinkRow icon="refresh-outline" label="Retake placement test" onPress={() => router.push("/placement")} />
        </Card>
      </Section>

      <Section title="Help us improve">
        <Card style={{ padding: 0 }}>
          <LinkRow icon="sparkles-outline" label="Request a feature" onPress={() => router.push("/feedback")} />
          <Divider />
          <LinkRow icon="chatbubble-ellipses-outline" label="Send feedback or report a problem" onPress={() => router.push("/feedback")} />
        </Card>
      </Section>

      <Section title="">
        <Card style={{ padding: 0 }}>
          <LinkRow icon="log-out-outline" label="Sign out" onPress={() => void signOut()} />
          <Divider />
          <LinkRow icon="trash-outline" label="Delete account" destructive onPress={confirmDelete} />
        </Card>
      </Section>

      <Muted variant="caption" center>
        Rapid Math {Constants.expoConfig?.version ?? ""}
      </Muted>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 0.6, marginLeft: 4 }}>
          {title.toUpperCase()}
        </Muted>
      ) : null}
      {children}
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" }}>
      <Txt style={{ fontFamily: fonts.displayBold, fontSize: 22 }}>{value}</Txt>
      <Muted variant="caption" style={{ fontSize: 12 }}>{label}</Muted>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        keyHaptic();
        onPress();
      }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.primary : colors.muted,
      }}
    >
      <Txt variant="caption" color={selected ? colors.white : colors.mutedForeground} style={{ fontFamily: fonts.semibold }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function LinkRow({ icon, label, onPress, destructive }: { icon: IconName; label: string; onPress: () => void; destructive?: boolean }) {
  const color = destructive ? colors.destructive : colors.foreground;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.rowItem, pressed && { backgroundColor: colors.muted }]}>
      <Ionicons name={icon} size={20} color={destructive ? colors.destructive : colors.mutedForeground} />
      <Txt variant="label" color={color} style={{ flex: 1, marginLeft: 12 }}>{label}</Txt>
      {!destructive && <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />}
    </Pressable>
  );
}

const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 16 }} />;

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, minHeight: 52, paddingVertical: 10 },
  inlineInput: { flex: 1, textAlign: "right", fontSize: 16, fontFamily: fonts.regular, color: colors.foreground, paddingVertical: 4 },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  segmentOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
