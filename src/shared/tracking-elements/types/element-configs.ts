/**
 * TypeScript interfaces for the config JSONB of each element type.
 * Stored in tracking_elements.config.
 * Per docs/feature-specs/activity-builder.md.
 */

// -- Counters --

export interface CounterConfig {
  target?: number;
}

export interface CombinedCounterConfig {
  target?: number;
}

export interface SplitCounterConfig {
  leftLabel: string;
  rightLabel: string;
  targetLeft?: number;
  targetRight?: number;
}

export interface MultistepCounterConfig {
  substeps: string[];
  targetReps?: number;
}

// -- Timers --

export interface StopwatchConfig {
  targetSeconds?: number;
}

export interface CountdownTimerConfig {
  durationSeconds: number;
}

export interface LapTimerConfig {
  targetLaps?: number;
  targetLapTimeSeconds?: number;
}

export interface IntervalTimerConfig {
  workDurationSeconds: number;
  restDurationSeconds: number;
  cycles: number;
}

// -- Selection --

export interface ChecklistConfig {
  items: { id: string; name: string }[];
  targetItemsCompleted?: number;
}

export interface SingleSelectConfig {
  options: { id: string; name: string }[];
  targetOptionId?: string;
}

export interface MultiSelectConfig {
  options: { id: string; name: string }[];
  targetSelected?: number;
}

export interface YesNoConfig {
  targetAnswer?: 'yes' | 'no';
}

export interface RatingScaleConfig {
  minValue: number;
  maxValue: number;
  lowLabel?: string;
  highLabel?: string;
  targetValue?: number;
}

export interface EmojiFaceScaleConfig {
  faceCount: 3 | 5;
  targetValue?: number;
}

// -- Input --

export interface NumberInputConfig {
  unit?: string;
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
}

export interface MultiNumberInputConfig {
  unit?: string;
  targetEntries?: number;
}

export interface FreeTextNoteConfig {
  placeholder?: string;
}

export interface VoiceNoteConfig {
  maxDurationSeconds: number;
}

// -- Discriminated union --

import type { ElementType } from './element-types';

export type ElementConfig =
  | { type: 'counter'; config: CounterConfig }
  | { type: 'combined_counter'; config: CombinedCounterConfig }
  | { type: 'split_counter'; config: SplitCounterConfig }
  | { type: 'multistep_counter'; config: MultistepCounterConfig }
  | { type: 'stopwatch'; config: StopwatchConfig }
  | { type: 'countdown_timer'; config: CountdownTimerConfig }
  | { type: 'lap_timer'; config: LapTimerConfig }
  | { type: 'interval_timer'; config: IntervalTimerConfig }
  | { type: 'checklist'; config: ChecklistConfig }
  | { type: 'single_select'; config: SingleSelectConfig }
  | { type: 'multi_select'; config: MultiSelectConfig }
  | { type: 'yes_no'; config: YesNoConfig }
  | { type: 'rating_scale'; config: RatingScaleConfig }
  | { type: 'emoji_face_scale'; config: EmojiFaceScaleConfig }
  | { type: 'number_input'; config: NumberInputConfig }
  | { type: 'multi_number_input'; config: MultiNumberInputConfig }
  | { type: 'free_text_note'; config: FreeTextNoteConfig }
  | { type: 'voice_note'; config: VoiceNoteConfig };

export type ConfigForType<T extends ElementType> = Extract<ElementConfig, { type: T }>['config'];
