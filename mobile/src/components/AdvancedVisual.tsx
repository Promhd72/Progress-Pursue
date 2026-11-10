import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Polyline, Text as SvgText } from "react-native-svg";
import { Muted, Txt } from "@/components/ui";
import type { Visual } from "@/lib/advanced-questions";
import { colors, fonts, radius } from "@/theme";

/** Native rendering of an Advanced scenario's table, bar chart or line chart. */
export function AdvancedVisual({ visual }: { visual: Visual }) {
  if (visual.kind === "none") return null;

  if (visual.kind === "table") {
    return (
      <View style={styles.table}>
        <View style={[styles.tr, { backgroundColor: colors.muted }]}>
          {visual.columns.map((c, j) => (
            <Muted key={c} variant="caption" style={[styles.td, { fontFamily: fonts.semibold, fontSize: 12 }, j > 0 && styles.num]}>
              {c.toUpperCase()}
            </Muted>
          ))}
        </View>
        {visual.rows.map((row, i) => (
          <View key={i} style={[styles.tr, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            {row.map((cell, j) => (
              <Txt key={j} variant="caption" style={[styles.td, { fontSize: 14 }, j === 0 ? { fontFamily: fonts.semibold } : styles.num]}>
                {String(cell)}
              </Txt>
            ))}
          </View>
        ))}
      </View>
    );
  }

  if (visual.kind === "bar") {
    const max = Math.max(...visual.data.map((d) => d.value), 1);
    return (
      <View style={{ gap: 10 }}>
        {visual.data.map((d) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Muted variant="caption" style={{ width: 96, fontSize: 13 }} numberOfLines={1}>
              {d.label}
            </Muted>
            <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.muted, overflow: "hidden" }}>
              <View style={{ width: `${(d.value / max) * 100}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 6 }} />
            </View>
            <Txt variant="caption" style={{ width: 64, textAlign: "right", fontFamily: fonts.semibold, fontVariant: ["tabular-nums"] }}>
              {d.value.toLocaleString()}
            </Txt>
          </View>
        ))}
        {visual.unit ? <Muted variant="caption" style={{ textAlign: "right", fontSize: 12 }}>{visual.unit}</Muted> : null}
      </View>
    );
  }

  return <LineChart data={visual.data} unit={visual.unit} />;
}

function LineChart({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const [w, setW] = useState(300);
  const h = 150;
  const pad = { x: 16, top: 22, bottom: 24 };
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const x = (i: number) => pad.x + (i / Math.max(1, data.length - 1)) * (w - pad.x * 2);
  const y = (v: number) => pad.top + (1 - (v - min) / range) * (h - pad.top - pad.bottom);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={h}>
        <Polyline points={pts} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <Circle key={i} cx={x(i)} cy={y(d.value)} r={4} fill={colors.primary} />
        ))}
        {data.map((d, i) => (
          <SvgText key={`v${i}`} x={x(i)} y={y(d.value) - 9} fontSize={11} fontWeight="600" fill={colors.foreground} textAnchor="middle">
            {d.value.toLocaleString()}
          </SvgText>
        ))}
        {data.map((d, i) => (
          <SvgText key={`l${i}`} x={x(i)} y={h - 6} fontSize={11} fill={colors.mutedForeground} textAnchor="middle">
            {d.label}
          </SvgText>
        ))}
      </Svg>
      {unit ? <Muted variant="caption" style={{ textAlign: "right", fontSize: 12 }}>{unit}</Muted> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  tr: { flexDirection: "row", paddingHorizontal: 10 },
  td: { flex: 1, paddingVertical: 9, paddingHorizontal: 2 },
  num: { textAlign: "right", fontVariant: ["tabular-nums"] },
});
