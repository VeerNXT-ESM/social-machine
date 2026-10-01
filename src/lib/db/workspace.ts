import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Until user sign-in exists, every row belongs to one "workspace owner" account.
 * Rows must have an owner (see the RLS policies), so the account is created once through the
 * Supabase admin API and its id is cached. When sign-in is added, rows can be reassigned to real users.
 */
const WORKSPACE_EMAIL = 'workspace-owner@social-machine.app';

let cachedId: string | null = null;

export async function getWorkspaceUserId(): Promise<string> {
  if (cachedId) return cachedId;

  const fromEnv = process.env.WORKSPACE_USER_ID;
  if (fromEnv) return (cachedId = fromEnv);

  const supabase = createAdminClient();

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw new Error(`Could not list auth users: ${listError.message}`);
  const existing = list.users.find((u) => u.email === WORKSPACE_EMAIL);
  if (existing) return (cachedId = existing.id);

  const { data, error } = await supabase.auth.admin.createUser({
    email: WORKSPACE_EMAIL,
    email_confirm: true,
    password: crypto.randomUUID() + crypto.randomUUID(),
    user_metadata: { purpose: 'Shared workspace owner until sign-in is added' },
  });
  if (error || !data.user) throw new Error(`Could not create the workspace owner: ${error?.message}`);
  return (cachedId = data.user.id);
}
