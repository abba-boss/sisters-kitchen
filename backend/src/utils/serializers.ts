import { User } from "../entities/User";

/**
 * The only user fields that are ever safe to hand to another user's browser.
 * Emails, phone numbers, addresses and account flags stay server-side.
 */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role?: string;
}

export function publicUser(user?: Partial<User> | null): PublicUser | null {
  if (!user || !user.id) return null;

  return {
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    avatar: user.avatar ?? null,
  };
}

export function publicUsers(users?: Array<Partial<User> | null> | null): PublicUser[] {
  return (users ?? []).map((user) => publicUser(user)).filter(Boolean) as PublicUser[];
}

/**
 * Replace a nested `user` relation with its public projection, leaving the rest
 * of the payload untouched.
 */
export function withPublicUser<T extends { user?: Partial<User> | null }>(entity: T): T & { user: PublicUser | null } {
  return { ...entity, user: publicUser(entity?.user) };
}
