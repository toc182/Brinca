import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';
import type { ValueForType } from '@/shared/tracking-elements/types/element-values';
import type { ConfigForType } from '@/shared/tracking-elements/types/element-configs';
import { CounterElement } from './CounterElement';
import { CombinedCounterElement } from './CombinedCounterElement';
import { SplitCounterElement } from './SplitCounterElement';
import { MultistepCounterElement } from './MultistepCounterElement';
import { StopwatchElement } from './StopwatchElement';
import { CountdownTimerElement } from './CountdownTimerElement';
import { LapTimerElement } from './LapTimerElement';
import { IntervalTimerElement } from './IntervalTimerElement';
import { ChecklistElement } from './ChecklistElement';
import { SingleSelectElement } from './SingleSelectElement';
import { MultiSelectElement } from './MultiSelectElement';
import { YesNoElement } from './YesNoElement';
import { RatingScaleElement } from './RatingScaleElement';
import { EmojiFaceScaleElement } from './EmojiFaceScaleElement';
import { NumberInputElement } from './NumberInputElement';
import { MultiNumberInputElement } from './MultiNumberInputElement';
import { FreeTextNoteElement } from './FreeTextNoteElement';
import { VoiceNoteElement } from './VoiceNoteElement';

interface ElementRendererProps {
  type: ElementType;
  value: Record<string, unknown>;
  onValueChange: (value: Record<string, unknown>) => void;
  config: Record<string, unknown>;
  /** Optional element ID used by timer elements to persist startTime in MMKV. */
  elementId?: string;
}

/**
 * Dispatches to the correct interactive element component based on type.
 * Props arrive as generic Records from the session-logging layer;
 * we cast through `unknown` to satisfy strict TS without `any`.
 */
export function ElementRenderer({ type, value, onValueChange, config, elementId }: ElementRendererProps) {
  // Helper to safely cast the callback. Each child emits its own typed value
  // which is a subset of Record<string, unknown> at runtime.
  const cb = onValueChange as unknown;

  switch (type) {
    case 'counter':
      return (
        <CounterElement
          value={value as unknown as ValueForType<'counter'>}
          onValueChange={cb as (v: ValueForType<'counter'>) => void}
          config={config as unknown as ConfigForType<'counter'>}
        />
      );

    case 'combined_counter':
      return (
        <CombinedCounterElement
          value={value as unknown as ValueForType<'combined_counter'>}
          onValueChange={cb as (v: ValueForType<'combined_counter'>) => void}
          config={config as unknown as ConfigForType<'combined_counter'>}
        />
      );

    case 'split_counter':
      return (
        <SplitCounterElement
          value={value as unknown as ValueForType<'split_counter'>}
          onValueChange={cb as (v: ValueForType<'split_counter'>) => void}
          config={config as unknown as ConfigForType<'split_counter'>}
        />
      );

    case 'multistep_counter':
      return (
        <MultistepCounterElement
          value={value as unknown as ValueForType<'multistep_counter'>}
          onValueChange={cb as (v: ValueForType<'multistep_counter'>) => void}
          config={config as unknown as ConfigForType<'multistep_counter'>}
        />
      );

    case 'stopwatch':
      return (
        <StopwatchElement
          value={value as unknown as ValueForType<'stopwatch'>}
          onValueChange={cb as (v: ValueForType<'stopwatch'>) => void}
          config={config as unknown as ConfigForType<'stopwatch'>}
          elementId={elementId}
        />
      );

    case 'countdown_timer':
      return (
        <CountdownTimerElement
          value={value as unknown as ValueForType<'countdown_timer'>}
          onValueChange={cb as (v: ValueForType<'countdown_timer'>) => void}
          config={config as unknown as ConfigForType<'countdown_timer'>}
          elementId={elementId}
        />
      );

    case 'lap_timer':
      return (
        <LapTimerElement
          value={value as unknown as ValueForType<'lap_timer'>}
          onValueChange={cb as (v: ValueForType<'lap_timer'>) => void}
          config={config as unknown as ConfigForType<'lap_timer'>}
          elementId={elementId}
        />
      );

    case 'interval_timer':
      return (
        <IntervalTimerElement
          value={value as unknown as ValueForType<'interval_timer'>}
          onValueChange={cb as (v: ValueForType<'interval_timer'>) => void}
          config={config as unknown as ConfigForType<'interval_timer'>}
          elementId={elementId}
        />
      );

    case 'checklist':
      return (
        <ChecklistElement
          value={value as unknown as ValueForType<'checklist'>}
          onValueChange={cb as (v: ValueForType<'checklist'>) => void}
          config={config as unknown as ConfigForType<'checklist'>}
        />
      );

    case 'single_select':
      return (
        <SingleSelectElement
          value={value as unknown as ValueForType<'single_select'>}
          onValueChange={cb as (v: ValueForType<'single_select'>) => void}
          config={config as unknown as ConfigForType<'single_select'>}
        />
      );

    case 'multi_select':
      return (
        <MultiSelectElement
          value={value as unknown as ValueForType<'multi_select'>}
          onValueChange={cb as (v: ValueForType<'multi_select'>) => void}
          config={config as unknown as ConfigForType<'multi_select'>}
        />
      );

    case 'yes_no':
      return (
        <YesNoElement
          value={value as unknown as ValueForType<'yes_no'>}
          onValueChange={cb as (v: ValueForType<'yes_no'>) => void}
          config={config as unknown as ConfigForType<'yes_no'>}
        />
      );

    case 'rating_scale':
      return (
        <RatingScaleElement
          value={value as unknown as ValueForType<'rating_scale'>}
          onValueChange={cb as (v: ValueForType<'rating_scale'>) => void}
          config={config as unknown as ConfigForType<'rating_scale'>}
        />
      );

    case 'emoji_face_scale':
      return (
        <EmojiFaceScaleElement
          value={value as unknown as ValueForType<'emoji_face_scale'>}
          onValueChange={cb as (v: ValueForType<'emoji_face_scale'>) => void}
          config={config as unknown as ConfigForType<'emoji_face_scale'>}
        />
      );

    case 'number_input':
      return (
        <NumberInputElement
          value={value as unknown as ValueForType<'number_input'>}
          onValueChange={cb as (v: ValueForType<'number_input'>) => void}
          config={config as unknown as ConfigForType<'number_input'>}
        />
      );

    case 'multi_number_input':
      return (
        <MultiNumberInputElement
          value={value as unknown as ValueForType<'multi_number_input'>}
          onValueChange={cb as (v: ValueForType<'multi_number_input'>) => void}
          config={config as unknown as ConfigForType<'multi_number_input'>}
        />
      );

    case 'free_text_note':
      return (
        <FreeTextNoteElement
          value={value as unknown as ValueForType<'free_text_note'>}
          onValueChange={cb as (v: ValueForType<'free_text_note'>) => void}
          config={config as unknown as ConfigForType<'free_text_note'>}
        />
      );

    case 'voice_note':
      return (
        <VoiceNoteElement
          value={value as unknown as ValueForType<'voice_note'>}
          onValueChange={cb as (v: ValueForType<'voice_note'>) => void}
          config={config as unknown as ConfigForType<'voice_note'>}
        />
      );

    default: {
      const _exhaustive: never = type;
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Unknown element type: {String(_exhaustive)}</Text>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  fallback: {
    padding: spacing.md,
    alignItems: 'center',
  },
  fallbackText: {
    ...typography.caption,
    color: colors.error500,
  },
});
