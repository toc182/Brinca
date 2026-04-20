/**
 * TypeScript interfaces for the value JSONB of each element type.
 * Stored in element_values.value.
 * Per docs/architecture/05-database-schema.md §2.14.
 */

export interface CounterValue { count: number }
export interface CombinedCounterValue { count: number }
export interface SplitCounterValue { left: number; right: number }
export interface MultistepCounterValue { reps: number }
export interface StopwatchValue { elapsed_seconds: number }
export interface CountdownTimerValue { remaining_seconds: number; elapsed_seconds: number }
export interface LapTimerValue { laps: number[]; total_elapsed: number }
export interface IntervalTimerValue { completed_cycles: number; total_elapsed: number; skipped_phases: number }
export interface ChecklistValue { items: { item_id: string; checked: boolean }[] }
export interface SingleSelectValue { selected: string | null }
export interface MultiSelectValue { selected: string[] }
export interface YesNoValue { answer: 'yes' | 'no' | null }
export interface RatingScaleValue { value: number | null }
export interface EmojiFaceScaleValue { value: number | null }
export interface NumberInputValue { value: number | null }
export interface MultiNumberInputValue { values: number[] }
export interface FreeTextNoteValue { text: string }
export interface VoiceNoteValue { file_uri: string; duration_seconds: number }

import type { ElementType } from './element-types';

export type ElementValue =
  | { type: 'counter'; value: CounterValue }
  | { type: 'combined_counter'; value: CombinedCounterValue }
  | { type: 'split_counter'; value: SplitCounterValue }
  | { type: 'multistep_counter'; value: MultistepCounterValue }
  | { type: 'stopwatch'; value: StopwatchValue }
  | { type: 'countdown_timer'; value: CountdownTimerValue }
  | { type: 'lap_timer'; value: LapTimerValue }
  | { type: 'interval_timer'; value: IntervalTimerValue }
  | { type: 'checklist'; value: ChecklistValue }
  | { type: 'single_select'; value: SingleSelectValue }
  | { type: 'multi_select'; value: MultiSelectValue }
  | { type: 'yes_no'; value: YesNoValue }
  | { type: 'rating_scale'; value: RatingScaleValue }
  | { type: 'emoji_face_scale'; value: EmojiFaceScaleValue }
  | { type: 'number_input'; value: NumberInputValue }
  | { type: 'multi_number_input'; value: MultiNumberInputValue }
  | { type: 'free_text_note'; value: FreeTextNoteValue }
  | { type: 'voice_note'; value: VoiceNoteValue };

export type ValueForType<T extends ElementType> = Extract<ElementValue, { type: T }>['value'];
