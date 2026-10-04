"use client";

import { useEffect, useState } from "react";
import { useNavigating } from "./nav";
import PageSkeleton from "./Skel";

const GRACE_MS = 150;

export default function NavPending({ children }: { children: React.ReactNode }) {
  const navigating = useNavigating();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!navigating) return;
    const t = setTimeout(() => setShow(true), GRACE_MS);
    return () => {
      clearTimeout(t);
      setShow(false);
    };
  }, [navigating]);

  return (
    <>
      <div style={{ display: show ? "none" : "contents" }}>
        {children}
      </div>
      {show && <PageSkeleton />}
    </>
  );
}
