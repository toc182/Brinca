/**
 * Static catalog of 17 V1 accolades per rewards-levels-accolades.md §7.3.
 * Evaluated at Finish Session + "Big Win" at redemption.
 */

export interface AccoladeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'starter' | 'milestone' | 'long_game';
}

export const ACCOLADE_CATALOG: AccoladeDefinition[] = [
  { id: 'first_steps', name: 'First Steps', description: 'You finished your very first session!', icon: 'shoe.fill', tier: 'starter' },
  { id: 'coin_catcher', name: 'Coin Catcher', description: 'You earned your first coin!', icon: 'dollarsign.circle.fill', tier: 'starter' },
  { id: 'drill_starter', name: 'Drill Starter', description: 'You knocked out your first drill!', icon: 'checkmark.circle.fill', tier: 'starter' },
  { id: 'goal_setter', name: 'Goal Setter', description: 'You picked out your first reward to save for!', icon: 'gift.fill', tier: 'starter' },
  { id: 'big_win', name: 'Big Win', description: 'You earned your very first reward!', icon: 'star.fill', tier: 'starter' },
  { id: 'warm_up', name: 'Warm-Up', description: 'You came back for session number two!', icon: 'sparkles', tier: 'starter' },
  { id: 'on_a_roll', name: 'On a Roll', description: 'You practiced 5 days in a row!', icon: 'flame.fill', tier: 'milestone' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'You crushed 5 sessions this week!', icon: 'calendar.badge.checkmark', tier: 'milestone' },
  { id: 'deep_focus', name: 'Deep Focus', description: 'You stayed locked in for a 30-minute session!', icon: 'brain.head.profile', tier: 'milestone' },
  { id: 'double_digits', name: 'Double Digits', description: "You hit 10 sessions — that's real practice!", icon: '10.circle.fill', tier: 'milestone' },
  { id: 'drill_master', name: 'Drill Master', description: "You've finished 100 drills!", icon: 'target', tier: 'milestone' },
  { id: 'level_up', name: 'Level Up', description: 'You reached level 5!', icon: 'arrow.up.circle.fill', tier: 'milestone' },
  { id: 'unstoppable', name: 'Unstoppable', description: 'You practiced 30 days in a row!', icon: 'bolt.fill', tier: 'long_game' },
  { id: 'iron_streak', name: 'Iron Streak', description: 'You hit a 100-day streak — unreal!', icon: 'shield.lefthalf.filled', tier: 'long_game' },
  { id: 'half_a_thousand', name: 'Half a Thousand', description: 'You completed 500 drills!', icon: 'figure.run', tier: 'long_game' },
  { id: 'century_club', name: 'Century Club', description: 'You completed 100 sessions!', icon: 'rosette', tier: 'long_game' },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Your total earnings hit 10,000!', icon: 'crown.fill', tier: 'long_game' },
];

export function getAccoladeById(id: string): AccoladeDefinition | undefined {
  return ACCOLADE_CATALOG.find((a) => a.id === id);
}
