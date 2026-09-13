import type { Metadata } from "next";
import Image from "next/image";

import {
  PageHero,
  PersonCard,
  Section,
  SectionIntro,
} from "@/components/public";

export const metadata: Metadata = {
  title: "About | PUP Quality Assurance Center",
  description:
    "The Quality Assurance Center of the Polytechnic University of the Philippines — its officials and staff, mandate, core functions, goals, objectives and history.",
};

// Portraits ship from the client with a 5px frame already baked into the PNG,
// so the frame colour is part of the file, not a CSS border.

const PORTRAIT_SHADOW = "shadow-[6px_6px_11px_rgba(0,0,0,0.25)]";

const DIRECTOR_MESSAGE = [
  "Today is indeed a very exciting and challenging time to be in the Academic Sector particularly in Higher Education because of the many developments and opportunities that are currently taking place",
  "The K-12 Transition which changed the landscape of our educational system aimed at enhancing the competitiveness of our graduates: the internationalization of education which facilitates the mobility of students and faculty, of researches and technology as well as credit transfer; the competition for higher SUC budget through normative financing; the SUC Levelling and the Strategic Performance Management System (SPMS) standards; the application for Center of Development and Center of Excellence; the employability of our graduates, locally and globally, to mention a few.",
  "Consequently, these challenges inevitably become a challenge also to our educational administrators, to our faculty and students, and to all our stakeholders, to continuously enhance the competitiveness, relevance and responsiveness of our institution and its academic programs.",
  "At the Center of all these is our Quality Assurance System. Recognizing that quality assurance is a holistic, participatory and collaborative process, the PUP Quality Assurance Center endeavors to better engage the",
];

type Official = {
  name: string;
  role: string;
  photo: string;
  width: number;
  height: number;
};

const DIRECTOR: Official = {
  name: "SANJAY P. CLAUDIO MNSA, CESE",
  role: "Director",
  photo: "/assets/employees/claudio-framed.png",
  width: 279,
  height: 399,
};

const ASSISTANT_DIRECTORS: Official[] = [
  {
    name: "PERLA D. CARPIO, MAF",
    role: "Asst. Director for Program Quality Assurance and Curriculum Development",
    photo: "/assets/employees/carpio.png",
    width: 233,
    height: 310,
  },
  {
    name: "REBECCA E. PALMA, MBE",
    role: "Asst. Director for Institutional and International Quality Assurance",
    photo: "/assets/employees/palma.png",
    width: 233,
    height: 310,
  },
];

const CHIEFS: Official[] = [
  {
    name: "MARY JOY A. CASTILLO, MAF",
    role: "Chief, Quality Assurance for Main Campus",
    photo: "/assets/employees/castillo.png",
    width: 233,
    height: 310,
  },
  {
    name: "LUISITO L. LACATAN, PhD",
    role: "Chief, Outcomes-Based Education and Continuous Quality Improvement",
    photo: "/assets/employees/lacatan.png",
    width: 233,
    height: 310,
  },
  {
    name: "CHRIST MICHAEL C. ENTIENZA, MP",
    role: "Chief, Institutional Accreditation and Sustainability",
    photo: "/assets/employees/entienza.png",
    width: 233,
    height: 310,
  },
  {
    name: "MARY GRACE F. YEBRA",
    role: "Chief, International Quality Assurance",
    photo: "/assets/employees/yebra.png",
    width: 233,
    height: 310,
  },
];

const COORDINATORS: Official[] = [
  {
    name: "ROSIELYN DJ. LOMTONG, MAF",
    role: "Quality Assurance Coordinator",
    photo: "/assets/employees/lomtong.png",
    width: 233,
    height: 310,
  },
  {
    name: "JOHN MARK S. DISTOR, PhD",
    role: "Quality Assurance Coordinator",
    photo: "/assets/employees/distor.png",
    width: 233,
    height: 310,
  },
  {
    name: "CHRISTIAN PAUL B. TRANCE",
    role: "Quality Assurance Coordinator",
    photo: "/assets/employees/trance.png",
    width: 233,
    height: 310,
  },
];

