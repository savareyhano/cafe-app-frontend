import { redirect } from "react-router";
import { api, ApiError } from "~/lib/api";
import type { Role, User } from "~/lib/types";

// One /users/me request per session; cleared on login, logout and any 401.
let current: Promise<User> | null = null;

export function clearSession() {
  current = null;
}

export async function requireUser(roles?: Role[]): Promise<User> {
  current ??= api.me();
  try {
    const user = await current;
    if (roles && !roles.includes(user.role)) throw redirect("/cms/pesanan");
    return user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      clearSession();
      throw redirect("/cms/masuk");
    }
    current = null;
    throw e;
  }
}

export const ADMIN: Role[] = ["admin", "super_admin"];
export const isAdmin = (u: User) => ADMIN.includes(u.role);

/** Wraps a CMS mutation: on 401 the session is gone, so go to sign-in. */
export function onAuthError(e: unknown, navigate: (to: string) => void) {
  if (e instanceof ApiError && e.status === 401) {
    clearSession();
    navigate("/cms/masuk");
    return true;
  }
  return false;
}
