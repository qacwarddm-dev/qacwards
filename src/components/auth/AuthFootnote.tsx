const SERVICES = ["For other PUP Services, kindly visit our site ", "www.pup.edu.ph"];
const TERMS =
  "By using this service, you understood and agree to the PUP Online Service";
const COPYRIGHT =
  "© 2025 Polytechnic University of the Philippines. All Rights Reserved.";

/**
 * Shared chrome under the auth card — extracted out of `AuthShell` (09a §B)
 * since it is the footnote content, not shell layout internals.
 *
 * The two login exports disagree: the block sits 14px higher on LoginForm.png
 * than on MainLogin.png even though both frames are 809 tall and the internal
 * spacing is identical. Owner's call (2026-07-23) was to normalise on
 * MainLogin's placement rather than carry a variant into `register/`.
 */
export default function AuthFootnote() {
  return (
    <div className="mt-auto mb-[8px] px-4 text-center text-gray">
      {/* Sizes are the token that renders closest, not the one cap height alone
          implies: the prototype's small text is set tighter than Inter's default
          tracking, so cap height reads ~5% larger than the ink run does. r1
          measures 10.8-11.4px between the two and ships at --text-small. */}
      <p className="text-small leading-none">
        {SERVICES[0]}
        <a href="https://www.pup.edu.ph" className="text-yellow underline">
          {SERVICES[1]}
        </a>
      </p>
      <p className="mt-[8px] text-micro leading-none">{TERMS}</p>
      <p className="mt-[8px] text-micro leading-none">
        <a href="#" className="text-yellow underline">
          Terms of Use
        </a>
        <span> and </span>
        <a href="#" className="text-yellow underline">
          Privacy Statement
        </a>
      </p>
      {/* Measures ~7.5px in the frame; --text-micro (9px) is the smallest token,
          so this line ships ~20% wider than the prototype. Flagged. */}
      <p className="mt-[41px] text-micro leading-none">{COPYRIGHT}</p>
    </div>
  );
}
