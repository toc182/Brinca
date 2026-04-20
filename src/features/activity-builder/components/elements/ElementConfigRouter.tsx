import type { ElementType } from '@/shared/tracking-elements/types/element-types';

import { CounterConfig } from './CounterConfig';
import { SplitCounterConfig } from './SplitCounterConfig';
import { MultistepCounterConfig } from './MultistepCounterConfig';
import { CountdownTimerConfig } from './CountdownTimerConfig';
import { IntervalTimerConfig } from './IntervalTimerConfig';
import { ChecklistConfig } from './ChecklistConfig';
import { SelectConfig } from './SelectConfig';
import { RatingScaleConfig } from './RatingScaleConfig';
import { EmojiFaceScaleConfig } from './EmojiFaceScaleConfig';
import { NumberInputConfig } from './NumberInputConfig';
import { VoiceNoteConfig } from './VoiceNoteConfig';
import { NoConfig } from './NoConfig';

interface ElementConfigRouterProps {
  elementId: string;
  type: ElementType;
  config: Record<string, unknown>;
  onConfigChange: () => void;
}

/**
 * Renders the correct config editor for the given element type.
 */
export function ElementConfigRouter({ elementId, type, config, onConfigChange }: ElementConfigRouterProps) {
  const props = { elementId, config, onConfigChange };

  switch (type) {
    case 'counter':
    case 'combined_counter':
      return <CounterConfig {...props} />;
    case 'split_counter':
      return <SplitCounterConfig {...props} />;
    case 'multistep_counter':
      return <MultistepCounterConfig {...props} />;
    case 'stopwatch':
    case 'lap_timer':
      return <NoConfig label="No configuration needed." />;
    case 'countdown_timer':
      return <CountdownTimerConfig {...props} />;
    case 'interval_timer':
      return <IntervalTimerConfig {...props} />;
    case 'checklist':
      return <ChecklistConfig {...props} />;
    case 'single_select':
    case 'multi_select':
      return <SelectConfig {...props} />;
    case 'yes_no':
      return <NoConfig label="No configuration needed." />;
    case 'rating_scale':
      return <RatingScaleConfig {...props} />;
    case 'emoji_face_scale':
      return <EmojiFaceScaleConfig {...props} />;
    case 'number_input':
    case 'multi_number_input':
      return <NumberInputConfig {...props} />;
    case 'free_text_note':
      return <NoConfig label="No configuration needed." />;
    case 'voice_note':
      return <VoiceNoteConfig {...props} />;
  }
}