const ADMINISTRATIVE_STAFF: Official[] = [
  {
    name: "LORENA V. DELOS REYES",
    role: "Administrative Staff",
    photo: "/assets/employees/delos-reyes.png",
    width: 233,
    height: 310,
  },
  {
    name: "EMELIE D. TATON, MPA",
    role: "Administrative Staff",
    photo: "/assets/employees/taton.png",
    width: 233,
    height: 310,
  },
  {
    name: "PAUL ANTHONY B. BACON",
    role: "Administrative Staff",
    photo: "/assets/employees/bacon.png",
    width: 233,
    height: 310,
  },
];

const OVERVIEW = [
  "The Polytechnic University of the Philippines (PUP) has been a pioneer in providing quality education, overcoming challenges and embracing changes in the educational system. In 1987, the university submitted its selected programs for accreditation, with 16 accredited programs by 2006. By 2007, four programs passed the Level 3, Phase 2 visit, awarding Level 3 Re-accredited status.",
  "In 2008, PUP established the Quality Assurance Center (QAC) under the PUP: A Total University vision of former president Dr. Dante G. Guevarra. The center’s first director, Dr. Adela Jamorabo-Ruiz, supervised QAC as concurrent director of the Curriculum Planning and Development office. By 2010, 22 programs qualified for level 3 programs, and 27 level 2 re-accredited programs.",
  "In 2012, Dr. Emanuel C. De Guzman appointed colleges to vie for CHED’s Center of Development and Center of Excellence recognition. The first four level 3 re-accredited programs, ABE, ABF, BAJ, and BBRC, applied for COD. By 2014, 58 programs had reached accreditation level status.",
  "To date, PUP has 84 accredited programs from the main campus and branches, with 35 level 3 re-accredited status, 16 level 2 re-accredited status, 9 level 1 accredited status, and 24 preliminary survey visit passers and candidates for level 1 accreditation. In 2018, PUP submitted an unprecedented 72 programs for accreditation.",
  "QAC also facilitates the Certificate of Program Compliance (COPC) of CHED, having submitted 77 programs to CHED Regional Quality Accreditation Teams.",
];

const CORE_FUNCTIONS = [
  "Assist the academic sector in the preparation and packaging of documents to effectively facilitate the accreditation, government recognition and assessment of academic programs;",
  "enhance the institutions capacity in designing, delivering and managing curricular programs and services to achieve quality learning outcomes;",
  "identify areas for reform and/or continuous improvement along the key areas of governance and management, quality of teaching and learning, relations with the community and management of resources;",
  "provide basis for policy options and informed decisions for development assistance to the Colleges, Branches and Campuses;",
  "effectively communicate current and relevant information about the achievements, quality system and processes of the university and its academic programs; and",
  "partner with local and international agencies for quality assurance-related projects and activities.",
];

const GOALS = [
  "excellence in institutional and program management;",
  "excellence in capacity development for continuous quality improvement; and",
  "excellence in partnership for institutional and program development.",
];

const OBJECTIVES = [
  "develop and maintain an effective internal quality assurance system;",
  "secure Certificate of Program Compliance and attain higher accreditation status for all academic programs;",
  "attain Center of Development and Center of Excellence status for priority programs;",
  "strengthen collaborative arrangements with internal and external stakeholders;",
  "maintain an efficient, secure, and accessible database of updated, comprehensive and relevant materials for quality assurance;",
  "develop and implement capacity building interventions to improve the teaching and learning process; and",
  "rationalize academic programs offering.",
];

