import { useState } from "react";
import { View } from "react-native";
import { Button, Card, ChoiceCard, IconBadge, Muted, Row, Txt } from "@/components/ui";
import {
  CHECKIN_DAYS,
  CONFIDENCE_LEVELS,
  confidenceLevel,
  daysUntilCheckIn,
  getConfidence,
  saveConfidence,
  type ConfidenceState,
} from "@/lib/confidence";
import { finishHaptic } from "@/lib/native";
import { colors, fonts } from "@/theme";

export function ConfidencePicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {CONFIDENCE_LEVELS.map((l) => (
        <ChoiceCard key={l.value} selected={value === l.value} onPress={() => onChange(l.value)} emoji={l.emoji} title={l.label} />
      ))}
    </View>
  );
}

/**
 * Train tab card. Asks for a baseline if there isn't one, asks again once the
 * 2-week check-in is due, then shows the before/after result.
 */
export function ConfidenceCard() {
  const [state, setState] = useState<ConfidenceState>(() => getConfidence());
  const [choice, setChoice] = useState<number | null>(null);
  const [justDone, setJustDone] = useState(false);
  const due = daysUntilCheckIn(state);

  if (justDone && state.before && state.after) return <ConfidenceResult state={state} />;
  if (state.before && due !== 0) return null;

  const isCheckIn = !!state.before;
  return (
    <Card style={{ gap: 14, borderColor: colors.primary }}>
      <Row gap={12} style={{ alignItems: "flex-start" }}>
        <IconBadge name="pulse-outline" size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{isCheckIn ? "Your 2-week check-in" : "Quick question"}</Txt>
          <Muted variant="caption" style={{ fontSize: 14, marginTop: 2 }}>
            {isCheckIn
              ? `Two weeks ago you said: "${confidenceLevel(state.before!.value).label}". How do you feel now?`
              : `How confident do you feel with numbers today? We'll ask again in ${CHECKIN_DAYS} days so you can see the change.`}
          </Muted>
        </View>
      </Row>
      <ConfidencePicker value={choice} onChange={setChoice} />
      <Button
        title="Save"
        disabled={choice === null}
        onPress={() => {
          if (choice === null) return;
          const next = saveConfidence(choice);
          setState(next);
          if (next.after) {
            finishHaptic();
            setJustDone(true);
          }
        }}
      />
    </Card>
  );
}

/** Before/after summary. Shows nothing until there's a baseline. */
export function ConfidenceResult({ state = getConfidence() }: { state?: ConfidenceState }) {
  if (!state.before) return null;
  const before = confidenceLevel(state.before.value);
  const after = state.after ? confidenceLevel(state.after.value) : null;
  const days = daysUntilCheckIn(state);
  const diff = after ? after.value - before.value : 0;
  const headline = !after
    ? days === 0
      ? "Your check-in is ready on the Train tab."
      : `Check-in in ${days} day${days === 1 ? "" : "s"}.`
    : diff > 0
      ? `Up ${diff} step${diff === 1 ? "" : "s"} in two weeks. That's real progress.`
      : diff === 0
        ? "Holding steady. Keep the streak going and check again later."
        : "A dip happens. Keep going: confidence follows practice.";

  return (
    <Card style={{ gap: 12 }}>
      <Txt variant="label">Confidence with numbers</Txt>
      <Row gap={10} style={{ alignItems: "center" }}>
        <Side title="Start" emoji={before.emoji} label={before.label} />
        <Txt style={{ fontSize: 20 }} color={colors.mutedForeground}>
          →
        </Txt>
        <Side title={after ? "After 2 weeks" : "2 weeks"} emoji={after ? after.emoji : "⏳"} label={after ? after.label : "Not yet"} />
      </Row>
      <Muted variant="caption" style={{ fontSize: 14 }}>
        {headline}
      </Muted>
    </Card>
  );
}

function Side({ title, emoji, label }: { title: string; emoji: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Muted variant="caption" style={{ fontFamily: fonts.semibold }}>
        {title}
      </Muted>
      <Txt style={{ fontSize: 30 }}>{emoji}</Txt>
      <Txt variant="caption" center>
        {label}
      </Txt>
    </View>
  );
}
