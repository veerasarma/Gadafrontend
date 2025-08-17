export function normalizeRoles(input: unknown, fallback?: unknown): string[] {
    if (Array.isArray(input)) return input as string[];
    if (typeof input === 'string' && input) return [input];
    if (Array.isArray(fallback)) return fallback as string[];
    if (typeof fallback === 'string' && fallback) return [fallback];
    return [];
  }
  
  export function hasAnyRole(user: any, allowed: string[]): boolean {
    // supports user.roles (array or string) OR user.role (single enum)
    const roles = normalizeRoles(user?.roles, user?.role);
    return roles.some(r => allowed.includes(r));
  }
  