const HISTORY = [
  "The Polytechnic University of the Philippines, as one of the largest state universities in the country, has been a pioneer in providing quality education. It has heeded challenges and surpassed changes in the educational system. It was one of the first institutions which believed in the significance of quality assurance. In as early as 1987 when AACCUP was founded, the University had already submitted its selected programs for accreditation.",
  "The process of accreditation back then was the direct responsibility of colleges applying for accreditation as they administer the local accreditation centers with their own college accreditation coordinators. By 2006, there were sixteen (16) accredited programs: 10 level 2; 2 level 1; and 4 which qualified for level 3 accreditation. The following year, 2007, four programs successfully passed the Level 3, Phase 2 visit. The Bachelor of Arts in English, Bachelor of Arts in Filipinology, Bachelor in Journalism, and Bachelor in Broadcast Communication were eventually awarded the Level 3 Re-accredited status. This was a milestone in the accreditation history of both PUP and AACCUP since only a few programs had reached the same level at that time.",
  "When the Commission on Higher Education (CHED) released CMO No. 15, Series of 2005 which institutionalizes monitoring and evaluation of all higher education institutions in the country, PUP responded to that call. In 2008, under the PUP: A Total University vision of former PUP president, Dr. Dante G. Guevarra, PUP established the Quality Assurance Center (QAC).",
  "Like any other office, QAC had a humble beginning. Its first director, Dr. Adela Jamorabo-Ruiz, former dean of the College of Nutrition and Food Science (CNFS), supervised QAC as concurrent director of the Curriculum Planning and Development (CPD) office. It was also in 2008 when the University was recognized for having the highest number of AACCUP accredited degree programs among SUCs with five level 1; 21 level 2; 13 qualified for level 3 programs, and 4 level 3 re-accredited programs.",
  "In 2009, Dr. Guevarra housed the Quality Assurance Center at the ground floor of the Ninoy Aquino Library and Learning Resource Center (NALLRC). During this time, he also appointed assistant to the vice president for academic affairs (AVPAA) Dr. Milagrina A. Gomez to be QAC’s new director. It was a big challenge for Dr. Gomez because the Center was sought to be seat of all accreditation operation of the University. Most of the programs offered by Pup were subjected to AACCUP accreditation. From the 13 in 2008, there were already 22 qualified for level 3 programs in 2010. On the other hand, from 22 level 2 re-accredited to 27 level 2 re-accredited programs also in the same year.",
  "In 2012, when Dr. Emanuel C. De Guzman was appointed university president, colleges were encouraged to vie for CHED’s Center of Development and Center of Excellence recognition. Particularly, the first four level 3 re-accredited programs, ABE, ABF, BAJ, and BBRC, applied for COD. Also in the same year, Dr. Ruiz returned as QAC director. The Bachelor of Arts in Filipinology and Bachelor in Journalism were awarded the COD in 2013. As the submission for accreditation continued, by 2014, 58 programs had reached accreditation level status. Level 2 Re-accredited status had been awarded to 38 programs, 15 of which were qualified for level 3; 9 programs were undergoing qualification for level 3 status; 14 level 2 re-accredited; 11 level 1 re-accredited; and 5 preliminary visit passers and candidates for level 1.",
  "To strengthen quality assurance in the University, QAC started submitting programs from selected PUP Branches for preliminary survey visit for Level 1 in 2015. Among the first branches to apply were PUP Mulanay, Quezon and PUP Taguig. The QAC today operates under a revised organizational structure to meet the challenges of its expanded mandate. Through the dynamic leadership of its director, Dr. Sanjay P. Claudio, the QAC Team works at strengthening both the University’s internal and external quality assurance systems. Since quality assurance’s scope includes all academic quality assessment, the curriculum of planning and development is placed under the center with Dr. Frederick O. Ramos as its chief. Prof. Rebecca E. Palma and Prof. Mary Joy A. Castillo are designated chief for main campus quality assurance and chief for PUP Branches and Campuses quality assurance, respectively. In addition, Prof. Teresa V. Mobilla and Prof. Rosielyn J. Lomtong serve as accreditation coordinators while Prof. Mary Grace L. Ferrer functions as faculty coordinator. Ms. Emelie D. Taton and Ms. Lorena V. Delos Reyes join as administrative staff members.",
  "To date, PUP has 84 accredited programs from the main campus and branches: 35 level 3 re-accredited status, 16 level 2 re-accredited status, 9 level 1 accredited status, and 24 preliminary survey visit passers and are candidate for level 1 accreditation. In 2018 alone, PUP is submitting an unprecedented 72 programs for accreditation, the highest submission in the accreditation history of the University. Along with AACCUP accreditation, QAC also facilitates the Certificate of Program Compliance (COPC) of CHED. The Center has submitted a total of 77 programs to CHED Regional Quality Accreditation Teams as of June 2018. Before the start of School Year 2018-2019, all programs in the undergraduate level were subjected and had passed the University Curriculum Evaluation Committee with all revised, renamed, and new program offerings duly approved by the PUP Board of Regents.",
  "With these accomplishments, QAC is proud to proclaim that with the well-defined core functions, goals, and objectives, best practices, the Center is on the right track in attaining its vision of nurturing a culture of quality in the University.",
];


