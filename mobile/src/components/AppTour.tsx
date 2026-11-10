import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Ionicons, Muted, Ring, Row, Stars, Txt, type IconName } from "@/components/ui";
import { keyHaptic } from "@/lib/native";
import { colors, fonts, radius } from "@/theme";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  visual: () => React.ReactNode;
  points: { icon: IconName; text: string }[];
};

/* Small, faithful mock-ups of real screens, so the tour shows what you'll actually use. */

function Pillars() {
  const items: { icon: IconName; label: string; sub: string; tint: string; bg: string }[] = [
    { icon: "library", label: "Learn", sub: "The tricks", tint: colors.primary, bg: colors.primarySoft },
    { icon: "school", label: "Practise", sub: "50 levels", tint: colors.success, bg: colors.successSoft },
    { icon: "bulb", label: "Coaching", sub: "When stuck", tint: colors.warm, bg: colors.warmSoft },
    { icon: "briefcase", label: "Apply", sub: "Real life", tint: colors.amberText, bg: colors.amberSoft },
  ];
  return (
    <View style={styles.grid}>
      {items.map((i) => (
        <View key={i.label} style={[styles.pillar, { backgroundColor: i.bg }]}>
          <Ionicons name={i.icon} size={26} color={i.tint} />
          <Txt variant="label" style={{ marginTop: 8 }}>{i.label}</Txt>
          <Muted variant="caption" style={{ fontSize: 12 }}>{i.sub}</Muted>
        </View>
      ))}
    </View>
  );
}

function MockTabBar({ active }: { active: string }) {
  const tabs: { icon: IconName; label: string }[] = [
    { icon: "school", label: "Train" },
    { icon: "library", label: "Learn" },
    { icon: "briefcase", label: "Scenarios" },
    { icon: "time", label: "History" },
    { icon: "person", label: "Profile" },
  ];
  return (
    <View style={styles.tabbar}>
      {tabs.map((t) => {
        const on = t.label === active;
        return (
          <View key={t.label} style={{ alignItems: "center", flex: 1 }}>
            <Ionicons name={(on ? t.icon : `${t.icon}-outline`) as IconName} size={20} color={on ? colors.primary : colors.mutedForeground} />
            <Txt style={{ fontSize: 10, fontFamily: fonts.medium }} color={on ? colors.primary : colors.mutedForeground}>
              {t.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function MockTrain() {
  return (
    <View style={styles.phone}>
      <View style={styles.goal}>
        <Ring value={0.5} size={54} stroke={6}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 13 }} color={colors.white}>1/2</Txt>
        </Ring>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.6 }} color="rgba(255,255,255,0.8)">TODAY'S GOAL</Txt>
          <Txt style={{ fontFamily: fonts.display, fontSize: 14 }} color={colors.white}>1 more to hit your goal</Txt>
          <View style={styles.whitePill}>
            <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.primary}>Next lesson →</Txt>
          </View>
        </View>
      </View>
      <View style={styles.miniCard}>
        <View style={styles.sym}><Txt style={{ fontFamily: fonts.displayBold }} color={colors.primary}>+</Txt></View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 13, fontFamily: fonts.semibold }}>Addition</Txt>
          <Muted style={{ fontSize: 11 }}>Next: L3, Bridge to the next ten</Muted>
        </View>
        <View style={styles.play}><Ionicons name="play" size={12} color={colors.white} /></View>
      </View>
      <MockTabBar active="Train" />
    </View>
  );
}

function MockLesson() {
  return (
    <View style={styles.phone}>
      <Row style={{ justifyContent: "space-between" }}>
        <Ionicons name="close" size={16} color={colors.mutedForeground} />
        <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }}>Percentages · Level 3</Txt>
        <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.destructive}>Quit</Txt>
      </Row>
      <Txt center style={{ fontFamily: fonts.displayBold, fontSize: 30, marginTop: 10 }}>5% of 360</Txt>
      <View style={styles.answerBox}><Txt style={{ fontFamily: fonts.displayBold, fontSize: 20 }}>18</Txt></View>
      <View style={styles.hintPill}>
        <Ionicons name="bulb-outline" size={12} color={colors.primary} />
        <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.primary}>Hint</Txt>
      </View>
      <View style={styles.keys}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((k) => (
          <View key={k} style={[styles.key, k === "✓" && { backgroundColor: colors.primary }]}>
            <Txt style={{ fontFamily: fonts.display, fontSize: 13 }} color={k === "✓" ? colors.white : colors.foreground}>{k}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

function MockCoaching() {
  return (
    <View style={styles.phone}>
      <Row gap={6}>
        <Ionicons name="close-circle" size={16} color={colors.destructive} />
        <Txt style={{ fontSize: 12, fontFamily: fonts.semibold }} color={colors.destructive}>Not quite. Let's walk through it.</Txt>
      </Row>
      <View style={styles.tip}>
        <Txt style={{ fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.6 }} color={colors.primary}>HOW TO DO IT</Txt>
        <Txt style={{ fontFamily: fonts.display, fontSize: 15 }}>Build it from 10% and 5%</Txt>
        {[
          ["Find 10%: divide by 10.", "360 ÷ 10 = 36"],
          ["5% is half of 10%.", "36 ÷ 2 = 18"],
        ].map(([say, math], i) => (
          <Row key={i} gap={8} style={{ alignItems: "flex-start" }}>
            <View style={styles.num}><Txt style={{ fontSize: 10, fontFamily: fonts.bold }} color={colors.white}>{i + 1}</Txt></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 12 }}>{say}</Txt>
              <Txt style={{ fontSize: 13, fontFamily: fonts.displayBold }} color={colors.primary}>{math}</Txt>
            </View>
          </Row>
        ))}
        <View style={styles.remember}>
          <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.amberText}>Remember: 5% = half of 10%.</Txt>
        </View>
      </View>
    </View>
  );
}

