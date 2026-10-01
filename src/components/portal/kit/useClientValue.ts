"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

export default function useClientValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(noop, get, () => server);
}
