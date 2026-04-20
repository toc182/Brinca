/**
 * Union type of all 18 tracking element type identifiers.
 * Shared contract between activity-builder (config), session-logging (interactive), and stats (display).
 */

export const ELEMENT_TYPES = [
  'counter',
  'combined_counter',
  'split_counter',
  'multistep_counter',
  'stopwatch',
  'countdown_timer',
  'lap_timer',
  'interval_timer',
  'checklist',
  'single_select',
  'multi_select',
  'yes_no',
  'rating_scale',
  'emoji_face_scale',
  'number_input',
  'multi_number_input',
  'free_text_note',
  'voice_note',
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

export const ELEMENT_CATEGORIES = {
  counters: ['counter', 'combined_counter', 'split_counter', 'multistep_counter'] as const,
  timers: ['stopwatch', 'countdown_timer', 'lap_timer', 'interval_timer'] as const,
  selection: ['checklist', 'single_select', 'multi_select', 'yes_no', 'rating_scale', 'emoji_face_scale'] as const,
  input: ['number_input', 'multi_number_input', 'free_text_note', 'voice_note'] as const,
};

export type ElementCategory = keyof typeof ELEMENT_CATEGORIES;

export const ELEMENT_LABELS: Record<ElementType, string> = {
  counter: 'Counter',
  combined_counter: 'Combined Counter',
  split_counter: 'Split Counter',
  multistep_counter: 'Multistep Counter',
  stopwatch: 'Stopwatch',
  countdown_timer: 'Countdown Timer',
  lap_timer: 'Lap Timer',
  interval_timer: 'Interval Timer',
  checklist: 'Checklist',
  single_select: 'Single Select',
  multi_select: 'Multi-Select',
  yes_no: 'Yes / No',
  rating_scale: 'Rating Scale',
  emoji_face_scale: 'Emoji Face Scale',
  number_input: 'Number Input',
  multi_number_input: 'Multi-Number Input',
  free_text_note: 'Free Text Note',
  voice_note: 'Voice Note',
};
