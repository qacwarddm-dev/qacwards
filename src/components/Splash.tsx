"use client";

import { useEffect, useState } from "react";

const MESSAGES = ["Loading QAC-WARDS…", "Checking your account…", "Getting accreditation records…", "Preparing your dashboard…"];

export default function Splash({ messages = MESSAGES }: { messages?: string[] }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    let swap: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      setShown(false);
      swap = setTimeout(() => {
        setI((n) => (n + 1) % messages.length);
        setShown(true);
      }, 250);
    }, 1200);
    return () => {
      clearInterval(tick);
      clearTimeout(swap);
    };
  }, [messages.length]);

  return (
    <div className="q-splash" role="status" aria-live="polite" aria-busy="true">
      <div className="q-seal">
        <img src="/assets/logos/pup.png" alt="" width={84} height={84} />
      </div>
      <div className="q-brand">
        <small>Polytechnic University of the Philippines</small>
        <b>QUALITY ASSURANCE CENTER</b>
      </div>
      <div className="q-bar">
        <i />
      </div>
      <div className="q-msg" style={{ opacity: shown ? 1 : 0 }}>
        {messages[i]}
      </div>
    </div>
  );
}
