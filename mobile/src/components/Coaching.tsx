import { useState } from "react";
import { Pressable, View } from "react-native";
import { Card, Ionicons, Muted, Row, Txt } from "@/components/ui";
import { coachingTip } from "@/lib/coaching";
import type { SkillTrack } from "@/lib/curriculum";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

const STORAGE_KEY = "rapidmath.coaching";

/** Opt-in coaching preference, remembered on the device. Off by default. */
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
        Coaching {enabled ? "on" : "off"}
      </Txt>
    </Pressable>
  );
}

export function TipCard({ track, ops }: { track: SkillTrack | undefined; ops: number[] | undefined }) {
  const tip = track ? coachingTip(track, ops) : null;
  if (!tip) return null;
  return (
    <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, gap: 6 }}>
      <Row gap={6}>
        <Ionicons name="bulb-outline" size={16} color={colors.primary} />
        <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, flex: 1 }}>
          {tip.headline}
        </Txt>
      </Row>
      {tip.steps.map((s, i) => (
        <Muted key={i} variant="caption" style={{ fontSize: 14, lineHeight: 20 }}>
          {s}
        </Muted>
      ))}
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
}

export function CoachingReview({ items }: { items: ReviewItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const missed = items.filter((i) => !i.correct).length;
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
            {open ? "Hide coaching" : missed > 0 ? `Review ${missed} missed with tips` : "Review answers with tips"}
          </Txt>
        </Row>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.primary} />
      </Pressable>
      {open &&
        items.map((item, i) => (
          <Card key={i} style={{ gap: 10 }}>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }}>{item.prompt}</Txt>
              <Muted variant="caption">
                You:{" "}
                <Txt variant="caption" color={item.correct ? colors.success : colors.destructive}>
                  {item.given === "" ? "skipped" : item.given}
                </Txt>
                {"  ·  "}Answer: <Txt variant="caption">{String(item.answer)}</Txt>
              </Muted>
            </Row>
            <TipCard track={item.track} ops={item.ops} />
          </Card>
        ))}
    </View>
  );
}