/**
 * About — the site's long-form page, and the one the redesign changed most.
 *
 * What was dated:
 *
 * - **A floated portrait.** `sm:float-left sm:mr-[62px]` around a 279px image
 *   with justified 15px copy wrapping it. Text wrap around a float has no
 *   responsive story between 640 and 1024 — the measure collapses to a few
 *   words a line. It is a two-column grid now, and the portrait is sticky on
 *   desktop so it stays with the message it belongs to.
 * - **Ten identical `text-title` headings** down a ~4,000px page with nothing
 *   to tell them apart. Each major part now carries a section marker, an
 *   eyebrow and its own band tone, so the page has a spine.
 * - **A hand-tuned portrait wall**: `flex-wrap` with `gap-x-[106px]` for the
 *   four chiefs and `gap-x-[130px]` for the threes, plus a fixed `w-[233px]`
 *   and an `xl:whitespace-nowrap` on the names. It reflowed into orphans at
 *   most widths. A real grid replaces it.
 * - **Two un-tokenised hex values** (`#FFF8DC` band, `#E1C16E` rule) that
 *   shipped with a "flagged for the client" comment. Both are gone: the band is
 *   `--tint-yellow` and the rules are `--color-yellow`, so the page no longer
 *   holds colours outside design/figma-tokens.md.
 * - **Justified body copy** (`sm:text-justify`) at 15px across 1152px, which
 *   produced rivers and ~150-character lines. Copy now runs ragged-right at
 *   `--prose-max`.
 */
