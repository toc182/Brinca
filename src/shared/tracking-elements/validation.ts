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

export function getDefaultValue(type: ElementType): Record<string, unknown> {
  switch (type) {
    case 'counter': return { count: 0 };
    case 'combined_counter': return { count: 0 };
    case 'split_counter': return { left: 0, right: 0 };
    case 'multistep_counter': return { reps: 0 };
    case 'stopwatch': return { elapsed_seconds: 0 };
    case 'countdown_timer': return { remaining_seconds: 0, elapsed_seconds: 0 };
    case 'lap_timer': return { laps: [], total_elapsed: 0 };
    case 'interval_timer': return { completed_cycles: 0, total_elapsed: 0, skipped_phases: 0 };
    case 'checklist': return { items: [] };
    case 'single_select': return { selected: null };
    case 'multi_select': return { selected: [] };
    case 'yes_no': return { answer: null };
    case 'rating_scale': return { value: null };
    case 'emoji_face_scale': return { value: null };
    case 'number_input': return { value: null };
    case 'multi_number_input': return { values: [] };
    case 'free_text_note': return { text: '' };
    case 'voice_note': return { file_uri: '', duration_seconds: 0 };
  }
}

/**
 * Returns true if the recorded value meets the element's configured target.
 * Used to light up the green check corner badge on the drill screen.
 */
export function isTargetMet(type: ElementType, config: Record<string, unknown>, value: Record<string, unknown>): boolean {
  switch (type) {
    case 'counter':
    case 'combined_counter':
      return config.target != null && (value.count as number) >= (config.target as number);
    case 'split_counter': {
      const leftOk = config.targetLeft == null || (value.left as number) >= (config.targetLeft as number);
      const rightOk = config.targetRight == null || (value.right as number) >= (config.targetRight as number);
      return leftOk && rightOk;
    }
    case 'multistep_counter':
      return config.targetReps != null && (value.reps as number) >= (config.targetReps as number);
    case 'stopwatch':
      return config.targetSeconds != null && (value.elapsed_seconds as number) >= (config.targetSeconds as number);
    case 'countdown_timer':
      return (value.remaining_seconds as number) <= 0;
    case 'lap_timer':
      return config.targetLaps != null && ((value.laps as unknown[]).length) >= (config.targetLaps as number);
    case 'interval_timer':
      return (value.completed_cycles as number) >= (config.cycles as number);
    case 'checklist': {
      const items = value.items as Array<{ checked?: boolean }> ?? [];
      const checkedCount = items.filter((i) => i.checked).length;
      return config.targetItems != null ? checkedCount >= (config.targetItems as number) : checkedCount > 0;
    }
    case 'single_select':
      return config.targetOptionId != null && value.selected === config.targetOptionId;
    case 'multi_select': {
      const sel = value.selected as string[] ?? [];
      return config.targetCount != null ? sel.length >= (config.targetCount as number) : sel.length > 0;
    }
    case 'yes_no':
      return config.targetAnswer != null && value.answer === config.targetAnswer;
    case 'rating_scale':
      return config.targetValue != null && value.value != null && (value.value as number) >= (config.targetValue as number);
    case 'emoji_face_scale':
      return config.targetValue != null && value.value != null && (value.value as number) >= (config.targetValue as number);
    case 'number_input':
      return config.targetValue != null && value.value != null && (value.value as number) >= (config.targetValue as number);
    case 'multi_number_input': {
      const vals = value.values as number[] ?? [];
      return config.targetEntries != null ? vals.length >= (config.targetEntries as number) : vals.length > 0;
    }
    case 'free_text_note':
      return typeof value.text === 'string' && value.text.length > 0;
    case 'voice_note':
      return typeof value.file_uri === 'string' && value.file_uri.length > 0;
    default:
      return false;
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
