import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { BadgeIcon, useBadges } from "@/components/Badges";
import { LanguageList } from "@/components/LanguagePicker";
import { ConfidenceResult } from "@/components/Confidence";
import { getConfidence } from "@/lib/confidence";
import { Card, ErrorState, Gradient, Ionicons, Loading, Muted, Row, SectionLabel, Txt, type IconName } from "@/components/ui";
import { BADGES } from "@/lib/badges";
import { deleteAccount, signOut, updateProfile } from "@/lib/account";
import { MAX_LEVEL, TRACK_LABELS, TRACKS } from "@/lib/curriculum";
import { rankForXp } from "@/lib/drill-engine";
import { getReminderPrefs, keyHaptic, trainedTodayFrom, updateReminderPrefs, type ReminderPrefs } from "@/lib/native";
import { DAILY_TARGETS, getOnboarding, saveOnboarding, type DailyTargetId } from "@/lib/onboarding";
import { resolveIsPro } from "@/lib/plan";
import { SUPPORT_EMAIL } from "@/lib/legal";
import { MANAGE_URL, restore } from "@/lib/purchases";
import { useOverview, useProfile } from "@/lib/queries";
import { colors, fonts, radius } from "@/theme";
import { alertT, auto, tr } from "@/lib/i18n";

const pad = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

const TIMES = [8, 13, 18, 20, 22];

