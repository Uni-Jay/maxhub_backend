/**
 * MaxHub ERP brand structure.
 *
 * Every brand is a top-level Department (identified by its code); brands with
 * more than one line of business get child departments (parentDepartmentId).
 * Codes for the three original brands (KS, VM, BM) match the rows that
 * already exist in production, so nothing existing is renamed by code.
 */

export type BrandCode = 'VM' | 'KS' | 'BM' | 'MF';

export interface BrandProfileSeed {
  code: BrandCode;
  /** Name used only when the department row doesn't exist yet. */
  departmentName: string;
  displayName: string;
  tagline: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  logoPath: string;
  primaryColor: string;
  secondaryColor: string;
  receiptPrefix: string;
  subDepartments: { code: string; name: string; description: string }[];
}

const HQ_ADDRESS =
  '51, Ayangburen Road, Opposite Ayangburen Palace, Top Floor (KFC & Samsung office building), Ikorodu, Lagos';

export const BRANDS: BrandProfileSeed[] = [
  {
    code: 'VM',
    departmentName: 'Visamax Travels',
    displayName: 'VisaMax Travel Ltd',
    tagline: 'Your Journey, Our Expertise',
    description:
      'Travel agency — visa services, flight booking, tourism, overseas studies, family visas, business travel and expert support.',
    website: 'https://www.visamaxtravels.net',
    email: 'info@visamaxtravels.com',
    phone: '+2348170020431',
    whatsapp: '+2348170020431',
    address: HQ_ADDRESS,
    logoPath: '/brands/visamax.jpeg',
    primaryColor: '#1d3a8f',
    secondaryColor: '#c8102e',
    receiptPrefix: 'VMX',
    subDepartments: [],
  },
  {
    code: 'KS',
    departmentName: 'Kurios Sat',
    displayName: 'Kurios SAT',
    tagline: 'Endless Possibilities',
    description: 'Technology company — ICT solutions (web, mobile, software, hosting) and an ICT training center.',
    website: 'https://www.kurios-sat.tech',
    email: 'info@kurios-sat.tech',
    phone: '+2348170020431',
    whatsapp: '+2348170020431',
    address: HQ_ADDRESS,
    logoPath: '/brands/kuriossat.jpeg',
    primaryColor: '#1f2a30',
    secondaryColor: '#5aa832',
    receiptPrefix: 'KST',
    subDepartments: [
      { code: 'KS-ICT', name: 'Kurios SAT — ICT Solutions', description: 'Builds tech solutions: web apps, mobile apps, software, hosting & IT support.' },
      { code: 'KS-TRN', name: 'Kurios SAT — ICT Training Center', description: 'Trains students in software development, design, data and other ICT skills.' },
    ],
  },
  {
    code: 'BM',
    departmentName: 'Beadmax Design',
    displayName: 'BeadMax Design',
    tagline: 'Beads • Beauty • Creativity',
    description: 'Beads brand — handmade bead products (bags, jewellery, accessories) and a vocational school.',
    website: 'https://www.beadmax.net',
    email: 'info@beadmax.net',
    phone: '+2348170020431',
    whatsapp: '+2348170020431',
    address: HQ_ADDRESS,
    logoPath: '/brands/beadmax.jpeg',
    primaryColor: '#6d1a2a',
    secondaryColor: '#c9a27a',
    receiptPrefix: 'BMX',
    subDepartments: [
      { code: 'BM-DSN', name: 'Beadmax Design — Products & Sales', description: 'Makes and sells bead products: bags, jewellery, accessories, custom orders.' },
      { code: 'BM-VOC', name: 'Beadmax Design Vocational School', description: 'Trains students to make bead bags, jewellery and accessories.' },
    ],
  },
  {
    code: 'MF',
    departmentName: 'Maxfood Farm',
    displayName: 'Maxfood Farm',
    tagline: 'Taste of Home, Delivered Worldwide',
    description: 'Delivers Nigerian raw foodstuff to customers in other countries (sourcing, packaging, export documentation and shipping).',
    website: '',
    email: 'info@maxhubng.company',
    phone: '+2348170020431',
    whatsapp: '+2348170020431',
    address: HQ_ADDRESS,
    logoPath: '/brands/maxfood.svg',
    primaryColor: '#2f7d32',
    secondaryColor: '#f2a900',
    receiptPrefix: 'MFF',
    subDepartments: [],
  },
];

export const BRAND_BY_CODE: Record<string, BrandProfileSeed> = Object.fromEntries(BRANDS.map((b) => [b.code, b]));

/** Head Office — the only branch for now. */
export const HEAD_OFFICE = {
  branchCode: 'HQ',
  branchName: 'Head Office',
  country: 'Nigeria',
  state: 'Lagos',
  city: 'Ikorodu',
  address: HQ_ADDRESS,
  phone: '+2348170020431',
  email: 'info@maxhubng.company',
};
