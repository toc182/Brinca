import type { ElementType } from '@/shared/tracking-elements/types/element-types';

import { ChecklistAddConfig } from './ChecklistAddConfig';
import { CounterAddConfig } from './CounterAddConfig';
import { CountdownTimerAddConfig } from './CountdownTimerAddConfig';
import { EmojiFaceScaleAddConfig } from './EmojiFaceScaleAddConfig';
import { IntervalTimerAddConfig } from './IntervalTimerAddConfig';
import { LapTimerAddConfig } from './LapTimerAddConfig';
import { MultistepCounterAddConfig } from './MultistepCounterAddConfig';
import { RatingScaleAddConfig } from './RatingScaleAddConfig';
import { SelectAddConfig } from './SelectAddConfig';
import { SplitCounterAddConfig } from './SplitCounterAddConfig';
import { YesNoAddConfig } from './YesNoAddConfig';

interface ElementAddConfigRouterProps {
  type: ElementType;
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

/**
 * Renders the add-time config form for a given element type, used inside
 * the element-picker modal to let the user configure an element before
 * inserting it into the drill. Mirrors `ElementConfigRouter` but operates
 * on local state instead of mutating a persisted DB row.
 *
 * Types without an add-time form yet (or that need no configuration) return
 * null — the element gets `getDefaultConfig(type)` and can be edited later
 * in DrillEditScreen.
 */
export function ElementAddConfigRouter({ type, value, onChange }: ElementAddConfigRouterProps) {
  switch (type) {
    case 'counter':
    case 'combined_counter':
      return <CounterAddConfig value={value} onChange={onChange} />;
    case 'split_counter':
      return <SplitCounterAddConfig value={value} onChange={onChange} />;
    case 'multistep_counter':
      return <MultistepCounterAddConfig value={value} onChange={onChange} />;
    case 'countdown_timer':
      return <CountdownTimerAddConfig value={value} onChange={onChange} />;
    case 'lap_timer':
      return <LapTimerAddConfig value={value} onChange={onChange} />;
    case 'interval_timer':
      return <IntervalTimerAddConfig value={value} onChange={onChange} />;
    case 'checklist':
      return <ChecklistAddConfig value={value} onChange={onChange} />;
    case 'single_select':
    case 'multi_select':
      return <SelectAddConfig type={type} value={value} onChange={onChange} />;
    case 'yes_no':
      return <YesNoAddConfig value={value} onChange={onChange} />;
    case 'rating_scale':
      return <RatingScaleAddConfig value={value} onChange={onChange} />;
    case 'emoji_face_scale':
      return <EmojiFaceScaleAddConfig value={value} onChange={onChange} />;
    default:
      return null;
  }
}
