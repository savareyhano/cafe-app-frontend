// localStorage can throw (private mode, blocked storage); every read and write falls back quietly.
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state lives for this page only */
  }
}

const RECENT_KEY = "recent-orders";

/** This device's orders, newest first, so the status page can list them. */
export const recentOrders = {
  list: () => readJson<string[]>(RECENT_KEY, []),
  // Only a new order goes to the front; viewing (and polling) an older one must not reorder it
  add: (id: string) => {
    const list = recentOrders.list();
    if (!list.includes(id)) writeJson(RECENT_KEY, [id, ...list].slice(0, 10));
  },
  set: (ids: string[]) => writeJson(RECENT_KEY, ids.slice(0, 10)),
};
