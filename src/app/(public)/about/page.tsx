import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About | PUP Quality Assurance Center",
  description:
    "The Quality Assurance Center of the Polytechnic University of the Philippines — its officials and staff, mandate, core functions, goals, objectives and history.",
};

// Two values below come off the client prototype but have no entry in
// design/figma-tokens.md yet — the cream band behind "Officials and Staff" and
// the gold hairline that fences it. Flagged for the client; swap for tokens
// once they are added to the token file.
const BAND_BG = "bg-[#FFF8DC]";
const BAND_RULE = "border-[#E1C16E]";

// Portraits ship from the client with a 5px frame already baked into the PNG,
// so the frame colour is part of the file, not a CSS border. Only the drop
// shadow is ours.
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

function Portrait({ person }: { person: Official }) {
  return (
    <div className="flex w-[233px] flex-col items-center">
      <Image
        src={person.photo}
        alt={person.name}
        width={person.width}
        height={person.height}
        className={`h-[310px] w-auto ${PORTRAIT_SHADOW}`}
      />
      {/* Wider than the 233px portrait so the roles break where the prototype
          breaks them; only safe once the band itself has room for four across. */}
      <div className="mt-6 w-[233px] max-w-[90vw] text-center text-maroon xl:w-[330px]">
        <p className="text-heading font-bold leading-[24px] xl:whitespace-nowrap">
          {person.name}
        </p>
        <p className="text-subheading leading-[18px]">{person.role}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* Banner ratio comes off the prototype: 532px tall at a 1445px viewport.
          The supplied ABOUT US.jpg is a 3:2 full-body shot, so it is cropped,
          not scaled — 2% down the overflow leaves the same headroom above the
          tallest head (~9% of the band) that the prototype has. Because both
          the aspect and the offset are ratios, the crop holds at any width. */}
      <Image
        src="/assets/imagery/about-us.jpg"
        alt="The Quality Assurance Center team"
        width={2048}
        height={1364}
        className="aspect-[1445/532] w-full object-cover object-[center_2%]"
        priority
      />
      <div className="h-5 bg-maroon" />

      <section className="px-4 pb-28 pt-11 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1152px]">
          <Image
            src="/assets/employees/claudio.png"
            alt="Sanjay P. Claudio, DPA — QAC Director"
            width={279}
            height={399}
            className={`mx-auto mb-8 sm:float-left sm:mx-0 sm:mb-6 sm:mr-[62px] ${PORTRAIT_SHADOW}`}
          />

          <h1 className="text-title font-bold leading-[1.2] text-maroon">
            Message from the QAC Director
          </h1>

          <div className="mt-7 space-y-[30px] text-subheading leading-loose sm:text-justify">
            {DIRECTOR_MESSAGE.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-[26px] text-heading font-bold">
            Sanjay P. Claudio, DPA
          </p>
        </div>
      </section>

      <section
        className={`border-y-[5px] px-4 pb-[29px] pt-[33px] sm:px-6 lg:px-8 ${BAND_BG} ${BAND_RULE}`}
      >
        <h2 className="text-center text-title font-black leading-[1.2] text-maroon">
          OFFICIALS AND STAFF
        </h2>

        <div className="mx-auto mt-[38px] max-w-[1250px]">
          <div className="flex justify-center">
            <Portrait person={DIRECTOR} />
          </div>

          <div className="mt-[45px] grid grid-cols-1 justify-items-center gap-y-[45px] sm:grid-cols-2">
            {ASSISTANT_DIRECTORS.map((person) => (
              <Portrait key={person.name} person={person} />
            ))}
          </div>

          <div className="mt-[45px] flex flex-wrap justify-center gap-x-[106px] gap-y-[45px]">
            {CHIEFS.map((person) => (
              <Portrait key={person.name} person={person} />
            ))}
          </div>

          {/* Three across, so the prototype opens the column gap to 130px. */}
          {[COORDINATORS, ADMINISTRATIVE_STAFF].map((row) => (
            <div
              key={row[0].role}
              className="mt-[45px] flex flex-wrap justify-center gap-x-[130px] gap-y-[45px]"
            >
              {row.map((person) => (
                <Portrait key={person.name} person={person} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-40 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1152px]">
          <h2 className="text-title font-bold leading-[1.2] text-maroon">Mission</h2>
          <p className="mt-9 text-heading leading-[1.5]">
            Advance an inclusive, equitable, and globally relevant polytechnic
            education towards national development.
          </p>

          <h2 className="mt-16 text-title font-bold leading-[1.2] text-maroon">Vision</h2>
          <p className="mt-9 text-heading leading-[1.5]">
            Provide quality education through instruction, advance research and
            extension services. Produce world-class professionals as potential
            industry leaders and job providers. Develop and produce facilities
            through the use of adapted technology and indigenous materials.
          </p>

          <div className="mt-16 border-y-[20px] border-maroon">
            <Image
              src="/assets/imagery/about-vision.jpg"
              alt="Aerial view of the PUP Main Campus"
              width={1920}
              height={1080}
              sizes="(min-width: 1216px) 1152px, 100vw"
              className="aspect-[1154/440] w-full object-cover object-top"
            />
          </div>

          <div className="mt-[42px] space-y-[30px] text-subheading leading-loose">
            {OVERVIEW.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <h2 className="mt-12 text-title font-bold leading-[1.2] text-maroon">
            Core Functions
          </h2>
          <p className="mt-8 text-subheading leading-loose">
            The QAC&rsquo;s primary roles are to:
          </p>
          <ol className="mt-7 list-decimal pl-[22px] text-subheading leading-loose">
            {CORE_FUNCTIONS.map((item) => (
              <li key={item.slice(0, 32)}>{item}</li>
            ))}
          </ol>

          <h2 className="mt-16 text-title font-bold leading-[1.2] text-maroon">Goals</h2>
          <p className="mt-8 text-subheading leading-loose">
            The QAC endeavors to achieve:
          </p>
          <ol className="mt-7 list-decimal pl-[22px] text-subheading leading-loose">
            {GOALS.map((item) => (
              <li key={item.slice(0, 32)}>{item}</li>
            ))}
          </ol>

          <h2 className="mt-16 text-title font-bold leading-[1.2] text-maroon">Objectives</h2>
          <p className="mt-8 text-subheading leading-loose">
            Towards these ends, the QAC commits to:
          </p>
          <ul className="mt-7 list-disc pl-[22px] text-subheading leading-loose">
            {OBJECTIVES.map((item) => (
              <li key={item.slice(0, 32)}>{item}</li>
            ))}
          </ul>

          <h2 className="mt-16 text-title font-bold leading-[1.2] text-maroon">History</h2>
          <div className="mt-8 space-y-[35px] text-subheading leading-[35px]">
            {HISTORY.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
