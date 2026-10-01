"use client";

import { createContext, useContext } from "react";

const ScopeContext = createContext("");

/** Wraps a role's pages in the class its mockup-specific rules are scoped to
 *  (`.ia`), and carries that class into portaled modals and viewers. */
export default function Scope({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ScopeContext.Provider value={name}>
      <div className={name}>{children}</div>
    </ScopeContext.Provider>
  );
}

export function useScope() {
  return useContext(ScopeContext);
}

export function Scoped({ children }: { children: React.ReactNode }) {
  const scope = useScope();
  return scope ? <div className={scope}>{children}</div> : <>{children}</>;
}
