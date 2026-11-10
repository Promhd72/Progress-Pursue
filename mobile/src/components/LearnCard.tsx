import { ScrollView, View } from "react-native";
import { TipCard } from "@/components/Coaching";
import { Button, Ionicons, Muted, Row, Txt } from "@/components/ui";
import { buildQuestion, levelDef, levelSummary, TRACK_LABELS, type SkillTrack } from "@/lib/curriculum";
import { colors, fonts, radius } from "@/theme";

const KEY = (t: SkillTrack, l: number) => `rapidmath.learned.${t}.${l}`;

export function hasLearned(track: SkillTrack, level: number) {
  try {
    return localStorage.getItem(KEY(track, level)) === "1";
  } catch {
    return false;
  }
}

export function markLearned(track: SkillTrack, level: number) {
  try {
    localStorage.setItem(KEY(track, level), "1");
  } catch {
    // Ignore.
  }
}

/** "Learn" step before practice: the skill, why it matters, a worked example, and the goal. */
export function LearnCard({ track, level, onStart }: { track: SkillTrack; level: number; onStart: () => void }) {
  const info = levelSummary(track, level);
  const ex = buildQuestion(track, levelDef(track, level).example);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
        <View style={{ gap: 6 }}>
          <Muted variant="caption" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
            {TRACK_LABELS[track].toUpperCase()} · LEVEL {level}
          </Muted>
          <Txt variant="title">{info.name}</Txt>
          <Row gap={8} style={{ alignItems: "flex-start" }}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <Txt style={{ flex: 1, fontSize: 16, lineHeight: 23 }}>{info.outcome}</Txt>
          </Row>
          {info.context ? (
            <Row gap={8} style={{ alignItems: "flex-start" }}>
              <Ionicons name="briefcase-outline" size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <Muted style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>{info.context}</Muted>
            </Row>
          ) : null}
        </View>

        <TipCard track={track} ops={ex.ops} prompt={ex.prompt} answer={ex.answer} />

        <View style={{ backgroundColor: colors.muted, borderRadius: radius.md, padding: 14, gap: 8 }}>
          <Txt variant="label">How to pass</Txt>
          <Row gap={8}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Muted style={{ flex: 1, fontSize: 15 }}>Get 8 of 10 right to pass and unlock the next level.</Muted>
          </Row>
          <Row gap={8}>
            <Ionicons name="star" size={18} color="#f5a524" />
            <Muted style={{ flex: 1, fontSize: 15 }}>
              Average under {info.targetSec}s per question for 3 stars, under {Math.round(info.targetSec * 1.5 * 10) / 10}s for 2.
            </Muted>
          </Row>
          <Row gap={8}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Muted style={{ flex: 1, fontSize: 15 }}>Stuck? Tap Hint. Get one wrong and we'll walk you through it.</Muted>
          </Row>
        </View>
      </ScrollView>
      <Button title="Start practice" icon="arrow-forward" onPress={onStart} />
    </View>
  );
}
