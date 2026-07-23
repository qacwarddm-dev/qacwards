import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Campuses | PUP Quality Assurance Center",
  description:
    "Campuses of the Polytechnic University of the Philippines across Luzon and the Visayas.",
};

export const dynamic = "force-static";

// Campus copy carries two emphasis styles in the prototype:
//   **text**  bold, body colour
//   __text__  bold maroon (used for statutes and place names)
// Keeping the copy in plain strings avoids JSX collapsing the spaces that sit
// either side of an inline <strong>.
const EMPHASIS = /(\*\*[^*]+\*\*|__[^_]+__)/g;

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(EMPHASIS).map((part, index) => {
        if (part.startsWith("**")) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("__")) {
          return (
            <strong key={index} className="font-bold text-maroon">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

const INTRO =
  "The __Polytechnic University of the Philippines (PUP)__ has successfully grown its academic presence to include more than 24 campuses spread across the island of Luzon. These locations span from the main hub in Metro Manila to various provinces in Central Luzon, CALABARZON, and Bicol. In a landmark achievement for the “Sintang Paaralan,” the university has officially inaugurated its first-ever campus in the Visayas, located in the Municipality of __Leyte, Leyte__. This new campus, established under Republic Act 11786, offers specialized programs like Information Technology and Entrepreneurship to students in the region. By crossing into the Visayas, PUP reinforces its national mission to provide high-quality, state-subsidized education to deserving learners throughout the Philippine archipelago.";

// Both bands are one content column wide; the side rules of the stat band are
// exactly one grid column (365px) each.
const BAND = "max-w-[1161px]";

const STATS = [
  { value: "6", label: "REGIONS" },
  { value: "24", label: "CAMPUSES" },
];

type Campus = {
  name: string;
  photo: string;
  body: string;
};

// Order follows the client's asset folder (alphabetical), which is the order the
// prototype renders: 22 cards, three per row, the last one centred on its own.
const CAMPUSES: Campus[] = [
  {
    name: "PUP ALFONSO CAMPUS",
    photo: "/assets/campuses/alfonso.png",
    body: "Alfonso Campus in Cavite provides accessible, high-quality education as a key pillar of the university’s regional network. Formerly an extension of the Maragondon branch, it was formally established as a regular university campus on June 2, 2022, through **Republic Act No. 11754**. The institution is dedicated to offering specialized degree programs such as Accountancy, Mechanical Engineering, and Secondary Education to empower students and drive local development.",
  },
  {
    name: "PUP BANSUD CAMPUS",
    photo: "/assets/campuses/bansud.png",
    body: "Bansud Campus, located in Poblacion, Bansud, Oriental Mindoro, was established in October 2008 through a Memorandum of Agreement between the university and the local municipal government. It achieved permanent status as a regular university campus on April 12, 2019, by virtue of **Republic Act No. 11281**, also known as the “PUP-Bansud Campus Act”. The campus is dedicated to providing affordable, high-quality education to the Mindoreño youth, offering undergraduate programs such as Information Technology, Public Administration, and Secondary Education, alongside graduate degrees through the PUP Open University System.",
  },
  {
    name: "PUP BATAAN CAMPUS",
    photo: "/assets/campuses/bataan.jpg",
    body: "Bataan Campus, located in the Freeport Area of Bataan in Mariveles, was formally established on July 1, 1976, to bring quality education to the industrial countryside. As the first PUP campus in Northern Luzon, it evolved from a local high school initiative into a premier state university branch that serves as a vital educational hub for the region. Today, the campus offers a wide range of academic programs, including Accountancy, Engineering, Information Technology, and Education, ensuring that students in Bataan have access to globally competitive professional training.",
  },
  {
    name: "PUP BIÑAN CAMPUS",
    photo: "/assets/campuses/binan.jpg",
    body: "Biñan Campus, originally established on September 15, 2009, through a partnership with the local government, serves as a primary provider of high-quality technical and professional education in Laguna. The university significantly expanded its footprint in the city on February 2, 2024, with the inauguration of a second campus in Barangay Canlalay, featuring a four-storey building and laboratories dedicated primarily to STEM and information technology programs.",
  },
  {
    name: "PUP CABIAO CAMPUS",
    photo: "/assets/campuses/cabiao.jpg",
    body: "Cabiao Campus in Nueva Ecija was established on June 15, 1996, originally as the “Pamantasang Bayan ng Cabiao” through a partnership with the local government. It achieved a historic milestone on April 27, 2022, when it was officially integrated into the university system as a regular campus under **Republic Act No. 11754**. Currently, the campus offers undergraduate degrees in **Elementary Education** and **Business Administration (Marketing Management)**, serving as a vital academic hub for students in southern Nueva Ecija and nearby provinces.",
  },
  {
    name: "PUP CALAUAN CAMPUS",
    photo: "/assets/campuses/calauan.png",
    body: "Calauan Campus in Laguna was established in June 2009 through a partnership between the university and the local government to provide accessible higher education to the community. The campus currently offers specialized undergraduate programs, including the **Bachelor of Science in Entrepreneurship** and the **Bachelor of Technology and Livelihood Education**, designed to equip students with practical and professional skills. As a vital regional hub, it continues to fulfill the “Sintang Paaralan” mission by empowering local youth through high-quality, state-subsidized academic training and community extension services.",
  },
  {
    name: "PUP GENERAL LUNA CAMPUS",
    photo: "/assets/campuses/general-luna.jpg",
    body: "General Luna Campus was established in June 2009 to serve as a vital academic center for the youth of the Bondoc Peninsula in Quezon. Functioning as a strategic extension of the PUP Mulanay branch, it has consistently worked toward becoming a regular university campus to expand its administrative capabilities and state funding. The institution currently provides career-oriented undergraduate programs, specifically the **Bachelor in Elementary Education** and the **Bachelor of Science in Business Administration major in Marketing Management**.",
  },
  {
    name: "PUP LOPEZ CAMPUS",
    photo: "/assets/campuses/lopez.png",
    body: "Lopez Campus in Quezon was established on February 13, 1979, following a generous donation of land and buildings by the heirs of Don Gregorio C. Yumul, Sr. As the first PUP campus established in the province, it serves as a premier academic hub providing high-quality, state-subsidized education to students from Southern Quezon and the neighboring Bicol region. The campus offers a comprehensive range of undergraduate programs, including Civil Engineering, Electrical Engineering, and Accountancy, as well as graduate degrees through the university’s Open University System.",
  },
  {
    name: "PUP MARAGONDON CAMPUS",
    photo: "/assets/campuses/maragondon.jpg",
    body: "Maragondon Campus was established on June 15, 1987, through a vision to extend the university’s “Sintang Paaralan” brand of education to the countryside of Cavite. As a leading institution in the province, it provides a diverse array of academic programs, specifically focusing on engineering disciplines such as **Electrical, Electronics, and Mechanical Engineering**, alongside professional degrees in **Accountancy and Education**. The campus remains dedicated to empowering local youth and marginalized sectors by offering high-quality, state-subsidized instruction that prepares them for success in both domestic and global markets.",
  },
  {
    name: "PUP MULANAY CAMPUS",
    photo: "/assets/campuses/mulanay.png",
    body: "Mulanay Branch was established in 1993 through Republic Act No. 7645 to serve as the “Avenue of Knowledge in the Countryside” for the Bondoc Peninsula. It plays a critical role in rural development by providing accessible, state-subsidized education to students in remote municipalities of Quezon and nearby provinces. Currently, the campus offers undergraduate programs such as **Elementary Education**, **Agribusiness Management**, **Entrepreneurship**, and **Office Administration**.",
  },
  {
    name: "PUP PARAÑAQUE CAMPUS",
    photo: "/assets/campuses/paranaque.jpg",
    body: "Parañaque Campus was established on May 12, 2011, through a partnership with the local government to provide “poor but deserving” students with accessible tertiary education. On February 15, 2024, the institution reached a historic milestone when it was officially converted into a regular university campus under **Republic Act No. 11979**. Currently, the campus offers undergraduate degrees in Computer Engineering, Information Technology, Hospitality Management, and Office Administration, serving as a vital academic hub in southern Metro Manila.",
  },
  {
    name: "PUP PULILAN CAMPUS",
    photo: "/assets/campuses/pulilan.jpg",
    body: "Pulilan Campus, situated in the province of Bulacan, was established in 2000 through a partnership between the university and the municipal government. After starting as an Open University learning center, it gained recognition as an independent campus in 2008 to provide residents with equitable access to quality state education. Currently, the campus offers undergraduate degrees in **Entrepreneurship** and **Public Administration major in Public Financial Management**, serving as a key driver for professional development in Central Luzon.",
  },
  {
    name: "PUP QUEZON CITY CAMPUS",
    photo: "/assets/campuses/quezon-city.jpg",
    body: "Quezon City Campus, established on July 29, 1997, was born from a mission to bring high-quality, subsidized education to urban poor communities in the National Capital Region. Its official status was further solidified on June 25, 2019, when it was formally converted into a regular university campus through **Republic Act No. 11347**. Known as “Green Campus,” it offers a variety of specialized programs including Information Technology, Business Administration, and Public Administration to prepare students for the global workforce.",
  },
  {
    name: "PUP RAGAY CAMPUS",
    photo: "/assets/campuses/ragay.jpg",
    body: "Ragay Campus, located in Camarines Sur, was inaugurated on August 2, 1998, to serve as a vital academic hub for the youth of the Bicol Region. Situated atop a hill overlooking the municipality, the campus provides state-subsidized programs such as **Information Technology, Accountancy, and Education** to empower local students and drive regional development. The institution continues to expand its facilities, including the recent construction of a new four-storey classroom building, to accommodate its growing community and maintain its commitment to academic excellence.",
  },
  {
    name: "PUP SABLAYAN CAMPUS",
    photo: "/assets/campuses/sablayan.png",
    body: "Sablayan Campus in Occidental Mindoro was established on October 6, 2010, initially as a local government-funded extension to provide tertiary education to the largest municipality in the province. It attained official status as a regular university campus on August 9, 2018, through **Republic Act No. 11056**, ensuring its long-term operation through national government funding. The campus serves the MIMAROPA region by offering diverse academic programs, including **Entrepreneurship**, **Secondary Education**, and graduate degrees such as **Educational Management** through the PUP Open University System.",
  },
  {
    name: "PUP SAN JUAN CAMPUS",
    photo: "/assets/campuses/san-juan.jpg",
    body: "San Juan Campus, located in Barangay Addition Hills, was established in 2008 through a partnership with the local government to provide the city’s first public higher education institution. It reached a significant milestone on July 25, 2019, when it was officially converted into a regular university campus under **Republic Act No. 11348**, ensuring its continued operations through national government funding. The campus offers a diverse selection of undergraduate programs, including **Accountancy**, **Information Technology**, **Computer Science**, **Psychology**, and **Secondary Education**, catering to the academic needs of the San Juan community.",
  },
  {
    name: "PUP SAN PEDRO CAMPUS",
    photo: "/assets/campuses/san-pedro.jpg",
    body: "San Pedro Campus in Laguna was established on April 9, 2002, as the university’s first extension campus in the province through a partnership with the local government. As one of the municipality-funded campuses in the region, it provides a vital educational gateway for students in southern Luzon to access high-quality, state-subsidized tertiary education. The institution offers a diverse range of undergraduate programs, including **Information Technology**, **Business Administration**, **Secondary Education**, and **Accountancy**, to prepare the local youth for professional success.",
  },
  {
    name: "PUP STA. MARIA CAMPUS",
    photo: "/assets/campuses/sta-maria.jpg",
    body: "Sta. Maria Campus in Bulacan was founded in 2005 at Sitio Gulod, Barangay Pulong-Buhangin, through a collaborative effort between the university and the municipal government. As a premier center of learning in the province, it offers a diverse range of undergraduate programs, including **Accountancy**, **Computer Engineering**, **Information Technology**, and **Hospitality Management**. The campus is renowned for its academic excellence, particularly in the field of accountancy, where its students have consistently earned top honors in national competitions.",
  },
  {
    name: "PUP STA. ROSA CAMPUS",
    photo: "/assets/campuses/sta-rosa.jpg",
    body: "Sta. Rosa Campus in Laguna was established in 2003 as a premier legacy of the late Mayor Leon C. Arcillas to provide quality, state-subsidized education to the “Lion City of the South”. The campus is a major academic hub in South Luzon, offering a wide range of specialized programs including **Electronics Engineering**, **Industrial Engineering**, **Accountancy**, **Psychology**, and **Information Technology**. By producing consistently high-performing licensed professionals and partnering with local industries, it continues to serve as a vital catalyst for the social and economic development of the region.",
  },
  {
    name: "PUP STO. TOMAS CAMPUS",
    photo: "/assets/campuses/sto-tomas.jpg",
    body: "Sto. Tomas Campus in Batangas was established in January 1992 to serve as a key educational hub for the province and neighboring Laguna. It holds a unique legal history, having been formally excluded from the Batangas State University system by __Republic Act No. 9472__ in 2007 to remain a steadfast branch of the “Sintang Paaralan”. As the largest PUP campus in Southern Luzon, it offers diverse programs in engineering, accountancy, and psychology, empowering thousands of students through affordable, high-quality state education.",
  },
  {
    name: "PUP TAGUIG CAMPUS",
    photo: "/assets/campuses/taguig.jpg",
    body: "Taguig Campus stands as a premier satellite branch of the “Country’s First Polytechnic University,” strategically located in the heart of the thriving city of Taguig. It is dedicated to providing high-quality, accessible education and professional training to students, particularly in the fields of engineering, business, and information technology. Through its commitment to academic excellence and community involvement, the campus serves as a vital hub for developing skilled professionals ready to contribute to the nation’s industrial and economic growth.",
  },
  {
    name: "PUP UNISAN CAMPUS",
    photo: "/assets/campuses/unisan.jpg",
    body: "Unisan Campus in Quezon was established in 1987 as a vocational-technical school and evolved into a regular branch that serves as a vital center for quality tertiary education in the Bondoc Peninsula. Under its mission of “Educating Minds, Elevating Lives,” the campus provides state-subsidized undergraduate programs such as **Elementary Education**, **Information Technology**, and **Entrepreneurship**. It further expands academic opportunities through the PUP Open University System, offering graduate degrees in **Educational Management** and **Public Administration** to working professionals in the region.",
  },
];

export default function CampusesPage() {
  return (
    <div>
      <Image
        src="/assets/imagery/campuses.png"
        alt="Polytechnic University of the Philippines — Campuses"
        width={1356}
        height={374}
        className="aspect-[4.5] w-full object-cover object-[center_16%]"
        priority
      />

      <section className="px-4 pb-28 pt-20 sm:px-6 lg:px-8">
        <div
          className={`mx-auto flex items-center gap-x-6 md:gap-x-[60px] ${BAND}`}
        >
          <span className="h-3.5 flex-1 bg-maroon" aria-hidden />
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-[96px] font-bold leading-none text-maroon md:text-[150px]">
                {stat.value}
              </span>
              <span className="mt-9 text-heading font-bold leading-[1.2] md:text-title">
                {stat.label}
              </span>
            </div>
          ))}
          <span className="h-3.5 flex-1 bg-maroon" aria-hidden />
        </div>

        <p
          className={`mx-auto mt-16 text-center text-subheading leading-loose ${BAND}`}
        >
          <RichText text={INTRO} />
        </p>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto h-[5px] bg-maroon ${BAND}`} />
      </div>

      <section className="px-4 pb-30 pt-28 sm:px-6 lg:px-8">
        <div
          className={`mx-auto flex flex-wrap justify-center gap-x-[33px] gap-y-[66px] ${BAND}`}
        >
          {CAMPUSES.map((campus) => (
            <article key={campus.name} className="w-full max-w-[365px]">
              <div className="relative aspect-[365/206] w-full overflow-hidden">
                <Image
                  src={campus.photo}
                  alt={campus.name}
                  fill
                  sizes="365px"
                  className="object-cover"
                />
              </div>

              <h2 className="mt-6 text-center text-heading font-bold text-maroon">
                {campus.name}
              </h2>

              <p className="mt-6 text-center text-subheading leading-loose">
                <RichText text={campus.body} />
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
