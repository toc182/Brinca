import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, typography } from '@/shared/theme';

const SIZE = 38;
const STROKE = 4;
const GAP_DEG = 8; // angular gap between arcs, in degrees

interface DayRingProps {
  day: number;
  /** One color per activity done that day; [] = nothing practiced. */
  segmentColors: string[];
  today: boolean;
  /** A future day, or a day outside the practiced range — dims the number. */
  dim: boolean;
  selected: boolean;
}

/**
 * A calendar day drawn as an activity ring: the date number centered, encircled
 * by one colored arc per activity practiced that day. One activity → a solid
 * ring; several → equal arcs; none → a faint gray ring. Scales to any count with
 * no "+N", so a busy day simply reads as a richer ring.
 */
export function DayRing({ day, segmentColors, today, dim, selected }: DayRingProps) {
  const r = (SIZE - STROKE) / 2;
  const c = SIZE / 2;
  const circumference = 2 * Math.PI * r;
  const n = segmentColors.length;

  const numberColor = n > 0 ? colors.textPrimary : today ? colors.accent600 : dim ? colors.textDisabled : colors.textPlaceholder;

  return (
    <View style={[styles.wrap, selected && styles.selected]}>
      <Svg width={SIZE} height={SIZE}>
        {/* Warm center for today so it reads as "now" even before any practice. */}
        {today && <Circle cx={c} cy={c} r={r - STROKE / 2} fill={colors.accent50} />}

        {n === 0 && (
          <Circle cx={c} cy={c} r={r} stroke={colors.borderSubtle} strokeWidth={STROKE} fill="none" />
        )}
        {n === 1 && (
          <Circle cx={c} cy={c} r={r} stroke={segmentColors[0]} strokeWidth={STROKE} fill="none" />
        )}
        {n > 1 && segmentColors.map((color, i) => {
          const segDeg = 360 / n;
          const drawDeg = segDeg - GAP_DEG;
          const arcLen = (drawDeg / 360) * circumference;
          return (
            <Circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              stroke={color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${arcLen} ${circumference - arcLen}`}
              strokeDashoffset={-((i * segDeg + GAP_DEG / 2) / 360) * circumference}
              strokeLinecap="round"
              // Start at 12 o'clock instead of 3 o'clock.
              originX={c}
              originY={c}
              rotation={-90}
            />
          );
        })}
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <Text style={[styles.number, { color: numberColor }, today && styles.numberToday]}>{day}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  selected: { borderWidth: 2, borderColor: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  number: { ...typography.bodySmall, lineHeight: 16 },
  numberToday: { fontFamily: 'Lexend_600SemiBold' },
});
