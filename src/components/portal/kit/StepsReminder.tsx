"use client";

import Btn from "./Btn";
import Modal from "./Modal";

export default function StepsReminder({
  title,
  sub,
  steps,
  doneLabel = "Got it",
  onClose,
}: {
  title: string;
  sub?: string;
  steps: { title: string; text: string }[];
  doneLabel?: string;
  onClose: () => void;
}) {
  return (
    <Modal title={title} sub={sub} onClose={onClose} footer={<Btn onClick={onClose}>{doneLabel}</Btn>}>
      <ol className="stepsr">
        {steps.map((s) => (
          <li key={s.title}>
            <div>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
