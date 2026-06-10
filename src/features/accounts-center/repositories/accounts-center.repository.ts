import { supabase } from '@/lib/supabase/client';

export type FamilyRole = 'admin' | 'co-admin' | 'collaborator' | 'member';

/**
 * Read the current user from the cached session. Unlike `supabase.auth.getUser()`
 * — which validates the JWT against the auth server and can hang on a
 * slow / stalled refresh — this resolves locally from the stored session.
 * Use this for any read where RLS will re-verify the token on the server
 * anyway; reserve `getUser()` for places that explicitly need a fresh
 * server-side identity check.
 */
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user) throw new Error('No active session');
  return user;
}

const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Resolve an `avatar_url` column value into a renderable signed URL. The
 * `avatars` bucket is private, so `getPublicUrl()` returns a 403 URL —
 * native <Image> renders fail without auth. Newer uploads store just the
 * storage path; legacy rows still hold a public URL with the path embedded
 * (`.../object/public/avatars/<path>`), so we parse it out for those too.
 */
async function signAvatarUrl(stored: string | null): Promise<string | null> {
  if (!stored) return null;
  let path = stored;
  if (stored.startsWith('http')) {
    const marker = '/avatars/';
    const idx = stored.indexOf(marker);
    if (idx < 0) return null;
    path = stored.slice(idx + marker.length);
    // Strip any query string (signed URLs include ?token=, public URLs may
    // include cache busters) and decode percent-encoding.
    const qIdx = path.indexOf('?');
    if (qIdx >= 0) path = path.slice(0, qIdx);
    try {
      path = decodeURIComponent(path);
    } catch {
      // leave path as-is if decode fails
    }
  }
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export type PersonaType = 'parent' | 'therapist' | 'coach' | 'teacher' | 'other';

export interface ProfileData {
  id: string;
  displayId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  personaType: PersonaType | null;
}

export interface FamilyMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: FamilyRole;
}

export async function fetchProfile(): Promise<ProfileData> {
  const user = await getCurrentUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_id, display_name, avatar_url, persona_type')
    .eq('id', user.id)
    .single();
  if (profileError) throw profileError;

  return {
    id: user.id,
    displayId: profile.display_id,
    displayName: profile.display_name,
    email: user.email ?? '',
    avatarUrl: await signAvatarUrl(profile.avatar_url),
    personaType: (profile.persona_type as PersonaType | null) ?? null,
  };
}

export async function fetchFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id,
      user_id,
      role,
      profiles!inner (
        display_name,
        avatar_url
      )
    `)
    .eq('family_id', familyId);

  if (error) throw error;

  // Fetch emails from auth for each member — we need to join with auth.users
  // Since we can't query auth.users directly from client, we use the profile data
  // and get email from auth for the current user only. For other members,
  // we store email in a separate query via an RPC or just show profile data.
  const rows = data ?? [];
  const members: FamilyMember[] = await Promise.all(
    rows.map(async (row) => {
      const profile = row.profiles as unknown as {
        display_name: string;
        avatar_url: string | null;
      };
      return {
        id: row.id,
        userId: row.user_id,
        displayName: profile.display_name,
        email: '', // Email populated separately for detail screen
        avatarUrl: await signAvatarUrl(profile.avatar_url),
        role: row.role as FamilyRole,
      };
    }),
  );

  return members;
}

export async function fetchCurrentUserFamilyId(): Promise<string | null> {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data.family_id;
}

export async function fetchCurrentUserRole(familyId: string): Promise<FamilyRole> {
  const { data, error } = await supabase.rpc('get_family_role', {
    p_family_id: familyId,
  });
  if (error) throw error;
  return (data as string) as FamilyRole;
}

export async function updateProfileInfo(
  name: string,
  personaType: PersonaType | null,
): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name, persona_type: personaType })
    .eq('id', authData.user.id);
  if (error) throw error;
}

export async function updateEmail(newEmail: string, currentPassword: string): Promise<void> {
  // Re-authenticate with current password first
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authData.user.email ?? '',
    password: currentPassword,
  });
  if (signInError) throw new Error('Current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authData.user.email ?? '',
    password: currentPassword,
  });
  if (signInError) throw new Error('Current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function updateProfilePhoto(avatarUrl: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', authData.user.id);
  if (error) throw error;
}

/**
 * Upload a new profile photo to the (private) avatars bucket and return its
 * storage path — NOT a `getPublicUrl()` result, because the bucket is private
 * and that URL returns 403 in a request from <Image>. `fetchProfile` signs
 * the path on read; the column still ends up holding a path, which the
 * `signAvatarUrl` helper resolves into a renderable signed URL.
 */
export async function uploadProfilePhoto(uri: string): Promise<string> {
  const user = await getCurrentUser();

  const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
  // RN's fetch(file://).blob() returns an empty body when handed to
  // supabase-js — the Storage object lands but is 0 bytes. ArrayBuffer is
  // the documented RN-friendly path (see lib/sync/photo-upload-queue.ts).
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  return fileName;
}

export async function sendInvite(
  familyId: string,
  email: string,
  role: FamilyRole,
): Promise<void> {
  // Check if already a member
  const { data: existing } = await supabase
    .from('invites')
    .select('id')
    .eq('family_id', familyId)
    .eq('email', email.toLowerCase())
    .is('accepted_at', null)
    .maybeSingle();

  if (existing) {
    throw new Error('This person already has a pending invite.');
  }

  // Check if email belongs to existing family member
  // We check profiles + family_members join
  const { data: members } = await supabase
    .from('family_members')
    .select('user_id, profiles!inner(id)')
    .eq('family_id', familyId);

  if (members) {
    // Check auth users for this email — use edge function
    // For now, insert invite and let edge function handle validation
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const { error } = await supabase.from('invites').insert({
    family_id: familyId,
    email: email.toLowerCase(),
    role,
    invited_by: authData.user.id,
  });
  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      throw new Error('This person is already a member of your family.');
    }
    throw error;
  }

  // TODO: Call Edge Function to send invite email
  // await supabase.functions.invoke('send-invite-email', {
  //   body: { email: email.toLowerCase(), familyId, role },
  // });
}

export async function changeMemberRole(
  memberId: string,
  newRole: FamilyRole,
): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .update({ role: newRole })
    .eq('id', memberId);
  if (error) throw error;
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

export async function deleteAccount(): Promise<void> {
  // TODO: Call Edge Function for server-side data deletion
  // await supabase.functions.invoke('delete-account', {});

  await supabase.auth.signOut();
}

export async function fetchMemberEmail(userId: string): Promise<string> {
  // For the current user, we can get email from auth
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user?.id === userId) {
    return authData.user.email ?? '';
  }

  // For other users, we'd need an RPC or edge function
  // Since client can't query auth.users, return empty for now
  // The invite table has the email for invited users
  return '';
}