export default function Profile() {
  const router = useRouter();
  const qc = useQueryClient();
  const profileQ = useProfile();
  const overviewQ = useOverview();
  const badges = useBadges();
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
      alertT("Couldn't save your name", err instanceof Error ? err.message : "Try again.");
    }
  }

  async function applyReminder(next: ReminderPrefs) {
    setBusy(true);
    const saved = await updateReminderPrefs(next, trainedToday);
    setReminder(saved);
    setBusy(false);
    if (next.enabled && !saved.enabled) {
      alertT("Notifications are off", "Turn on notifications for Rapid Math in iPhone Settings to get reminders.");
    }
  }

  async function restorePurchases() {
    if (busy) return;
    setBusy(true);
    try {
      const active = await restore();
      await qc.invalidateQueries();
      alertT(
        active ? "Pro restored" : "Nothing to restore",
        active ? "Welcome back. Everything is unlocked." : "We couldn't find an active Rapid Math Pro subscription for this Apple Account.",
      );
    } catch (err) {
      alertT("Couldn't restore", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    alertT(
      "Delete your account?",
      "All your Rapid Math data (progress, streaks, history) will be permanently removed. This can't be undone." +
        (isPro && p.pro_source === "store"
          ? "\n\nThis doesn't cancel your subscription. Cancel it in iPhone Settings > your name > Subscriptions."
          : ""),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              alertT("Couldn't delete your account", err instanceof Error ? err.message : "Try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Gradient style={styles.header}>
        <Row gap={14}>
          <View style={styles.avatar}>
            <Txt style={{ fontFamily: fonts.displayBold, fontSize: 26 }} color={colors.primary}>
              {(p.name || p.email || "?").slice(0, 1).toUpperCase()}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" color={colors.white} numberOfLines={1} style={{ fontSize: 21, lineHeight: 26 }}>
              {p.name || "Your profile"}
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.92)" numberOfLines={1}>{p.email}</Txt>
          </View>
          <View style={[styles.plan, isPro && { backgroundColor: colors.gold }]}>
            {isPro ? <Ionicons name="diamond" size={12} color={colors.ink} /> : null}
            <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }} color={isPro ? colors.ink : colors.white}>
              {isPro ? "PRO" : "FREE"}
            </Txt>
          </View>
        </Row>
        <Row gap={8} style={{ marginTop: 18 }}>
          <Mini label="Rank" value={rank.name} />
          <Mini label="Total XP" value={p.xp.toLocaleString()} />
          <Mini label="Best streak" value={`${p.longest_streak}d`} />
        </Row>
      </Gradient>

      <Section title="Badges">
        <Pressable onPress={() => router.push("/badges")} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt variant="label">
                {badges.earned.size} of {BADGES.length} earned
              </Txt>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </Row>
            <Row gap={8}>
              {(badges.earned.size > 0 ? BADGES.filter((b) => badges.earned.has(b.id)).slice(-5) : BADGES.slice(0, 5)).map((b) => (
                <BadgeIcon key={b.id} badge={b} earned={badges.earned.has(b.id)} size={48} />
              ))}
            </Row>
          </Card>
        </Pressable>
      </Section>

      {getConfidence().before ? (
        <Section title="Your progress">
          <ConfidenceResult />
        </Section>
      ) : null}

      <Section title="Rapid Math Pro">
        <Card style={{ padding: 0 }}>
          {isPro ? (
            <>
              <View style={styles.rowItem}>
                <Ionicons name="diamond" size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Txt variant="label" style={{ flex: 1 }}>You're Pro</Txt>
                <Muted variant="caption">Everything unlocked</Muted>
              </View>
              {p.pro_source === "store" ? (
                <>
                  <Divider />
                  <LinkRow icon="card-outline" label="Manage subscription" onPress={() => void Linking.openURL(MANAGE_URL)} />
                </>
              ) : null}
            </>
          ) : (
            <>
              <LinkRow icon="diamond-outline" label="Upgrade to Pro" onPress={() => router.push("/pro")} />
              <Divider />
              <LinkRow icon="refresh-outline" label="Restore purchases" onPress={() => void restorePurchases()} />
            </>
          )}
        </Card>
      </Section>

      <Section title="Account">
        <Card style={{ padding: 0 }}>
          <View style={styles.rowItem}>
            <Txt variant="label" style={{ width: 70 }}>Name</Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              onEndEditing={saveName}
              returnKeyType="done"
              placeholder={tr("Your name")}
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
                <Chip key={h} label={pad(h)} selected={reminder.hour === h} onPress={() => applyReminder({ ...reminder, hour: h, minute: 0 })} />
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
                accessibilityRole="radio"
                accessibilityState={{ selected: target === t.id }}
                style={[styles.segment, target === t.id && styles.segmentOn]}
              >
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }}>{t.minutes} min</Txt>
                <Muted variant="caption" style={{ fontSize: 12 }}>{t.label}</Muted>
              </Pressable>
            ))}
          </Row>
        </Card>
      </Section>

      <Section title="Language">
        <Card style={{ padding: 0 }}>
          <LanguageList />
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
          <LinkRow icon="compass-outline" label="How Rapid Math works" onPress={() => router.push("/tour")} />
          <Divider />
          <LinkRow icon="flask-outline" label="The research behind it" onPress={() => router.push("/science")} />
          <Divider />
          <LinkRow icon="sparkles-outline" label="Request a feature" onPress={() => router.push("/feedback")} />
          <Divider />
          <LinkRow icon="chatbubble-ellipses-outline" label="Send feedback or report a problem" onPress={() => router.push("/feedback")} />
        </Card>
      </Section>

      <Section title="Legal and support">
        <Card style={{ padding: 0 }}>
          <LinkRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push("/legal/privacy")} />
          <Divider />
          <LinkRow icon="document-text-outline" label="Terms of Use" onPress={() => router.push("/legal/terms")} />
          <Divider />
          <LinkRow
            icon="mail-outline"
            label="Contact support"
            onPress={() =>
              SUPPORT_EMAIL
                ? void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Rapid%20Math%20support`).catch(() => router.push("/feedback"))
                : router.push("/feedback")
            }
          />
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
      {title ? <SectionLabel style={{ marginLeft: 4 }}>{title}</SectionLabel> : null}
      {children}
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: radius.md, paddingVertical: 12, alignItems: "center" }}>
      <Txt numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.displayBold, fontSize: 20 }} color={colors.white}>{value}</Txt>
      <Txt variant="caption" color="rgba(255,255,255,0.92)" style={{ fontSize: 12 }}>{label}</Txt>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      hitSlop={6}
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={auto(label)}
      style={({ pressed }) => [styles.rowItem, pressed && { backgroundColor: colors.muted }]}
    >
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
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { borderRadius: radius.xl, padding: 18 },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
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
