import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Card, IconBadge, Ionicons, Muted, Row, Txt, type IconName } from "@/components/ui";
import { colors, fonts } from "@/theme";

type Source = { n: number; text: string; url: string };

const SOURCES: Source[] = [
  {
    n: 1,
    text: "Duncan, G. J., et al. (2007). School readiness and later achievement. Developmental Psychology, 43(6), 1428–1446.",
    url: "https://pubmed.ncbi.nlm.nih.gov/18020822/",
  },
  {
    n: 2,
    text: "Price, G. R., Mazzocco, M. M. M., & Ansari, D. (2013). Why mental arithmetic counts: Brain activation during single digit arithmetic predicts high school math scores. Journal of Neuroscience, 33(1), 156–163.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6618631/",
  },
  {
    n: 3,
    text: "Hanushek, E. A., Schwerdt, G., Wiederhold, S., & Woessmann, L. (2015). Returns to skills around the world: Evidence from PIAAC. European Economic Review, 73, 103–130.",
    url: "https://www.nber.org/papers/w19762",
  },
  {
    n: 4,
    text: "National Mathematics Advisory Panel (2008). Foundations for Success: The Final Report of the National Mathematics Advisory Panel. U.S. Department of Education.",
    url: "https://www2.ed.gov/about/bdscomm/list/mathpanel/report/final-report.pdf",
  },
  {
    n: 5,
    text: "Reyna, V. F., Nelson, W. L., Han, P. K., & Dieckmann, N. F. (2009). How numeracy influences risk comprehension and medical decision making. Psychological Bulletin, 135(6), 943–973.",
    url: "https://pubmed.ncbi.nlm.nih.gov/19883143/",
  },
  {
    n: 6,
    text: "Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5–44.",
    url: "https://www.nber.org/papers/w18952",
  },
  {
    n: 7,
    text: "Sweller, J., & Cooper, G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. Cognition and Instruction, 2(1), 59–89.",
    url: "https://doi.org/10.1207/s1532690xci0201_3",
  },
  {
    n: 8,
    text: "Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.",
    url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
  },
  {
    n: 9,
    text: "Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.",
    url: "https://pubmed.ncbi.nlm.nih.gov/16719566/",
  },
];

const SKILLS: { symbol: string; name: string; why: string; where: string }[] = [
  {
    symbol: "+",
    name: "Addition",
    why: "Every other calculation is built on it. Multiplying is repeated adding, and most percentages end with an add.",
    where: "Totals, bills, budgets, adding up a team's numbers.",
  },
  {
    symbol: "−",
    name: "Subtraction",
    why: "It's how you compare: the gap between two numbers, what's left, what changed.",
    where: "Change, budget left, this month vs last month, price differences.",
  },
  {
    symbol: "×",
    name: "Multiplication",
    why: "Times-table facts you recall instantly free up your working memory for the real problem (4).",
    where: "Price × quantity, monthly to yearly, scaling recipes or orders.",
  },
  {
    symbol: "÷",
    name: "Division",
    why: "Splitting and rates: per person, per hour, per unit. It's multiplication backwards, so the two are trained together.",
    where: "Splitting a bill, cost per unit, hourly rates, averages.",
  },
  {
    symbol: "%",
    name: "Percentages",
    why: "The everyday language of money and risk. People who handle numbers like these well make better financial (6) and health decisions (5).",
    where: "Discounts, tax, tips, interest, growth, margins.",
  },
];

const METHOD: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "book-outline",
    title: "Learn from worked examples",
    text: "Each skill starts with a step-by-step example. For beginners, studying worked examples beats struggling through problems alone (7).",
  },
  {
    icon: "flash-outline",
    title: "Practise by recalling, not rereading",
    text: "Lessons make you answer, not just read. Testing yourself builds stronger long-term memory than studying the same material again (8).",
  },
  {
    icon: "calendar-outline",
    title: "A little every day",
    text: "Short daily lessons and streaks spread your practice out. Spaced practice is one of the most reliable findings in learning research (9).",
  },
  {
    icon: "briefcase-outline",
    title: "Apply it to real life",
    text: "Scenarios put the same skills into real situations, so they work outside the app too.",
  },
];

/** Why these five skills, and why the method works, with sources. */
export default function Science() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Txt variant="title">Why Rapid Math works</Txt>
        <Muted style={{ marginTop: 6 }}>
          What we train, why it matters, and the research behind it. Numbers in brackets link to the sources at the bottom.
        </Muted>
      </View>

      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <IconBadge name="analytics-outline" size={44} />
          <Txt variant="heading" style={{ flex: 1 }}>
            Mental maths pays off
          </Txt>
        </Row>
        <Point text="Early maths skills were the strongest predictor of later school success across six large studies, ahead of reading and attention (1)." />
        <Point text="Teenagers whose brains answer simple sums from memory, rather than working them out, scored higher on a national maths test (2)." />
        <Point text="Across 22 countries, adults with stronger number skills earn more: on average about 18% higher wages for a clear step up in skill (3)." />
      </Card>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">Why these five skills?</Txt>
        <Muted>
          Almost every number you meet at work or in daily life uses one of these five. A US government expert panel recommends fast, automatic recall of basic facts, plus knowing why the methods work (4). Rapid Math trains both.
        </Muted>
        {SKILLS.map((s) => (
          <Card key={s.name} style={{ gap: 6 }}>
            <Row gap={10}>
              <View style={styles.symbol}>
                <Txt style={{ fontFamily: fonts.displayBold, fontSize: 18 }} color={colors.primary}>
                  {s.symbol}
                </Txt>
              </View>
              <Txt variant="label">{s.name}</Txt>
            </Row>
            <Txt>{s.why}</Txt>
            <Muted variant="caption">Used for: {s.where}</Muted>
          </Card>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">How the app trains you</Txt>
        {METHOD.map((m) => (
          <Card key={m.title} style={{ flexDirection: "row", gap: 12 }}>
            <IconBadge name={m.icon} size={40} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="label">{m.title}</Txt>
              <Muted>{m.text}</Muted>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="heading">Sources</Txt>
        <Muted variant="caption">
          These studies are about mental maths and learning in general. Rapid Math is built on their findings, but the app itself hasn't been studied.
        </Muted>
        {SOURCES.map((s) => (
          <Pressable key={s.n} onPress={() => void Linking.openURL(s.url)} style={({ pressed }) => [styles.source, pressed && { opacity: 0.6 }]}>
            <Txt variant="caption" style={{ fontFamily: fonts.semibold, width: 22 }}>
              {s.n}.
            </Txt>
            <Muted variant="caption" style={{ flex: 1 }}>
              {s.text}
            </Muted>
            <Ionicons name="open-outline" size={14} color={colors.primary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Point({ text }: { text: string }) {
  return (
    <Row gap={10} style={{ alignItems: "flex-start" }}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 2 }} />
      <Txt style={{ flex: 1 }}>{text}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  symbol: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  source: { flexDirection: "row", gap: 6, alignItems: "flex-start", paddingVertical: 6 },
});
