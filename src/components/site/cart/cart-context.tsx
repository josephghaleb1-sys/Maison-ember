"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * The cart.
 *
 * It holds nothing but product ids and quantities. Names, prices and totals
 * shown in the UI come from what the server rendered, and the *charged* prices
 * are recalculated in Postgres when the order is placed — so a tampered cart
 * in localStorage can only change which products are ordered, never what they
 * cost.
 *
 * localStorage is an external store, so it's read through
 * useSyncExternalStore rather than an effect: no setState-during-effect, no
 * hydration mismatch (the server snapshot is always empty), and two tabs stay
 * in sync through the `storage` event. The key includes the business slug, so
 * previewing two businesses on one machine doesn't mix carts.
 */

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartSnapshot {
  lines: CartLine[];
  /** False until the stored cart has actually been read on the client. */
  ready: boolean;
}

const MAX_LINES = 50;
const MAX_QUANTITY = 99;

const EMPTY: CartSnapshot = { lines: [], ready: false };

function clampQuantity(value: number) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.round(value)));
}

function parseStored(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line): line is CartLine =>
          typeof (line as CartLine)?.productId === "string" &&
          Number.isFinite((line as CartLine)?.quantity),
      )
      .map((line) => ({ productId: line.productId, quantity: clampQuantity(line.quantity) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

interface CartStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CartSnapshot;
  getServerSnapshot: () => CartSnapshot;
  update: (next: (lines: CartLine[]) => CartLine[]) => void;
}

const stores = new Map<string, CartStore>();

function createStore(slug: string): CartStore {
  const key = `cart:${slug}`;
  const listeners = new Set<() => void>();
  let snapshot: CartSnapshot = EMPTY;
  let loaded = false;

  function emit() {
    for (const listener of listeners) listener();
  }

  function load() {
    if (loaded) return;
    loaded = true;
    try {
      snapshot = { lines: parseStored(window.localStorage.getItem(key)), ready: true };
    } catch {
      // Private mode or blocked storage: the cart just doesn't persist.
      snapshot = { lines: [], ready: true };
    }
    emit();
  }

  function persist(lines: CartLine[]) {
    try {
      window.localStorage.setItem(key, JSON.stringify(lines));
    } catch {
      // Ignore quota/permission failures; the in-memory cart still works.
    }
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key) return;
    snapshot = { lines: parseStored(event.newValue), ready: true };
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        window.addEventListener("storage", onStorage);
        load();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    getServerSnapshot() {
      return EMPTY;
    },
    update(next) {
      const lines = next(snapshot.lines).slice(0, MAX_LINES);
      snapshot = { lines, ready: true };
      persist(lines);
      emit();
    },
  };
}

function getStore(slug: string): CartStore {
  let store = stores.get(slug);
  if (!store) {
    store = createStore(slug);
    stores.set(slug, store);
  }
  return store;
}

interface CartContextValue {
  lines: CartLine[];
  /** Total number of units in the cart. */
  count: number;
  ready: boolean;
  isOpen: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const store = useMemo(() => getStore(slug), [slug]);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback(
    (productId: string, quantity = 1) => {
      store.update((lines) => {
        const existing = lines.find((line) => line.productId === productId);
        if (existing) {
          return lines.map((line) =>
            line.productId === productId
              ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
              : line,
          );
        }
        if (lines.length >= MAX_LINES) return lines;
        return [...lines, { productId, quantity: clampQuantity(quantity) }];
      });
    },
    [store],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      store.update((lines) =>
        quantity <= 0
          ? lines.filter((line) => line.productId !== productId)
          : lines.map((line) =>
              line.productId === productId
                ? { ...line, quantity: clampQuantity(quantity) }
                : line,
            ),
      );
    },
    [store],
  );

  const remove = useCallback(
    (productId: string) => {
      store.update((lines) => lines.filter((line) => line.productId !== productId));
    },
    [store],
  );

  const clear = useCallback(() => store.update(() => []), [store]);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: snapshot.lines,
      count: snapshot.lines.reduce((total, line) => total + line.quantity, 0),
      ready: snapshot.ready,
      isOpen,
      add,
      setQuantity,
      remove,
      clear,
      open,
      close,
    }),
    [snapshot, isOpen, add, setQuantity, remove, clear, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
