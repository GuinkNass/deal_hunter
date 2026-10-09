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

    if (!error && user) {
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
    }

    // Fallback de contingência: decodifica o payload do JWT se o backend Supabase oscilar ou estiver inacessível
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(json);
        const jwtEmail = (payload.email || payload.user_metadata?.email || '').toLowerCase().trim();
        const jwtUserId = payload.sub || payload.id || null;

        if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === jwtEmail)) {
          return { isAdmin: true, userId: jwtUserId, email: jwtEmail };
        }

        if (payload.role === 'admin' || payload.user_metadata?.role === 'admin' || payload.app_metadata?.role === 'admin') {
          return { isAdmin: true, userId: jwtUserId, email: jwtEmail || null };
        }
      }
    } catch {}

    return { isAdmin: false, userId: null, email: null };
  } catch {
    // Tentativa final via JWT payload mesmo se o cliente supabase disparar exceção
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(json);
        const jwtEmail = (payload.email || payload.user_metadata?.email || '').toLowerCase().trim();
        const jwtUserId = payload.sub || payload.id || null;

        if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === jwtEmail)) {
          return { isAdmin: true, userId: jwtUserId, email: jwtEmail };
        }
      }
    } catch {}
    return { isAdmin: false, userId: null, email: null };
  }
}
