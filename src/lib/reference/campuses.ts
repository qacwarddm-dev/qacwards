/**
 * The 23 PUP campuses, verbatim from `docs/OtherContext.txt` "PUP CAMPUSES".
 *
 * `slug` is the seed's natural key and is what `programs.ts` joins against; it is
 * also what the built portal already uses in `/portal/documents/campuses/[campus]`.
 */
export type CampusSeed = {
  slug: string;
  name: string;
  /** True for Sta. Mesa, Manila only — the main campus is the one with colleges. */
  isMain: boolean;
};

export const MAIN_CAMPUS_SLUG = "sta-mesa-manila";

export const CAMPUSES: CampusSeed[] = [
  { slug: "alfonso", name: "Alfonso", isMain: false },
  { slug: "bansud", name: "Bansud", isMain: false },
  { slug: "bataan", name: "Bataan", isMain: false },
  { slug: "binan", name: "Biñan", isMain: false },
  { slug: "cabiao", name: "Cabiao", isMain: false },
  { slug: "calauan", name: "Calauan", isMain: false },
  { slug: "general-luna", name: "General Luna", isMain: false },
  { slug: "lopez", name: "Lopez", isMain: false },
  { slug: "maragondon", name: "Maragondon", isMain: false },
  { slug: "mulanay", name: "Mulanay", isMain: false },
  { slug: "paranaque", name: "Parañaque", isMain: false },
  { slug: "pulilan", name: "Pulilan", isMain: false },
  { slug: "quezon-city", name: "Quezon City", isMain: false },
  { slug: "ragay", name: "Ragay", isMain: false },
  { slug: "sablayan", name: "Sablayan", isMain: false },
  { slug: "san-juan", name: "San Juan", isMain: false },
  { slug: "san-pedro", name: "San Pedro", isMain: false },
  { slug: "sta-maria", name: "Sta. Maria", isMain: false },
  { slug: MAIN_CAMPUS_SLUG, name: "Sta. Mesa, Manila", isMain: true },
  { slug: "sta-rosa", name: "Sta. Rosa", isMain: false },
  { slug: "sto-tomas", name: "Sto. Tomas", isMain: false },
  { slug: "taguig", name: "Taguig", isMain: false },
  { slug: "unisan", name: "Unisan", isMain: false },
];
