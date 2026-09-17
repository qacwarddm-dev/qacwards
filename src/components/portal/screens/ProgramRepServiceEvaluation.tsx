"use client";

import { useState } from "react";
import { Building2, Calendar, GraduationCap, Star, Target } from "lucide-react";
import { Button, Card, useToast } from "@/components/portal/kit";

/**
 * assets/new frames/feedback submissions/image.png — "QAC Service
 * Evaluation". Only "A. ASSISTANCE AND SUPPORT" is visible in the frame (two
 * statements); the category list is config-driven so the rest can be added
 * without touching the render, but nothing past what the frame shows is
 * invented here.
 *
 * The header numbers a statement's five stars 5-to-1, left to right — the
 * opposite of the conventional "fill from the left" star widget
 * (`StarRating`, used for read-only averages on QAC's Feedback screen) — so
 * each star is its own single-select toggle for the column it sits under
 * rather than a cumulative fill.
 */
const RATING_SCALE: [number, string][] = [
  [5, "Excellent"],
  [4, "Very Good"],
  [3, "Good"],
  [2, "Fair"],
  [1, "Poor"],
];

const CATEGORIES: { title: string; statements: string[] }[] = [
  {
    title: "A. ASSISTANCE AND SUPPORT",
    statements: [
      "QAC personnel provided adequate assistance throughout the accreditation process.",
      "QAC personnel were responsive to our questions and concerns.",
    ],
  },
];

export default function ProgramRepServiceEvaluation({
  program,
  campus,
  level,
  dateRange,
}: {
  program: string;
  campus: string;
  level: string;
  dateRange: string;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const total = CATEGORIES.reduce((n, c) => n + c.statements.length, 0);
  const answered = Object.keys(scores).length;

  function setScore(statement: string, value: number) {
    setScores((s) => ({ ...s, [statement]: value }));
  }

  function saveDraft() {
    toast.push({ tone: "info", title: "Draft saved." });
  }

  function submitEvaluation() {
    if (answered < total) {
      toast.push({
        tone: "warning",
        title: "A few ratings are still blank.",
        description: "Rate every statement before submitting.",
      });
      return;
    }
    setSubmitted(true);
    toast.push({ tone: "success", title: "Evaluation submitted. Thank you!" });
  }

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <Card className="px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <h1 className="text-heading font-bold leading-none text-black">QAC Service Evaluation</h1>
        <p className="mt-[14px] text-regular leading-relaxed text-black">
          Thank you for your participation in the accreditation process.
          <br />
          Please evaluate the assistance provided by QAC personnel during your program&apos;s
          accreditation.
        </p>

        <div className="mt-[20px] grid grid-cols-1 gap-[20px] rounded-[10px] border border-[color:var(--color-gray)]/25 p-[24px] sm:grid-cols-2">
          <InfoRow icon={GraduationCap} label="Program" value={program} />
          <InfoRow icon={Building2} label="Campus" value={campus} />
          <InfoRow icon={Target} label="Accreditation Level" value={level} />
          <InfoRow icon={Calendar} label="Accreditation Date" value={dateRange} />
        </div>

        <div className="mt-[20px] rounded-[10px] bg-[color:var(--tint-yellow)] px-[24px] py-[16px]">
          <p className="text-regular font-semibold text-maroon">Rating Scale:</p>
          <div className="mt-[6px] flex flex-wrap gap-x-[32px] gap-y-[4px] text-regular text-black">
            {RATING_SCALE.map(([n, label]) => (
              <span key={n}>
                {n} - {label}
              </span>
            ))}
          </div>
        </div>

        {CATEGORIES.map((category) => (
          <section key={category.title} className="mt-[26px]">
            <div className="flex items-center justify-between">
              <h2 className="text-regular font-bold text-maroon">{category.title}</h2>
              <div className="flex gap-[24px] pr-[8px] text-regular font-semibold text-black">
                {RATING_SCALE.map(([n]) => (
                  <span key={n} className="w-[20px] text-center">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-[10px] divide-y divide-[color:var(--color-gray)]/15 rounded-[10px] border border-[color:var(--color-gray)]/20">
              {category.statements.map((statement) => (
                <div key={statement} className="flex items-center justify-between gap-[16px] px-[20px] py-[16px]">
                  <p className="text-regular leading-relaxed text-black">{statement}</p>
                  <div className="flex shrink-0 gap-[24px]">
                    {RATING_SCALE.map(([n]) => {
                      const active = scores[statement] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={submitted}
                          onClick={() => setScore(statement, n)}
                          aria-label={`Rate "${statement}" ${n} out of 5`}
                          aria-pressed={active}
                          className="w-[20px] transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        >
                          <Star
                            width={20}
                            height={20}
                            strokeWidth={1.5}
                            className={active ? "fill-yellow text-yellow" : "text-[color:var(--color-gray)]/40"}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-[30px] flex justify-end gap-[14px]">
          <Button variant="secondary" onClick={saveDraft} disabled={submitted}>
            Save as Draft
          </Button>
          <Button variant="primary" onClick={submitEvaluation} disabled={submitted}>
            {submitted ? "Submitted" : "Submit Evaluation"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-[14px]">
      <Icon className="h-[22px] w-[22px] shrink-0 text-gray" strokeWidth={1.5} aria-hidden />
      <span>
        <span className="block text-small leading-none text-gray">{label}</span>
        <span className="mt-[4px] block text-regular font-semibold leading-none text-black">
          {value}
        </span>
      </span>
    </div>
  );
}
