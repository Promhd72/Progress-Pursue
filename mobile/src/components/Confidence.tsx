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
import { auto, getLang, tr } from "@/lib/i18n";

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
              ? tr('Two weeks ago you said: "{label}". How do you feel now?', { label: auto(confidenceLevel(state.before!.value).label) })
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
      : days === 1 ? tr("Check-in in 1 day.") : tr("Check-in in {n} days.", { n: days ?? 0 })
    : diff > 0
      ? diff === 1 ? tr("Up 1 step in two weeks. That's real progress.") : tr("Up {n} steps in two weeks. That's real progress.", { n: diff })
      : diff === 0
        ? "Holding steady. Keep the streak going and check again later."
        : "A dip happens. Keep going: confidence follows practice.";

  return (
    <Card style={{ gap: 12 }}>
      <Txt variant="label">Confidence with numbers</Txt>
      <Row gap={10} style={{ alignItems: "center" }}>
        <Side title={getLang() === "id" ? tr("At the start") : "Start"} emoji={before.emoji} label={before.label} />
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
