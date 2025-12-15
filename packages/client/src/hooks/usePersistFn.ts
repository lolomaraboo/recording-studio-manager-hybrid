/**
 * usePersistFn Hook
 *
 * Alternative to useCallback that maintains a stable reference
 * while always using the latest function implementation.
 */

import { useRef } from "react";

type AnyFunction = (...args: unknown[]) => unknown;

export function usePersistFn<T extends AnyFunction>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T | null>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args: unknown[]) {
      return fnRef.current.apply(this, args);
    } as T;
  }

  return persistFn.current;
}
