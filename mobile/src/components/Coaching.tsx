import { useState } from "react";
import { Pressable, View } from "react-native";
import { Card, Ionicons, Muted, Row, Txt } from "@/components/ui";
import { coachingTip } from "@/lib/coaching";
import type { SkillTrack } from "@/lib/curriculum";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

const STORAGE_KEY = "rapidmath.coaching";

/**
 * Tips preference, remembered on the device. Off = tips only after mistakes
 * (the default); on = a tip after every question.
 */
export function useCoachingPreference() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  });
  function toggle() {
    setEnabled((cur) => {
      try {
        localStorage.setItem(STORAGE_KEY, cur ? "off" : "on");
      } catch {
        // Ignore.
      }
      return !cur;
    });
  }
  return { enabled, toggle };
}

export function CoachingToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel={enabled ? "Tips after every question" : "Tips after mistakes only"}
      onPress={() => {
        keyHaptic();
        onToggle();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderColor: enabled ? colors.primary : colors.border,
        backgroundColor: enabled ? colors.primarySoft : colors.card,
      }}
    >
      <Ionicons name="school-outline" size={15} color={enabled ? colors.primary : colors.mutedForeground} />
      <Txt variant="caption" color={enabled ? colors.primary : colors.mutedForeground}>
        Tips: {enabled ? "every question" : "mistakes"}
      </Txt>
    </Pressable>
  );
}

/** Full step-by-step coaching for one question. */
export function TipCard({
  track,
  ops,
  prompt,
  answer,
}: {
  track: SkillTrack | undefined;
  ops: number[] | undefined;
  prompt?: string;
  answer?: number;
}) {
  const tip = track ? coachingTip(track, ops) : null;
  if (!tip) return null;
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, padding: 16, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Row gap={6}>
          <Ionicons name="bulb" size={16} color={colors.primary} />
          <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, letterSpacing: 0.5 }}>
            HOW TO DO IT
          </Txt>
        </Row>
        <Txt variant="heading">{tip.method}</Txt>
        {prompt !== undefined && answer !== undefined && (
          <Muted variant="caption" style={{ fontSize: 14 }}>
            {prompt} = <Txt variant="caption" style={{ fontFamily: fonts.bold, fontSize: 14 }}>{String(answer)}</Txt>
          </Muted>
        )}
      </View>

      <Muted style={{ fontSize: 15, lineHeight: 22 }}>{tip.idea}</Muted>

      <View style={{ gap: 10 }}>
        {tip.steps.map((s, i) => (
          <Row key={i} gap={10} style={{ alignItems: "flex-start" }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <Txt variant="caption" color={colors.white} style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                {i + 1}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt style={{ fontSize: 15, lineHeight: 21 }}>{s.say}</Txt>
              {s.math ? (
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.primary, fontVariant: ["tabular-nums"] }}>
                  {s.math}
                </Txt>
              ) : null}
            </View>
          </Row>
        ))}
      </View>

      {tip.check ? (
        <Row gap={8} style={{ alignItems: "flex-start" }}>
          <Ionicons name="checkmark-done-outline" size={18} color={colors.success} style={{ marginTop: 1 }} />
          <Muted style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{tip.check}</Muted>
        </Row>
      ) : null}

      <View style={{ backgroundColor: colors.amberSoft, borderRadius: radius.md, padding: 12, flexDirection: "row", gap: 8 }}>
        <Ionicons name="star-outline" size={18} color={colors.amberText} style={{ marginTop: 1 }} />
        <Txt style={{ flex: 1, fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold }} color={colors.amberText}>
          Remember: {tip.remember}
        </Txt>
      </View>
    </View>
  );
}

/** The first move only, shown by the Hint button. Never reveals the answer. */
export function HintText({ track, ops }: { track: SkillTrack | undefined; ops: number[] | undefined }) {
  const tip = track ? coachingTip(track, ops) : null;
  if (!tip) return null;
  return (
    <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", gap: 8, maxWidth: 340 }}>
      <Ionicons name="bulb-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold }}>
          {tip.method}
        </Txt>
        <Txt style={{ fontSize: 15, lineHeight: 21 }}>{tip.hint}</Txt>
      </View>
    </View>
  );
}

export interface ReviewItem {
  prompt: string;
  answer: number;
  given: string;
  correct: boolean;
  track?: SkillTrack;
  ops?: number[];
  usedHint?: boolean;
}

export function CoachingReview({ items }: { items: ReviewItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const missed = items.filter((i) => !i.correct).length;
  // Show the ones worth learning from first: mistakes, then hinted, then the rest.
  const ordered = [...items].sort((a, b) => Number(a.correct) - Number(b.correct) || Number(Boolean(b.usedHint)) - Number(Boolean(a.usedHint)));
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={() => {
          keyHaptic();
          setOpen((o) => !o);
        }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}
      >
        <Row gap={8}>
          <Ionicons name="school-outline" size={18} color={colors.primary} />
          <Txt variant="label" color={colors.primary}>
            {open ? "Hide the walkthroughs" : missed > 0 ? `See how to solve the ${missed} you missed` : "See how to solve each one"}
          </Txt>
        </Row>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
      </Pressable>
      {open &&
        ordered.map((item, i) => (
          <Card key={i} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }}>{item.prompt}</Txt>
              <Muted variant="caption">
                You:{" "}
                <Txt variant="caption" color={item.correct ? colors.success : colors.destructive}>
                  {item.given === "" ? "skipped" : item.given}
                </Txt>
                {item.usedHint ? " (with a hint)" : ""}
                {"  ·  "}Answer: <Txt variant="caption">{String(item.answer)}</Txt>
              </Muted>
            </Row>
            <TipCard track={item.track} ops={item.ops} />
          </Card>
        ))}
    </View>
  );
}