function MockLearn() {
  return (
    <View style={styles.phone}>
      <Txt style={{ fontFamily: fonts.display, fontSize: 15 }}>Mental math techniques</Txt>
      {[
        ["Make a 10", "The foundation of fast adding.", true],
        ["×11: digits apart, sum in the middle", "The trick that always impresses.", false],
        ["The swap trick", "x% of y is the same as y% of x.", false],
      ].map(([n, t, done]) => (
        <View key={n as string} style={styles.miniCard}>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 12, fontFamily: fonts.semibold }}>{n as string}</Txt>
            <Muted style={{ fontSize: 11 }}>{t as string}</Muted>
          </View>
          <Ionicons name={done ? "checkmark-circle" : "chevron-forward"} size={16} color={done ? colors.success : colors.mutedForeground} />
        </View>
      ))}
      <MockTabBar active="Learn" />
    </View>
  );
}

function MockScenario() {
  return (
    <View style={styles.phone}>
      <Txt style={{ fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.8 }} color={colors.mutedForeground}>PRICING</Txt>
      <Txt style={{ fontSize: 12, lineHeight: 17 }}>A supplier raises prices 8%. Your AED 2,500 monthly order now costs…</Txt>
      <View style={{ gap: 6 }}>
        {["AED 2,600", "AED 2,700", "AED 2,800"].map((o, i) => (
          <View key={o} style={[styles.option, i === 1 && { borderColor: colors.success, backgroundColor: colors.successSoft }]}>
            <Txt style={{ fontSize: 12, fontFamily: fonts.medium }}>{o}</Txt>
            {i === 1 && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
          </View>
        ))}
      </View>
      <MockTabBar active="Scenarios" />
    </View>
  );
}

function MockProgress() {
  const rows: [string, number, number][] = [
    ["+", 3, 2],
    ["−", 2, 1],
    ["×", 1, 0],
  ];
  return (
    <View style={styles.phone}>
      <Txt style={{ fontFamily: fonts.display, fontSize: 15 }}>The whole journey</Txt>
      {rows.map(([sym, passed]) => (
        <Row key={sym} gap={6}>
          <Txt style={{ width: 14, fontFamily: fonts.displayBold }} color={colors.primary}>{sym}</Txt>
          <View style={{ flex: 1, flexDirection: "row", gap: 2 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={{ flex: 1, height: 9, borderRadius: 2, backgroundColor: i < passed ? colors.success : i === passed ? colors.primary : colors.muted }}
              />
            ))}
          </View>
        </Row>
      ))}
      <View style={styles.miniCard}>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 12, fontFamily: fonts.semibold }}>Level 2 · Crossing 10</Txt>
          <Muted style={{ fontSize: 11 }}>★★★ under 3s per question</Muted>
        </View>
        <Stars count={3} size={12} />
      </View>
      <Row gap={8}>
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="trophy-outline" size={13} color={colors.primary} />
          <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.primary}>Rank · Sharp</Txt>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.warmSoft }]}>
          <Txt style={{ fontSize: 11 }}>🔥</Txt>
          <Txt style={{ fontSize: 11, fontFamily: fonts.semibold }} color={colors.warm}>6-day streak</Txt>
        </View>
      </Row>
    </View>
  );
}

