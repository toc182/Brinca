/**
 * Validation rules for element configs.
 * Used by the activity-builder to validate before saving.
 */

import type { ElementType } from './types/element-types';
import type * as Configs from './types/element-configs';

export function validateElementConfig(type: ElementType, config: unknown): string | null {
  const c = config as Record<string, unknown>;

  switch (type) {
    case 'counter':
    case 'combined_counter':
      return null; // No required fields

    case 'split_counter':
      if (!c.leftLabel || !c.rightLabel) return 'Left and right labels are required.';
      return null;

    case 'multistep_counter':
      if (!Array.isArray(c.substeps) || c.substeps.length === 0) return 'At least one substep is required.';
      return null;

    case 'stopwatch':
      return null;

    case 'countdown_timer':
      if (typeof c.durationSeconds !== 'number' || c.durationSeconds <= 0) return 'Duration must be greater than 0.';
      return null;

    case 'lap_timer':
      return null;

    case 'interval_timer':
      if (typeof c.workDurationSeconds !== 'number' || c.workDurationSeconds <= 0) return 'Work duration is required.';
      if (typeof c.restDurationSeconds !== 'number' || c.restDurationSeconds <= 0) return 'Rest duration is required.';
      if (typeof c.cycles !== 'number' || c.cycles <= 0) return 'Number of cycles is required.';
      return null;

    case 'checklist':
      if (!Array.isArray(c.items) || c.items.length === 0) return 'At least one checklist item is required.';
      return null;

    case 'single_select':
    case 'multi_select':
      if (!Array.isArray(c.options) || c.options.length < 2) return 'At least two options are required.';
      return null;

    case 'yes_no':
      return null;

    case 'rating_scale':
      if (typeof c.maxValue !== 'number' || c.maxValue < 3 || c.maxValue > 10) return 'Max value must be between 3 and 10.';
      return null;

    case 'emoji_face_scale':
      if (c.faceCount !== 3 && c.faceCount !== 5) return 'Face count must be 3 or 5.';
      return null;

    case 'number_input':
    case 'multi_number_input':
    case 'free_text_note':
      return null;

    case 'voice_note':
      if (typeof c.maxDurationSeconds !== 'number' || c.maxDurationSeconds <= 0) return 'Max duration is required.';
      return null;

    default:
      return `Unknown element type: ${type}`;
  }
}

export function getDefaultConfig(type: ElementType): Record<string, unknown> {
  switch (type) {
    case 'counter': return {};
    case 'combined_counter': return {};
    case 'split_counter': return { leftLabel: 'Left', rightLabel: 'Right' };
    case 'multistep_counter': return { substeps: ['Step 1'] };
    case 'stopwatch': return {};
    case 'countdown_timer': return { durationSeconds: 60 };
    case 'lap_timer': return {};
    case 'interval_timer': return { workDurationSeconds: 30, restDurationSeconds: 15, cycles: 5 };
    case 'checklist': return { items: [{ id: '1', name: 'Item 1' }] };
    case 'single_select': return { options: [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }] };
    case 'multi_select': return { options: [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }] };
    case 'yes_no': return {};
    case 'rating_scale': return { minValue: 1, maxValue: 5 };
    case 'emoji_face_scale': return { faceCount: 5 };
    case 'number_input': return {};
    case 'multi_number_input': return {};
    case 'free_text_note': return {};
    case 'voice_note': return { maxDurationSeconds: 180 };
  }
}
