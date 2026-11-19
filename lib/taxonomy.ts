export type Sector = 'industry'
export type StateCode = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'
export type WorkArrangement = 'onsite' | 'hybrid' | 'remote'
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'scholarship'

export interface Role {
  slug: string
  name: string
  sector: Sector
}

export const INDUSTRY_ROLES: Role[] = [
  { slug: 'structural-engineer', name: 'Structural Engineer', sector: 'industry' },
  { slug: 'senior-structural-engineer', name: 'Senior Structural Engineer', sector: 'industry' },
  { slug: 'principal-structural-engineer', name: 'Principal Structural Engineer', sector: 'industry' },
  { slug: 'civil-engineer', name: 'Civil Engineer', sector: 'industry' },
  { slug: 'geotechnical-engineer', name: 'Geotechnical Engineer', sector: 'industry' },
  { slug: 'bridge-engineer', name: 'Bridge Engineer', sector: 'industry' },
  { slug: 'design-engineer', name: 'Design Engineer', sector: 'industry' },
  { slug: 'project-engineer', name: 'Project Engineer', sector: 'industry' },
]

export const ALL_ROLES = [...INDUSTRY_ROLES]

export interface City {
  slug: string
  name: string
  state: StateCode
  /** Country the city is in — every hub listed here is Australian today. */
  country: string
  description: string
}

export const CITIES: City[] = [
  {
    slug: 'sydney',
    name: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    description:
      'Australia’s largest engineering market, with major transport, high-rise and infrastructure programs alongside leading research universities.',
  },
  {
    slug: 'newcastle',
    name: 'Newcastle',
    state: 'NSW',
    country: 'Australia',
    description:
      'A growing hub for structural research, port and energy infrastructure, and regional consulting work in the Hunter.',
  },
  {
    slug: 'melbourne',
    name: 'Melbourne',
    state: 'VIC',
    country: 'Australia',
    description:
      'Home to large rail, tunnel and building projects plus world-class structural engineering research groups.',
  },
  {
    slug: 'brisbane',
    name: 'Brisbane',
    state: 'QLD',
    country: 'Australia',
    description:
      'Rapid growth in transport, bridges and venue infrastructure ahead of the 2032 Olympic and Paralympic Games.',
  },
  {
    slug: 'perth',
    name: 'Perth',
    state: 'WA',
    country: 'Australia',
    description:
      'Strong demand from resources, marine and heavy industrial structures, with active university research in offshore engineering.',
  },
  {
    slug: 'adelaide',
    name: 'Adelaide',
    state: 'SA',
    country: 'Australia',
    description:
      'Defence, health and road infrastructure investment driving steady demand for structural and civil engineers.',
  },
]

export const STATES: { code: StateCode; name: string }[] = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
]

export const SALARY_OPTIONS = [
  { value: 40000, label: '$40k+' },
  { value: 80000, label: '$80k+' },
  { value: 100000, label: '$100k+' },
  { value: 120000, label: '$120k+' },
  { value: 150000, label: '$150k+' },
  { value: 180000, label: '$180k+' },
]

export function getRole(slug: string) {
  return ALL_ROLES.find((role) => role.slug === slug)
}

export function getCity(slug: string) {
  return CITIES.find((city) => city.slug === slug)
}

/**
 * The civil/structural sub-disciplines a listing is filed under.
 *
 * Feeds rarely label the discipline, so a listing is matched on its own words:
 * title, summary, department and tags. "Bridge" sits only under structural,
 * otherwise a bridge engineer would appear in transport as well and the counts
 * would double.
 */
export interface Specialism {
  slug: string
  name: string
  keywords: string[]
}

export const CIVIL_SPECIALISMS: Specialism[] = [
  {
    slug: 'structural',
    name: 'Structural & bridges',
    keywords: ['structural', 'bridge', 'steel', 'concrete', 'timber', 'seismic', 'earthquake'],
  },
  {
    slug: 'geotechnical',
    name: 'Geotechnical & tunnelling',
    keywords: ['geotechnical', 'geotech', 'foundation', 'soil', 'piling', 'tunnel', 'earthworks', 'retaining'],
  },
  {
    slug: 'water',
    name: 'Water & drainage',
    keywords: ['water', 'hydraulic', 'hydrology', 'drainage', 'wastewater', 'stormwater', 'flood', 'sewerage', 'sewer'],
  },
  {
    slug: 'dams',
    name: 'Dams & hydropower',
    keywords: ['dam engineer', 'dams', 'dam design', 'hydropower', 'hydroelectric', 'reservoir', 'spillway'],
  },
  {
    slug: 'transport',
    name: 'Transport & roads',
    keywords: ['transport', 'traffic', 'road', 'highway', 'rail', 'pavement', 'airport'],
  },
  {
    slug: 'construction',
    name: 'Construction & project management',
    keywords: ['construction', 'site engineer', 'project manager', 'contracts', 'planning', 'land development', 'subdivision'],
  },
  {
    slug: 'coastal',
    name: 'Coastal, ports & marine',
    keywords: ['coastal', 'marine', 'port engineer', 'harbour', 'harbor', 'offshore', 'jetty', 'seawall'],
  },
  {
    slug: 'mining',
    name: 'Mining & resources',
    keywords: ['mining', 'minerals', 'oil and gas', 'oil & gas'],
  },
  {
    slug: 'environmental',
    name: 'Environmental & sustainability',
    keywords: ['environmental', 'sustainability', 'climate', 'carbon'],
  },
  {
    slug: 'materials',
    name: 'Materials & durability',
    keywords: ['materials', 'durability', 'corrosion', 'asphalt'],
  },
  {
    slug: 'surveying',
    name: 'Surveying & geospatial',
    keywords: ['survey', 'geospatial', 'gis', 'lidar'],
  },
]

export function getSpecialism(slug: string) {
  return CIVIL_SPECIALISMS.find((specialism) => specialism.slug === slug)
}
