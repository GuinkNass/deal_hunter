export const ADMIN_EMAILS: string[] = [
  'guilherme.r.nascimento@live.com',
  'guilherme.r.nascimentoml@gmail.com',
];

/**
 * Verifica se um objeto de usuário possui privilégios de Administrador
 */
export function isUserAdmin(
  user?: {
    email?: string | null;
    role?: string | null;
    user_metadata?: any;
    app_metadata?: any;
  } | null
): boolean {
  if (!user) return false;

  const email = (user.email || '').toLowerCase().trim();
  if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email)) {
    return true;
  }

  if (user.role === 'admin' || user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
    return true;
  }

  return false;
}

/**
 * Valida no servidor se o token Bearer pertence a um Administrador autenticado
 */
export async function verifyAdminToken(
  supabase: any,
  token?: string | null
): Promise<{ isAdmin: boolean; userId: string | null; email: string | null }> {
  if (!token) {
    return { isAdmin: false, userId: null, email: null };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { isAdmin: false, userId: null, email: null };
    }

    const email = (user.email || '').toLowerCase().trim();
    if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email)) {
      return { isAdmin: true, userId: user.id, email: user.email || null };
    }

    if (user.role === 'admin' || user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin') {
      return { isAdmin: true, userId: user.id, email: user.email || null };
    }

    // Consulta perfil no banco de dados para checar se a role é 'admin'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      return { isAdmin: true, userId: user.id, email: user.email || null };
    }

    return { isAdmin: false, userId: user.id, email: user.email || null };
  } catch {
    return { isAdmin: false, userId: null, email: null };
  }
}
