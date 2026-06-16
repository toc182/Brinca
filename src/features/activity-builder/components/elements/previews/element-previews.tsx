import type { ComponentType } from 'react';

import type { ElementType } from '@/shared/tracking-elements/types/element-types';

import {
  CombinedCounterPreview,
  CounterPreview,
  MultistepCounterPreview,
  SplitCounterPreview,
  TapCounterPreview,
} from './CounterPreviews';
import {
  CountdownTimerPreview,
  IntervalTimerPreview,
  LapTimerPreview,
  StopwatchPreview,
} from './TimerPreviews';
import {
  ChecklistPreview,
  EmojiFaceScalePreview,
  MultiSelectPreview,
  RatingScalePreview,
  SingleSelectPreview,
  YesNoPreview,
} from './SelectionPreviews';
import {
  FreeTextNotePreview,
  MultiNumberInputPreview,
  NumberInputPreview,
  VoiceNotePreview,
} from './InputPreviews';

/**
 * Registry mapping every tracking element type to a small preview component
 * shown in the element-picker info modal and picker cards. Typed as a full
 * `Record<ElementType, ComponentType>` so adding a new element type to
 * ELEMENT_TYPES fails type-check until its preview is registered here.
 */
export const ELEMENT_PREVIEWS: Record<ElementType, ComponentType> = {
  counter: CounterPreview,
  tap_counter: TapCounterPreview,
  combined_counter: CombinedCounterPreview,
  split_counter: SplitCounterPreview,
  multistep_counter: MultistepCounterPreview,
  stopwatch: StopwatchPreview,
  countdown_timer: CountdownTimerPreview,
  lap_timer: LapTimerPreview,
  interval_timer: IntervalTimerPreview,
  checklist: ChecklistPreview,
  single_select: SingleSelectPreview,
  multi_select: MultiSelectPreview,
  yes_no: YesNoPreview,
  rating_scale: RatingScalePreview,
  emoji_face_scale: EmojiFaceScalePreview,
  number_input: NumberInputPreview,
  multi_number_input: MultiNumberInputPreview,
  free_text_note: FreeTextNotePreview,
  voice_note: VoiceNotePreview,
};

export function ElementPreview({ type }: { type: ElementType }) {
  const Preview = ELEMENT_PREVIEWS[type];
  return <Preview />;
}