export default function AboutPage() {
  return (
    <div>
      <PageHero
        image="/assets/imagery/about-us.jpg"
        width={2048}
        height={1364}
        art="photo"
        alt="The Quality Assurance Center team"
        eyebrow="About"
        title="Quality Assurance Center"
        lede="The office that carries accreditation, government recognition and continuous quality improvement for the Polytechnic University of the Philippines."
        focus="center 18%"
        priority
      />

      <Section>
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-[var(--space-11)]">
          <div className="lg:sticky lg:top-[calc(var(--bar-h)+var(--space-6))] lg:self-start">
            <Image
              src="/assets/employees/claudio.png"
              alt=""
              width={279}
              height={399}
              sizes="(min-width: 1024px) 280px, 60vw"
              className={`w-[200px] max-w-full sm:w-[240px] lg:w-full ${PORTRAIT_SHADOW}`}
            />
            <span aria-hidden className="mt-6 block h-[2px] w-12 bg-yellow" />
            <p className="t-h1 mt-4 text-maroon">Sanjay P. Claudio, DPA</p>
            <p className="t-sm mt-1 text-black/70">Director</p>
          </div>

          <div>
            <SectionIntro
              index="01"
              eyebrow="Foreword"
              title="Message from the QAC Director"
              as="h2"
            />
            <div className="prose-public mt-[var(--space-7)] max-w-[var(--prose-max)]">
              {DIRECTOR_MESSAGE.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
            <p className="t-body-strong mt-[var(--space-7)] font-pup text-maroon">
              Sanjay P. Claudio, DPA
            </p>
          </div>
        </div>
      </Section>

      <Section id="officials" tone="tint">
        <SectionIntro
          index="02"
          eyebrow="The team"
          title="Officials and Staff"
          lede="Thirteen people carry the Center's work across the main campus, the branches and its international partnerships."
          as="h2"
        />

        <div className="mt-[var(--space-9)] grid grid-cols-2 gap-[var(--space-7)] lg:grid-cols-4">
          <PersonCard person={DIRECTOR} />
          {ASSISTANT_DIRECTORS.map((person) => (
            <PersonCard key={person.name} person={person} />
          ))}
        </div>

        {[
          { heading: "Chiefs", people: CHIEFS },
          { heading: "Quality Assurance Coordinators", people: COORDINATORS },
          { heading: "Administrative Staff", people: ADMINISTRATIVE_STAFF },
        ].map((group) => (
          <div key={group.heading} className="mt-[var(--space-11)]">
            <h3 className="t-eyebrow flex items-center gap-4 text-maroon">
              {group.heading}
              <span aria-hidden className="h-px flex-1 bg-maroon/25" />
            </h3>
            <div className="mt-[var(--space-7)] grid gap-[var(--space-7)] grid-cols-2 lg:grid-cols-4">
              {group.people.map((person) => (
                <PersonCard key={person.name} person={person} />
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section tone="maroon">
        <SectionIntro
          index="03"
          eyebrow="What we are for"
          title="Mission and Vision"
          as="h2"
          onDark
        />
        <div className="mt-[var(--space-8)] grid gap-[var(--space-8)] lg:grid-cols-2 lg:gap-[var(--space-11)]">
          <div>
            <h3 className="t-eyebrow text-yellow">Mission</h3>
            <p className="t-lead mt-4 text-white">
              Advance an inclusive, equitable, and globally relevant polytechnic
              education towards national development.
            </p>
          </div>
          <div>
            <h3 className="t-eyebrow text-yellow">Vision</h3>
            <p className="t-lead mt-4 text-white">
              Provide quality education through instruction, advance research and
              extension services. Produce world-class professionals as potential
              industry leaders and job providers. Develop and produce facilities
              through the use of adapted technology and indigenous materials.
            </p>
          </div>
        </div>
      </Section>

      <figure className="relative">
        <div className="relative aspect-[3/2] w-full sm:aspect-[21/9] lg:aspect-[1154/380]">
          <Image
            src="/assets/imagery/about-vision.jpg"
            alt="Aerial view of the PUP Main Campus"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-yellow" />
      </figure>

      <Section>
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-[var(--space-11)]">
          <div className="lg:sticky lg:top-[calc(var(--bar-h)+var(--space-6))] lg:self-start">
            <SectionIntro
              index="04"
              eyebrow="Remit"
              title="Mandate"
              as="h2"
            />
          </div>

          <div className="max-w-[var(--prose-max)]">
            <div className="prose-public">
              {OVERVIEW.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            {[
              {
                heading: "Core Functions",
                lede: "The QAC\u2019s primary roles are to:",
                items: CORE_FUNCTIONS,
                ordered: true,
              },
              {
                heading: "Goals",
                lede: "The QAC endeavors to achieve:",
                items: GOALS,
                ordered: true,
              },
              {
                heading: "Objectives",
                lede: "Towards these ends, the QAC commits to:",
                items: OBJECTIVES,
                ordered: false,
              },
            ].map((block) => (
              <div key={block.heading} className="mt-[var(--space-11)]">
                <h3 className="t-h1 font-qac text-maroon">{block.heading}</h3>
                <span aria-hidden className="mt-3 block h-[2px] w-10 bg-yellow" />
                <div className="prose-public mt-[var(--space-5)]">
                  <p>{block.lede}</p>
                  {block.ordered ? (
                    <ol>
                      {block.items.map((item) => (
                        <li key={item.slice(0, 32)}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul>
                      {block.items.map((item) => (
                        <li key={item.slice(0, 32)}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-[var(--space-11)]">
          <div className="lg:sticky lg:top-[calc(var(--bar-h)+var(--space-6))] lg:self-start">
            <SectionIntro
              index="05"
              eyebrow="Since 1987"
              title="History"
              lede="From the first programs submitted for accreditation to 84 accredited today."
              as="h2"
            />
          </div>

          {/* The drop cap is the one piece of ornament on the page, and it is
              doing a job: it marks where a nine-paragraph read begins. */}
          <div className="prose-public max-w-[var(--prose-max)] [&>p:first-child]:first-letter:mr-2 [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:font-pup [&>p:first-child]:first-letter:text-title [&>p:first-child]:first-letter:leading-[0.85] [&>p:first-child]:first-letter:text-maroon">
            {HISTORY.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