const SLIDES: Slide[] = [
  {
    eyebrow: "WELCOME",
    title: "Everything you need to think faster with numbers",
    body: "Rapid Math teaches you the tricks, drills them until they're automatic, coaches you when you're stuck, and lets you use them on real work problems.",
    visual: Pillars,
    points: [
      { icon: "time-outline", text: "About 5 minutes a day" },
      { icon: "trending-up", text: "Your speed is measured every lesson" },
    ],
  },
  {
    eyebrow: "TRAIN TAB",
    title: "Your daily home",
    body: "Open the app, tap one button, and you're training. Your daily goal ring fills as you finish lessons.",
    visual: MockTrain,
    points: [
      { icon: "play-circle-outline", text: "\"Next lesson\" picks the right level for you" },
      { icon: "flame-outline", text: "The flame is your streak: train daily to grow it" },
      { icon: "map-outline", text: "\"Full curriculum\" shows every level, start to finish" },
    ],
  },
  {
    eyebrow: "INSIDE A LESSON",
    title: "10 quick questions",
    body: "Tap the answer on the number pad and press ✓. Short, focused, and over in about two minutes.",
    visual: MockLesson,
    points: [
      { icon: "bulb-outline", text: "Hint shows the first step, never the answer" },
      { icon: "school-outline", text: "Before each new level, a Learn card shows the trick" },
      { icon: "close-outline", text: "Quit anytime. Nothing is saved, and it won't use a daily lesson" },
    ],
  },
  {
    eyebrow: "COACHING",
    title: "Get it wrong? We'll show you how",
    body: "Every mistake opens a step-by-step walkthrough using a method that fits those exact numbers.",
    visual: MockCoaching,
    points: [
      { icon: "list-outline", text: "Small steps, each with its own sum" },
      { icon: "star-outline", text: "A rule to remember for next time" },
      { icon: "options-outline", text: "Switch tips to every question while you're learning" },
    ],
  },
  {
    eyebrow: "LEARN & SCENARIOS TABS",
    title: "Learn the theory, then use it for real",
    body: "The Learn tab has 27 techniques with worked examples and a quick try. Scenarios puts them to work on real business problems.",
    visual: MockLearn,
    points: [
      { icon: "library-outline", text: "Learn: why each trick works, not just how" },
      { icon: "briefcase-outline", text: "Scenarios: pricing, sales, budgets and more" },
    ],
  },
  {
    eyebrow: "SCENARIOS",
    title: "Real situations, real numbers",
    body: "Read a short work story, scan the chart or table, and pick the answer. Then see how to do it in your head.",
    visual: MockScenario,
    points: [
      { icon: "cash-outline", text: "VAT, discounts, margins and growth" },
      { icon: "checkmark-done-outline", text: "Solve every scenario in a topic to complete it" },
    ],
  },
  {
    eyebrow: "HOW YOU ADVANCE",
    title: "5 skills, 10 levels each",
    body: "Each level teaches one new skill. Score 8 out of 10 to pass and unlock the next.",
    visual: MockProgress,
    points: [
      { icon: "star", text: "Beat the time target for up to 3 stars" },
      { icon: "trophy-outline", text: "XP from every lesson raises your Rank" },
      { icon: "calendar-outline", text: "Stay consistent: your streak and daily goal keep you on track" },
    ],
  },
];

/** Swipeable, premium walkthrough of how to use the app, how it helps, and how you progress. */
export function AppTour({ onDone, doneLabel = "Let's get started" }: { onDone: () => void; doneLabel?: string }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const last = page === SLIDES.length - 1;

  const goTo = (i: number) => {
    keyHaptic();
    ref.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) setPage(i);
  };

  return (
    <View style={{ flex: 1 }}>
      <Row style={{ justifyContent: "flex-end", paddingHorizontal: 20, height: 36 }}>
        {!last && (
          <Pressable onPress={onDone} hitSlop={10} accessibilityLabel="Skip the tour">
            <Muted variant="label">Skip</Muted>
          </Pressable>
        )}
      </Row>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {SLIDES.map((s) => (
          <ScrollView key={s.title} style={{ width }} contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            <View style={styles.visualWrap}>{s.visual()}</View>
            <Txt variant="caption" color={colors.primary} style={{ fontFamily: fonts.semibold, letterSpacing: 1 }}>
              {s.eyebrow}
            </Txt>
            <Txt variant="title" style={{ marginTop: 6 }}>{s.title}</Txt>
            <Muted style={{ marginTop: 8, fontSize: 16, lineHeight: 23 }}>{s.body}</Muted>
            <View style={{ marginTop: 16, gap: 10 }}>
              {s.points.map((p) => (
                <Row key={p.text} gap={10} style={{ alignItems: "flex-start" }}>
                  <Ionicons name={p.icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
                  <Txt style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>{p.text}</Txt>
                </Row>
              ))}
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 8, gap: 14 }}>
        <Row gap={6} style={{ justifyContent: "center" }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </Row>
        <Button title={last ? doneLabel : "Next"} icon="arrow-forward" onPress={() => (last ? onDone() : goTo(page + 1))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { paddingHorizontal: 24, paddingBottom: 12 },
  visualWrap: { alignItems: "center", marginBottom: 20, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: 300, justifyContent: "center" },
  pillar: { width: 140, borderRadius: radius.lg, padding: 14, alignItems: "flex-start" },
  phone: {
    width: 290,
    borderRadius: 26,
    borderWidth: 6,
    borderColor: "#0f1b3d",
    backgroundColor: colors.background,
    padding: 12,
    gap: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  goal: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: colors.primary, borderRadius: 16, padding: 10 },
  whitePill: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  miniCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.card, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 8 },
  sym: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  play: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  tabbar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 6, marginTop: 2 },
  answerBox: { alignSelf: "center", width: 130, height: 40, borderRadius: 12, borderWidth: 2, borderColor: colors.accent, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  hintPill: { alignSelf: "center", flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  keys: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 5 },
  key: { width: "31%", height: 26, borderRadius: 8, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
  tip: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.accent, padding: 10, gap: 8 },
  num: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 1 },
  remember: { backgroundColor: colors.amberSoft, borderRadius: 8, padding: 6 },
  option: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 22, backgroundColor: colors.primary },
});
