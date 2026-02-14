import type { UserRole } from '@/types/user';

const VALID_ROLES: UserRole[] = ['user', 'author', 'reviewer', 'moderator', 'admin', 'owner'];

const VALID_ROLE_SET = new Set<UserRole>(VALID_ROLES);

type RoleCarrier =
  | {
      role?: string | null;
      roles?: string[] | null;
    }
  | null
  | undefined;

const normalizeRole = (role: string | null | undefined): UserRole | null => {
  if (!role) return null;
  const normalized = role.toLowerCase();
  if (normalized === 'mod') return 'moderator';
  if (VALID_ROLE_SET.has(normalized as UserRole)) return normalized as UserRole;
  return null;
};

const normalizeRoles = (roles: (string | null | undefined)[]) =>
  roles.map(normalizeRole).filter((role): role is UserRole => role !== null);

export const getUserRoles = (user: RoleCarrier): UserRole[] => {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const normalized = normalizeRoles(user.roles);
    if (normalized.length > 0) return normalized;
  }
  if (user.role) {
    return normalizeRoles([user.role]);
  }
  return [];
};

export const hasRole = (user: RoleCarrier, role: UserRole): boolean =>
  getUserRoles(user).includes(role);

export const hasAnyRole = (user: RoleCarrier, roles: UserRole[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.some(role => userRoles.includes(role));
};

export const isAdminLike = (user: RoleCarrier): boolean => hasAnyRole(user, ['admin', 'owner']);

export const isAdminOrModerator = (user: RoleCarrier): boolean =>
  hasAnyRole(user, ['admin', 'owner', 'moderator']);

export const isOwner = (user: RoleCarrier): boolean => hasAnyRole(user, ['owner']);
