import { supabase } from './client';
import { getDatabase } from '@/lib/sqlite/db';
import { ensureLocalFKChain } from '@/lib/sync/rehydrate';
import type { UUID } from '@/types/domain.types';

export type AuthRecoveryResult =
  | { state: 'authenticated'; childId: UUID; familyId: UUID; childName: string }
  | { state: 'onboarding-child'; pendingFamilyId?: UUID };

export async function ensureFKChainAndVerify(
  childId: UUID,
  familyId: UUID,
  childName: string | null | undefined,
): Promise<void> {
  await ensureLocalFKChain(childId, familyId, childName);
  const db = await getDatabase();
  const childRow = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM children WHERE id = ?',
    childId,
  );
  if (!childRow) {
    throw new Error(`FK chain incomplete: child row missing for ${childId}`);
  }
}

export async function resolveAuthFromUser(userId: UUID): Promise<AuthRecoveryResult> {
  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .limit(1);
  if (membersError) throw membersError;
  if (!members || members.length === 0) {
    return { state: 'onboarding-child' };
  }

  const familyId = members[0].family_id;

  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('id, name')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (childrenError) throw childrenError;
  if (!children || children.length === 0) {
    return { state: 'onboarding-child', pendingFamilyId: familyId };
  }

  const child = children[0];
  await ensureFKChainAndVerify(child.id, familyId, child.name);

  return {
    state: 'authenticated',
    childId: child.id,
    familyId,
    childName: child.name,
  };
}
