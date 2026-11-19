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
  /** Region/state as a plain string — AU state code at home, region name abroad. */
  state: string
  /** Country the city is in — every hub listed here is Australian today. */
  country: string
  description: string
}

export const CITIES: City[] = [
  {
    slug: "sydney",
    name: "Sydney",
    state: "NSW",
    country: "Australia",
    description: "Australia’s largest engineering market, with major transport, high-rise and infrastructure programs alongside leading research universities.",
  },
  {
    slug: "newcastle",
    name: "Newcastle",
    state: "NSW",
    country: "Australia",
    description: "A growing hub for structural research, port and energy infrastructure, and regional consulting work in the Hunter.",
  },
  {
    slug: "melbourne",
    name: "Melbourne",
    state: "VIC",
    country: "Australia",
    description: "Home to large rail, tunnel and building projects plus world-class structural engineering research groups.",
  },
  {
    slug: "brisbane",
    name: "Brisbane",
    state: "QLD",
    country: "Australia",
    description: "Rapid growth in transport, bridges and venue infrastructure ahead of the 2032 Olympic and Paralympic Games.",
  },
  {
    slug: "perth",
    name: "Perth",
    state: "WA",
    country: "Australia",
    description: "Strong demand from resources, marine and heavy industrial structures, with active university research in offshore engineering.",
  },
  {
    slug: "adelaide",
    name: "Adelaide",
    state: "SA",
    country: "Australia",
    description: "Defence, health and road infrastructure investment driving steady demand for structural and civil engineers.",
  },
  {
    slug: "aberdeen",
    name: "Aberdeen",
    state: "Scotland",
    country: "United Kingdom",
    description: "Energy and offshore engineering hub on Scotland's north-east coast.",
  },
  {
    slug: "abha",
    name: "Abha",
    state: "Aseer",
    country: "Saudi Arabia",
    description: "Growing city in Saudi Arabia's Aseer mountains with infrastructure and tourism projects.",
  },
  {
    slug: "abu-dhabi",
    name: "Abu Dhabi",
    state: "Abu Dhabi",
    country: "United Arab Emirates",
    description: "The UAE capital, with major infrastructure, energy and cultural projects.",
  },
  {
    slug: "al-ula",
    name: "AlUla",
    state: "AlUla",
    country: "Saudi Arabia",
    description: "Heritage and tourism megaprojects in north-west Saudi Arabia.",
  },
  {
    slug: "anchorage",
    name: "Anchorage",
    state: "Alaska",
    country: "United States",
    description: "Alaska's largest city, with remote infrastructure, energy and transport work.",
  },
  {
    slug: "atlanta",
    name: "Atlanta",
    state: "Georgia",
    country: "United States",
    description: "Major US transport and development hub in the south-east.",
  },
  {
    slug: "auckland",
    name: "Auckland",
    state: "Auckland",
    country: "New Zealand",
    description: "New Zealand's largest city, with major transport, water and housing programmes.",
  },
  {
    slug: "berlin",
    name: "Berlin",
    state: "Berlin",
    country: "Germany",
    description: "Germany's capital, with major transport, housing and infrastructure programmes.",
  },
  {
    slug: "bilbao",
    name: "Bilbao",
    state: "Basque Country",
    country: "Spain",
    description: "Basque industrial port city with major urban regeneration and transport work.",
  },
  {
    slug: "burnaby",
    name: "Burnaby",
    state: "British Columbia",
    country: "Canada",
    description: "Metro Vancouver hub for infrastructure, tech and industrial projects.",
  },
  {
    slug: "calgary",
    name: "Calgary",
    state: "Alberta",
    country: "Canada",
    description: "Energy and infrastructure hub in Alberta.",
  },
  {
    slug: "christchurch",
    name: "Christchurch",
    state: "Canterbury",
    country: "New Zealand",
    description: "Canterbury's rebuild and infrastructure hub in New Zealand's South Island.",
  },
  {
    slug: "cincinnati",
    name: "Cincinnati",
    state: "Ohio",
    country: "United States",
    description: "Ohio river city with major infrastructure, water and transport programmes.",
  },
  {
    slug: "darmstadt",
    name: "Darmstadt",
    state: "Hesse",
    country: "Germany",
    description: "Hesse engineering and research city near Frankfurt.",
  },
  {
    slug: "dubai",
    name: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    description: "The UAE's commercial hub, with towers, transport and mega-project work.",
  },
  {
    slug: "dublin",
    name: "Dublin",
    state: "County Dublin",
    country: "Ireland",
    description: "Ireland's capital, with major transport, water and housing programmes.",
  },
  {
    slug: "dusseldorf",
    name: "Düsseldorf",
    state: "North Rhine-Westphalia",
    country: "Germany",
    description: "Rhine-Ruhr business hub with major infrastructure and development work.",
  },
  {
    slug: "frankfurt",
    name: "Frankfurt",
    state: "Hesse",
    country: "Germany",
    description: "Germany's financial centre, with major transport and high-rise programmes.",
  },
  {
    slug: "glasgow",
    name: "Glasgow",
    state: "Scotland",
    country: "United Kingdom",
    description: "Scotland's largest city, with major transport, water and regeneration work.",
  },
  {
    slug: "hamburg",
    name: "Hamburg",
    state: "Hamburg",
    country: "Germany",
    description: "Germany's largest port city, with major marine, transport and infrastructure work.",
  },
  {
    slug: "karlsruhe",
    name: "Karlsruhe",
    state: "Baden-Württemberg",
    country: "Germany",
    description: "Baden-Württemberg engineering city with major transport and research work.",
  },
  {
    slug: "limerick",
    name: "Limerick",
    state: "County Limerick",
    country: "Ireland",
    description: "Mid-west Ireland hub with major transport and development projects.",
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    state: "England",
    country: "United Kingdom",
    description: "North-west England port city with major regeneration and transport work.",
  },
  {
    slug: "london",
    name: "London",
    state: "England",
    country: "United Kingdom",
    description: "The UK's largest engineering market, with major transport, building and infrastructure programmes.",
  },
  {
    slug: "lyon",
    name: "Lyon",
    state: "Auvergne-Rhône-Alpes",
    country: "France",
    description: "France's second city, with major transport, water and urban projects.",
  },
  {
    slug: "madrid",
    name: "Madrid",
    state: "Madrid",
    country: "Spain",
    description: "Spain's capital, with major transport, water and infrastructure programmes.",
  },
  {
    slug: "milan",
    name: "Milan",
    state: "Lombardy",
    country: "Italy",
    description: "Italy's engineering and construction capital, with major transport and building work.",
  },
  {
    slug: "mississauga",
    name: "Mississauga",
    state: "Ontario",
    country: "Canada",
    description: "Greater Toronto hub for infrastructure, transit and industrial projects.",
  },
  {
    slug: "montreal",
    name: "Montréal",
    state: "Quebec",
    country: "Canada",
    description: "Québec's largest city, with major transport, water and infrastructure programmes.",
  },
  {
    slug: "munich",
    name: "Munich",
    state: "Bavaria",
    country: "Germany",
    description: "Bavaria's capital, with major transport, building and research programmes.",
  },
  {
    slug: "muscat",
    name: "Muscat",
    state: "Muscat",
    country: "Oman",
    description: "Oman's capital, with major port, road and infrastructure programmes.",
  },
  {
    slug: "nanterre",
    name: "Nanterre",
    state: "Île-de-France",
    country: "France",
    description: "Paris business district hub with major transport and development work.",
  },
  {
    slug: "napier",
    name: "Napier",
    state: "Hawke's Bay",
    country: "New Zealand",
    description: "Hawke's Bay hub with major water, transport and resilience work.",
  },
  {
    slug: "new-york",
    name: "New York",
    state: "New York",
    country: "United States",
    description: "The USA's largest engineering market, with major transport, building and infrastructure programmes.",
  },
  {
    slug: "paris",
    name: "Paris",
    state: "Île-de-France",
    country: "France",
    description: "France's capital, with major transport, water and Grand Paris infrastructure programmes.",
  },
  {
    slug: "pickering",
    name: "Pickering",
    state: "Ontario",
    country: "Canada",
    description: "Greater Toronto hub for energy, infrastructure and industrial projects.",
  },
  {
    slug: "pittsburgh",
    name: "Pittsburgh",
    state: "Pennsylvania",
    country: "United States",
    description: "Pennsylvania hub with major transport, water and infrastructure renewal.",
  },
  {
    slug: "riyadh",
    name: "Riyadh",
    state: "Riyadh",
    country: "Saudi Arabia",
    description: "Saudi Arabia's capital, with giga-project, transport and infrastructure work.",
  },
  {
    slug: "rome",
    name: "Rome",
    state: "Lazio",
    country: "Italy",
    description: "Italy's capital, with major transport, water and heritage infrastructure work.",
  },
  {
    slug: "sengenthal",
    name: "Sengenthal",
    state: "Bavaria",
    country: "Germany",
    description: "Bavarian town hosting major bridge and structural engineering work.",
  },
  {
    slug: "tauranga",
    name: "Tauranga",
    state: "Bay of Plenty",
    country: "New Zealand",
    description: "Bay of Plenty port city with major transport and growth infrastructure.",
  },
  {
    slug: "vancouver",
    name: "Vancouver",
    state: "British Columbia",
    country: "Canada",
    description: "British Columbia's largest city, with major transport, water and seismic engineering work.",
  },
  {
    slug: "vancouver-wa",
    name: "Vancouver",
    state: "Washington",
    country: "United States",
    description: "Washington city on the Columbia River, with major transport and industrial work.",
  },
  {
    slug: "wasco",
    name: "Wasco",
    state: "California",
    country: "United States",
    description: "California Central Valley hub for heavy civil and infrastructure work.",
  },
  {
    slug: "watford",
    name: "Watford",
    state: "England",
    country: "United Kingdom",
    description: "Hertfordshire hub on London's north-west edge, with major rail and infrastructure work.",
  },
  {
    slug: "wellington",
    name: "Wellington",
    state: "Wellington",
    country: "New Zealand",
    description: "New Zealand's capital, with major transport, water and seismic resilience work.",
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
