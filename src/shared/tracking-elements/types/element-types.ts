/**
 * Union type of all 19 tracking element type identifiers.
 * Shared contract between activity-builder (config), session-logging (interactive), and stats (display).
 */

export const ELEMENT_TYPES = [
  'counter',
  'tap_counter',
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
  counters: ['counter', 'tap_counter', 'combined_counter', 'split_counter', 'multistep_counter'] as const,
  timers: ['stopwatch', 'countdown_timer', 'lap_timer', 'interval_timer'] as const,
  selection: ['checklist', 'single_select', 'multi_select', 'yes_no', 'rating_scale', 'emoji_face_scale'] as const,
  input: ['number_input', 'multi_number_input', 'free_text_note', 'voice_note'] as const,
};

export type ElementCategory = keyof typeof ELEMENT_CATEGORIES;

export const ELEMENT_LABELS: Record<ElementType, string> = {
  counter: 'Counter',
  tap_counter: 'Tap Counter',
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

/** Layout width of an element within a drill. */
export type ElementWidth = 'full' | 'half';

/**
 * Which element types render correctly at half width (two per row). The
 * Full/Half toggle is only offered for types marked true, and the layout
 * clamps a stored `half` on a false type back to full — so the option can
 * never produce a broken layout. Flip a type to true once its session
 * component handles a narrow container.
 */
export const ELEMENT_SUPPORTS_HALF_WIDTH: Record<ElementType, boolean> = {
  counter: true,
  tap_counter: true,
  combined_counter: false,
  split_counter: false,
  multistep_counter: false,
  stopwatch: false,
  countdown_timer: false,
  lap_timer: false,
  interval_timer: false,
  checklist: false,
  single_select: false,
  multi_select: false,
  yes_no: false,
  rating_scale: false,
  emoji_face_scale: false,
  number_input: false,
  multi_number_input: false,
  free_text_note: false,
  voice_note: false,
};

export const ELEMENT_DESCRIPTIONS: Record<ElementType, string> = {
  counter: 'Tap + or − to count up.',
  tap_counter: 'Tap the card to count up; press and hold to remove one.',
  combined_counter: 'Tap + or − to count up and down, or type the number directly.',
  split_counter: 'Two counters side by side, like left/right.',
  multistep_counter: 'Step through a sequence to log one rep.',
  stopwatch: 'Start, pause, and reset a running timer.',
  countdown_timer: 'Counts down from a set duration.',
  lap_timer: 'Records lap times one tap at a time.',
  interval_timer: 'Alternates between work and rest periods.',
  checklist: 'Tick off items as they are completed.',
  single_select: 'Pick one option from a list.',
  multi_select: 'Pick any number of options from a list.',
  yes_no: 'A two-way toggle: yes or no.',
  rating_scale: 'Rate from 1 to N.',
  emoji_face_scale: 'Pick an emoji to express how it went.',
  number_input: 'Type a number directly.',
  multi_number_input: 'Type multiple numbers in labeled fields.',
  free_text_note: 'Write a free-form text note.',
  voice_note: 'Record a short audio note.',
};
