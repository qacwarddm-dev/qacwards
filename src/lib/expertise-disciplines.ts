/**
 * Which `EXPERTISE_AREAS` make an Internal Accreditor eligible for a programme.
 *
 * OtherContext.txt lists the expertise areas and the programmes but never ties
 * one to the other, and docs/qac_per.pdf needs the eligible list generated from
 * expertise (its example puts "Web Development, Cybersecurity, Software
 * Engineering" against BS Information Technology — no word of which appears in
 * the programme's name). So each discipline below is a set of title keywords
 * and the expertise areas that qualify for any programme whose title holds one
 * of them. Authored here, not client-supplied: correct it when the client
 * sends a real mapping.
 */
export type Discipline = { keywords: string[]; areas: string[] };

export const DISCIPLINES: Discipline[] = [
  {
    keywords: ["computer", "information technology", "information and communication technology", "information systems"],
    areas: [
      "Computer Science",
      "Computer Engineering",
      "Information Technology",
      "Information Systems",
      "Cybersecurity",
      "Network Security",
      "Software Engineering",
      "Data Science",
    ],
  },
  {
    keywords: ["engineering"],
    areas: [
      "Civil Engineering",
      "Computer Engineering",
      "Electrical Engineering",
      "Electronics Engineering",
      "Industrial Engineering",
      "Manufacturing Engineering",
      "Mechanical Engineering",
      "Railway Engineering",
    ],
  },
  {
    keywords: ["architecture", "interior design", "environmental planning"],
    areas: ["Architecture", "Environmental Science", "Creative Arts", "Physical Facilities Management"],
  },
  {
    keywords: [
      "business",
      "accountancy",
      "accounting",
      "entrepreneurship",
      "marketing",
      "financial",
      "human resource",
      "cooperative",
      "agribusiness",
      "real estate",
      "office administration",
      "transportation management",
    ],
    areas: [
      "Accountancy",
      "Accounting and Finance",
      "Business Administration",
      "Entrepreneurship",
      "Marketing Management",
      "Human Resource Management",
      "Economics",
      "Office Administration",
      "Records Management",
    ],
  },
  {
    keywords: ["hospitality", "tourism", "hotel"],
    areas: [
      "Hospitality Management",
      "Hotel and Restaurant Management",
      "Tourism Management",
      "Event Management",
    ],
  },
  {
    keywords: ["food technology", "nutrition"],
    areas: ["Chemistry", "Biology", "Hotel and Restaurant Management"],
  },
  {
    keywords: ["biology", "chemistry", "physics", "environmental", "major in science"],
    areas: ["Biology", "Chemistry", "Physics", "Environmental Science"],
  },
  {
    keywords: ["mathematics", "statistics"],
    areas: ["Mathematics", "Applied Mathematics", "Statistics", "Data Science"],
  },
  {
    keywords: ["economics", "political economy"],
    areas: ["Economics", "Political Economy", "Statistics"],
  },
  {
    keywords: ["communication", "broadcasting", "journalism", "advertising", "public relations"],
    areas: [
      "Broadcasting",
      "Journalism",
      "Communication Research",
      "Development Communication",
      "Media and Information Studies",
    ],
  },
  {
    keywords: ["english", "filipino", "literary", "cultural", "philippine studies", "history", "philosophy"],
    areas: ["English Language Studies", "Filipinolohiya", "Cultural Studies", "History", "Philosophy"],
  },
  {
    keywords: ["sociology", "psychology", "political science", "social studies", "anthropology"],
    areas: ["Sociology", "Psychology", "Political Science", "Anthropology", "History"],
  },
  {
    keywords: ["public administration", "fiscal administration"],
    areas: [
      "Public Administration",
      "Public Governance",
      "Administration and Governance",
      "Political Science",
    ],
  },
  {
    keywords: ["education"],
    areas: [
      "Teacher Education",
      "Secondary Education",
      "Early Childhood Education",
      "Educational Management",
      "Curriculum and Instruction",
      "Curriculum Development",
      "Outcomes-Based Education (OBE)",
    ],
  },
  {
    keywords: ["physical education", "sports", "exercise"],
    areas: ["Physical Education", "Sports Science", "Fitness and Sports Coaching"],
  },
  {
    keywords: ["performing arts", "theater", "music"],
    areas: ["Performing Arts", "Theater Arts", "Music", "Creative Arts"],
  },
  {
    keywords: ["library"],
    areas: ["Library and Information Science", "Library Services", "Records Management"],
  },
  {
    keywords: ["criminology", "legal"],
    areas: ["Criminology", "Legal Studies"],
  },
];

/** Expertise areas that qualify an accreditor for a programme with this title:
 *  every matched discipline's areas, plus any area whose significant words all
 *  appear in the title itself. */
export function relevantExpertise(programTitle: string, allAreas: string[]): Set<string> {
  const title = programTitle.toLowerCase();
  const relevant = new Set<string>();

  for (const d of DISCIPLINES) {
    if (d.keywords.some((k) => title.includes(k))) d.areas.forEach((a) => relevant.add(a));
  }

  for (const area of allAreas) {
    const words = area
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3);
    if (words.length > 0 && words.every((w) => title.includes(w))) relevant.add(area);
  }

  return relevant;
}
