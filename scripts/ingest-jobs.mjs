#!/usr/bin/env node
/**
 * Refreshes data/jobs.json from job APIs.
 *
 * Two cadences, one script (see .github/workflows/refresh-jobs.yml and
 * refresh-jobs-hourly.yml):
 *
 *   Daily full run (06:00 Australia/Sydney) — every source: Careerjet,
 *   Jooble, Adzuna and the employer Workday boards. This is the only run
 *   that touches the metered aggregator APIs.
 *
 *   Hourly light run (INGEST_MODE=hourly) — employer Workday boards ONLY.
 *   The aggregator APIs cannot be polled hourly, and this is a quota limit,
 *   not a choice:
 *     - Adzuna trial: 25 calls for the LIFETIME of the key; 4 calls per run
 *       means hourly polling would kill the key within hours (even daily
 *       use exhausts it in about a week — full access is £8/month).
 *     - Jooble free plan: 500 requests for the LIFETIME of the key;
 *       3 calls per run means hourly polling would kill the key in ~7 days
 *       (daily use lasts ~166 days).
 *     - Careerjet publisher keys have no published call cap, but the key is
 *       approved per locale (en_AU only) and hourly hammering risks the key.
 *   So hourly freshness comes from the employer boards, which need no key
 *   and carry the employer's own vacancy (the board already removes a
 *   vacancy when it closes). Aggregator listings refresh once a day.
 *
 * Every source is optional and skipped when its key is absent, so the pipeline
 * runs today with whatever you have registered:
 *
 *   Careerjet  CAREERJET_API_KEY            free publisher key (no card)
 *              https://www.careerjet.com/partners/api
 *   Jooble     JOOBLE_API_KEY               free key, 500 lifetime requests per key
 *              https://au.jooble.org/api/about   (AU keys only exist on the AU domain)
 *   Adzuna     ADZUNA_APP_ID + ADZUNA_APP_KEY   trial/paid — https://developer.adzuna.com
 *
 * Employer career sites (Workday, PageUp) need no key at all and are read
 * directly, so their ads carry the employer's own name and an apply link that
 * the employer maintains.
 *
 * Run with `pnpm ingest`, or automatically at 06:00 Australia/Sydney via
 * .github/workflows/refresh-jobs.yml, plus hourly via
 * .github/workflows/refresh-jobs-hourly.yml.
 *
 * Quota notes, because they shape the query counts below:
 *   - Careerjet publisher keys have no published call cap; we use 5 keywords
 *     x 2 pages = 10 calls per run.
 *   - Jooble's free plan is 500 requests for the *lifetime* of the key, so it
 *     gets 3 industry keywords x 2 pages = 6 calls per run (~83 days of
 *     daily runs).
 *   - Adzuna's approved account is still on the trial plan: 25 calls for the
 *     lifetime of the key (full access is £8/month). It therefore gets 4
 *     industry keywords x 1 page = 4 calls per run.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchWorkdayJobs } from './sources/workday.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_FILE = path.join(ROOT, 'data', 'jobs.json')

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID?.trim()
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY?.trim()
const CAREERJET_API_KEY = process.env.CAREERJET_API_KEY?.trim()
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY?.trim()

/**
 * Refresh mode. `hourly` (refresh-jobs-hourly.yml) reads the employer
 * Workday boards only — the metered aggregator APIs stay on the daily run,
 * because their lifetime quotas (Jooble 500 calls, Adzuna 25 calls) cannot
 * survive hourly polling. Anything else means the daily full run.
 */
const INGEST_MODE = (process.env.INGEST_MODE ?? 'full').trim().toLowerCase()
const IS_HOURLY = INGEST_MODE === 'hourly'
// Jooble issues one key per country domain and the key only works against that
// domain: an au.jooble.org key sent to jooble.org answers 403. Override with
// JOOBLE_BASE_URL if the key came from a different country edition.
const JOOBLE_BASE_URL = (process.env.JOOBLE_BASE_URL?.trim() || 'https://au.jooble.org').replace(
  /\/+$/,
  '',
)

const QUERIES = [
  'structural engineer',
  'structural engineering',
  'senior structural engineer',
  'bridge engineer',
  'civil structural engineer',
]
// "senior structural engineer" duplicates "structural engineer", so that call is
// spent on geotechnical vacancies instead: the board covers civil/structural
// work, and geotechnical sits in the same discipline.
const JOOBLE_INDUSTRY_QUERIES = [...QUERIES.slice(0, 2), 'geotechnical engineer']
// Adzuna is metered per call on the free plan, so it gets a deliberately small
// industry-only set instead of the full industry list.
const ADZUNA_QUERIES = [
  'structural engineer',
  'bridge engineer',
  'geotechnical engineer',
  'civil engineer',
]
const PAGES_PER_QUERY = 2
const RESULTS_PER_PAGE = 50
const LISTING_DAYS = 30

/* ------------------------------------------------------------------ helpers */

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Today in the site's timezone, so the 30-day window matches what it renders. */
function sydneyToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Stable short id for providers (Careerjet) that expose no job identifier. */
function shortHash(value) {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0
  return Math.abs(hash).toString(36)
}

function stripHtml(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h\d|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&(?:rsquo|lsquo|#39|apos);/gi, "'")
    .replace(/&(?:quot|ldquo|rdquo);/gi, '"')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim()
}

function truncate(text, max) {
  const value = String(text ?? '')
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/**
 * Jooble exposes no salary field, but plenty of ads state one in the text
 * ("$120k-$150k + super"). Reading it beats showing "Not available" on every
 * listing; anything that is not a plausible annual AUD figure is ignored.
 */
function parseSalaryFromText(text) {
  const source = String(text ?? '')
  // Hourly and daily rates cannot be reported as an annual salary.
  if (/\$\s?\d+(?:\.\d+)?\s*(?:\/|per\s)\s*(?:h|hr|hour|day|d)\b/i.test(source)) return null

  const values = []
  const money = /\$\s?(\d{1,3}(?:,\d{3})+|\d{2,3})\s?(k\b)?/gi
  let match
  while ((match = money.exec(source))) {
    const digits = match[1].replace(/,/g, '')
    const value = match[2] ? Number(digits) * 1000 : Number(digits)
    if (Number.isFinite(value) && value >= 40000 && value <= 500000) values.push(value)
  }

  if (values.length === 0) return null
  return { min: Math.min(...values), max: Math.max(...values) }
}

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

/** Careerjet dates look like "Wed,15 Nov 2025 19:13:43 GMT". */
function parseCareerjetDate(value) {
  const match = String(value ?? '').match(/(\d{1,2})[ ,-]+([A-Za-z]{3})[ ,-]+(\d{4})/)
  if (!match) return null
  const month = MONTHS[match[2].toLowerCase()]
  if (!month) return null
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`
}

function isoDate(value) {
  const candidate = String(value ?? '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null
}

/* ------------------------------------------------------------- taxonomy maps */

const CITY_STATE = {
  sydney: 'NSW',
  newcastle: 'NSW',
  wollongong: 'NSW',
  parramatta: 'NSW',
  melbourne: 'VIC',
  geelong: 'VIC',
  brisbane: 'QLD',
  'gold-coast': 'QLD',
  'sunshine-coast': 'QLD',
  cairns: 'QLD',
  townsville: 'QLD',
  perth: 'WA',
  adelaide: 'SA',
  hobart: 'TAS',
  launceston: 'TAS',
  canberra: 'ACT',
  darwin: 'NT',
}

const STATE_NAMES = {
  'new south wales': 'NSW',
  victoria: 'VIC',
  queensland: 'QLD',
  'western australia': 'WA',
  'south australia': 'SA',
  tasmania: 'TAS',
  'australian capital territory': 'ACT',
  'northern territory': 'NT',
}

/* Ordered most-specific-first so "senior structural" never matches plain "structural". */
const ROLE_RULES = [
  // Geotechnical titles become their own filter: "Geotechnical Engineer" must
  // not be filed under plain civil engineering.
  [/geotech/i, 'geotechnical-engineer'],
  [/principal structural|principal engineer/i, 'principal-structural-engineer'],
  [/senior structural|lead structural/i, 'senior-structural-engineer'],
  [/\bbridge/i, 'bridge-engineer'],
  [/project engineer/i, 'project-engineer'],
  [/design engineer|design manager/i, 'design-engineer'],
  // Thin disciplines file under the generic civil role; their discipline
  // comes from the keyword chips, not the role. Tunnelling is geotechnical.
  [/tunnel/i, 'geotechnical-engineer'],
  [/survey|water|hydraulic|hydrolog|\bdam\b|hydropower|\brail\b|coastal|marine|maritime|environment|climate|mining|material|highway|road|traffic|transport|track|catenary|\bocs\b/i, 'civil-engineer'],
  [/\bcivil\b/i, 'civil-engineer'],
]

// The board is for civil/structural work only: "geotechnical", "construction"
// and "bridge" count, generic "engineering" does not. The thin disciplines
// count too — a "Coastal Engineer" or "Materials Engineer" title belongs
// here just as a structural one does; the discipline chips are keyword-based,
// so a title the relevance filter rejects can never reach its chip.
const CIVIL_DISCIPLINE =
  /\b(structural|structures?|bridge|bridges|civil|geotechnical|construction|infrastructure|seismic|earthquake|concrete|steel|built environment|environment\w*|sustainab\w*|climate|coastal|marine|maritime|water|wastewater|hydraulic|hydrolog\w*|dam|dams|hydropower|hydroelectric|survey\w*|geospatial|material\w*|durability|rail\w*|tunnel\w*|transport|traffic|highway\w*|road\w*|pavement|airport|track|permanent way|catenary|\bocs\b|mining|minerals)\b/i
// Words that can only mean our discipline when they appear in a title, so they
// outrank a sibling discipline in the same title.
const STRONG_CIVIL =
  /\b(structural|structures?|civil|bridge|geotechnical|seismic|earthquake)\b/i
// Sibling disciplines advertised next to civil engineering. Their
// titles mention "engineering", which is not enough to belong here.
// "Mining" is NOT in this list: mining & resources is one of the board's own
// disciplines, so a Mining Engineer title belongs here; petroleum stays out.
const OTHER_DISCIPLINE =
  /\b(mechanical|mechatronic|robotics?|electrical|electronic|chemical|aerospace|aeronautical|combustion|process systems|software|computer science|data science|biomedical|petroleum|nursing|medical|psychology|law|business|accounting|finance|marketing|natural sciences|biology|chemistry|physics)\b/i
const NOISE_TITLE =
  /\b(draft|drafter|draught|bim|detailer|estimator|sales|recruit|talent|technician|labourer|laborer|welder|boilermaker|foreman|supervisor)\b/i
const VISA_PATTERN = /\b(visa sponsorship|sponsorship|sponsor(?:s|ed|ing)?|sponsored|482|tss|work visa)\b/i

/**
 * A job belongs on the board when its title names civil/structural work.
 * Sibling disciplines (mechanical, robotics, chemical…) must stay out.
 * The ad body is not consulted: a title that does not name the discipline
 * does not belong here.
 */
function isRelevantTitle(title, company, text) {
  if (NOISE_TITLE.test(title)) return false
  // "Civil and Mechanical Engineering" stays…
  if (STRONG_CIVIL.test(title)) return true
  // …but "Electrical, Mechanical and Infrastructure Engineering" does not:
  // the sibling discipline outranks a shared discipline name.
  if (OTHER_DISCIPLINE.test(title)) return false
  return CIVIL_DISCIPLINE.test(title)
}

function classifyRole(title) {
  for (const [pattern, slug] of ROLE_RULES) {
    if (pattern.test(title)) return slug
  }
  return 'structural-engineer'
}

/**
 * The board is industry-only: every listing it keeps is an industry role,
 * whatever the employer. There is no second sector any more.
 */
function classifySector(title, company) {
  return 'industry'
}

/** Providers give a free-text location, so infer city + state from that text. */
/**
 * Campus and suburb names that belong to a listed city. Without this, a UQ ad
 * at "St Lucia Campus" matches no city and falls back to the default state,
 * which would put a Brisbane vacancy on the NSW page.
 */
const CITY_ALIASES = {
  // Campus names: employer boards publish the campus, not the city, so an ad
  // at "Camperdown Campus" would otherwise land on the default state.
  'st lucia': 'brisbane',
  'gardens point': 'brisbane',
  'kelvin grove': 'brisbane',
  'sydney olympic park': 'sydney',
  camperdown: 'sydney',
  wallumattagal: 'sydney',
  'macquarie park': 'sydney',
  kensington: 'sydney',
  callaghan: 'newcastle',
  clayton: 'melbourne',
  parkville: 'melbourne',
  caulfield: 'melbourne',
  bundoora: 'melbourne',
  acton: 'canberra',
  'bedford park': 'adelaide',
  'waurn ponds': 'geelong',
}

/**
 * International cities, generated from the CITIES list in lib/taxonomy.ts
 * (every non-Australian hub there). Key is the lowercase city name as it
 * appears in a location string; value is [city slug, region, country].
 * The ingest cannot import the TypeScript taxonomy, so this map is a copy —
 * when a new international hub is added to CITIES, add it here too.
 * Vancouver is special-cased below (BC, Canada vs WA, United States).
 */
const INTERNATIONAL_CITIES = {
  aberdeen: ['aberdeen', 'Scotland', 'United Kingdom'],
  abha: ['abha', 'Aseer', 'Saudi Arabia'],
  'abu dhabi': ['abu-dhabi', 'Abu Dhabi', 'United Arab Emirates'],
  alula: ['al-ula', 'AlUla', 'Saudi Arabia'],
  anchorage: ['anchorage', 'Alaska', 'United States'],
  atlanta: ['atlanta', 'Georgia', 'United States'],
  auckland: ['auckland', 'Auckland', 'New Zealand'],
  berlin: ['berlin', 'Berlin', 'Germany'],
  bilbao: ['bilbao', 'Basque Country', 'Spain'],
  burnaby: ['burnaby', 'British Columbia', 'Canada'],
  calgary: ['calgary', 'Alberta', 'Canada'],
  christchurch: ['christchurch', 'Canterbury', 'New Zealand'],
  cincinnati: ['cincinnati', 'Ohio', 'United States'],
  darmstadt: ['darmstadt', 'Hesse', 'Germany'],
  dubai: ['dubai', 'Dubai', 'United Arab Emirates'],
  dublin: ['dublin', 'County Dublin', 'Ireland'],
  'düsseldorf': ['dusseldorf', 'North Rhine-Westphalia', 'Germany'],
  dusseldorf: ['dusseldorf', 'North Rhine-Westphalia', 'Germany'],
  frankfurt: ['frankfurt', 'Hesse', 'Germany'],
  glasgow: ['glasgow', 'Scotland', 'United Kingdom'],
  hamburg: ['hamburg', 'Hamburg', 'Germany'],
  karlsruhe: ['karlsruhe', 'Baden-Württemberg', 'Germany'],
  limerick: ['limerick', 'County Limerick', 'Ireland'],
  liverpool: ['liverpool', 'England', 'United Kingdom'],
  london: ['london', 'England', 'United Kingdom'],
  lyon: ['lyon', 'Auvergne-Rhône-Alpes', 'France'],
  madrid: ['madrid', 'Madrid', 'Spain'],
  milan: ['milan', 'Lombardy', 'Italy'],
  mississauga: ['mississauga', 'Ontario', 'Canada'],
  'montréal': ['montreal', 'Quebec', 'Canada'],
  montreal: ['montreal', 'Quebec', 'Canada'],
  munich: ['munich', 'Bavaria', 'Germany'],
  muscat: ['muscat', 'Muscat', 'Oman'],
  nanterre: ['nanterre', 'Île-de-France', 'France'],
  napier: ['napier', "Hawke's Bay", 'New Zealand'],
  'new york': ['new-york', 'New York', 'United States'],
  paris: ['paris', 'Île-de-France', 'France'],
  pickering: ['pickering', 'Ontario', 'Canada'],
  pittsburgh: ['pittsburgh', 'Pennsylvania', 'United States'],
  riyadh: ['riyadh', 'Riyadh', 'Saudi Arabia'],
  rome: ['rome', 'Lazio', 'Italy'],
  sengenthal: ['sengenthal', 'Bavaria', 'Germany'],
  tauranga: ['tauranga', 'Bay of Plenty', 'New Zealand'],
  vancouver: ['vancouver', 'British Columbia', 'Canada'],
  wasco: ['wasco', 'California', 'United States'],
  watford: ['watford', 'England', 'United Kingdom'],
  wellington: ['wellington', 'Wellington', 'New Zealand'],
}

/** Country names as they appear in location strings, longest first. */
const COUNTRY_NAMES = [
  ['united arab emirates', 'United Arab Emirates'],
  ['united states', 'United States'],
  ['united kingdom', 'United Kingdom'],
  ['saudi arabia', 'Saudi Arabia'],
  ['new zealand', 'New Zealand'],
  ['northern ireland', 'United Kingdom'],
  ['united states of america', 'United States'],
  ['great britain', 'United Kingdom'],
  ['australia', 'Australia'],
  ['germany', 'Germany'],
  ['ireland', 'Ireland'],
  ['france', 'France'],
  ['canada', 'Canada'],
  ['spain', 'Spain'],
  ['italy', 'Italy'],
  ['oman', 'Oman'],
  ['england', 'United Kingdom'],
  ['scotland', 'United Kingdom'],
  ['wales', 'United Kingdom'],
  ['u.a.e.', 'United Arab Emirates'],
  ['uae', 'United Arab Emirates'],
  ['usa', 'United States'],
  ['uk', 'United Kingdom'],
]

/**
 * Regions that pin a location to a country even when the country itself is
 * not named ("Houston, TX", "Toronto, Ontario"). US state abbreviations
 * exclude WA: "Perth, WA" is Western Australia, and "Seattle, WA" needs the
 * country named to tell them apart.
 */
const REGION_TO_COUNTRY = {
  // United States — state names and abbreviations (minus WA, see above).
  alabama: 'United States', alaska: 'United States', arizona: 'United States',
  arkansas: 'United States', california: 'United States', colorado: 'United States',
  connecticut: 'United States', delaware: 'United States', florida: 'United States',
  georgia: 'United States', hawaii: 'United States', idaho: 'United States',
  illinois: 'United States', indiana: 'United States', iowa: 'United States',
  kansas: 'United States', kentucky: 'United States', louisiana: 'United States',
  maine: 'United States', maryland: 'United States', massachusetts: 'United States',
  michigan: 'United States', minnesota: 'United States', mississippi: 'United States',
  missouri: 'United States', montana: 'United States', nebraska: 'United States',
  nevada: 'United States', 'new hampshire': 'United States', 'new jersey': 'United States',
  'new mexico': 'United States', 'new york': 'United States', 'north carolina': 'United States',
  'north dakota': 'United States', ohio: 'United States', oklahoma: 'United States',
  oregon: 'United States', pennsylvania: 'United States', 'rhode island': 'United States',
  'south carolina': 'United States', 'south dakota': 'United States', tennessee: 'United States',
  texas: 'United States', utah: 'United States', vermont: 'United States',
  virginia: 'United States', 'west virginia': 'United States', wisconsin: 'United States',
  wyoming: 'United States', 'district of columbia': 'United States',
  al: 'United States', ak: 'United States', az: 'United States', ar: 'United States',
  ca: 'United States', co: 'United States', ct: 'United States', de: 'United States',
  fl: 'United States', ga: 'United States', hi: 'United States', id: 'United States',
  il: 'United States', in: 'United States', ia: 'United States', ks: 'United States',
  ky: 'United States', la: 'United States', me: 'United States', md: 'United States',
  ma: 'United States', mi: 'United States', mn: 'United States', ms: 'United States',
  mo: 'United States', mt: 'United States', ne: 'United States', nv: 'United States',
  nh: 'United States', nj: 'United States', nm: 'United States', ny: 'United States',
  nc: 'United States', nd: 'United States', oh: 'United States', ok: 'United States',
  or: 'United States', pa: 'United States', ri: 'United States', sc: 'United States',
  sd: 'United States', tn: 'United States', tx: 'United States', ut: 'United States',
  vt: 'United States', va: 'United States', wv: 'United States', wi: 'United States',
  wy: 'United States',
  // Canada — provinces and territories.
  alberta: 'Canada', 'british columbia': 'Canada', manitoba: 'Canada',
  'new brunswick': 'Canada', 'newfoundland and labrador': 'Canada',
  'nova scotia': 'Canada', ontario: 'Canada', 'prince edward island': 'Canada',
  quebec: 'Canada', saskatchewan: 'Canada', yukon: 'Canada',
  'northwest territories': 'Canada', nunavut: 'Canada',
  ab: 'Canada', bc: 'Canada', mb: 'Canada', nb: 'Canada', nl: 'Canada',
  ns: 'Canada', on: 'Canada', pe: 'Canada', qc: 'Canada', sk: 'Canada',
  yt: 'Canada',
  // New Zealand regions.
  canterbury: 'New Zealand', otago: 'New Zealand', southland: 'New Zealand',
  'bay of plenty': 'New Zealand', waikato: 'New Zealand',
  // Germany, France, Spain, Italy regions.
  bavaria: 'Germany', hesse: 'Germany', 'baden-württemberg': 'Germany',
  'north rhine-westphalia': 'Germany', berlin: 'Germany', hamburg: 'Germany',
  'île-de-france': 'France', 'auvergne-rhône-alpes': 'France',
  'basque country': 'Spain', madrid: 'Spain', lombardy: 'Italy', lazio: 'Italy',
  'county dublin': 'Ireland', 'county limerick': 'Ireland',
  aseer: 'Saudi Arabia', riyadh: 'Saudi Arabia',
}

function classifyLocation(text) {
  const source = String(text ?? '').replace(/\s+/g, ' ').trim()
  const lower = source.toLowerCase()
  // Aliases only widen the city match; the displayed location keeps the ad's own text.
  const haystack = Object.entries(CITY_ALIASES).reduce(
    (value, [alias, city]) =>
      new RegExp(`\\b${alias}\\b`, 'i').test(value) ? `${value} ${city}` : value,
    source,
  )

  let state = null
  for (const [name, code] of Object.entries(STATE_NAMES)) {
    if (lower.includes(name)) {
      state = code
      break
    }
  }
  state = state ?? source.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/)?.[1] ?? null

  let citySlug = null
  let cityName = null

  for (const [slug, code] of Object.entries(CITY_STATE)) {
    const label = slug.replace(/-/g, ' ')
    if (new RegExp(`\\b${label}\\b`, 'i').test(haystack)) {
      // Newcastle and Perth exist on both sides of the world: a posting that
      // names England/Scotland/the UK is the British one, not NSW/WA.
      if (
        (slug === 'newcastle' || slug === 'perth') &&
        /\b(england|scotland|united kingdom|\buk\b)\b/i.test(source)
      ) {
        continue
      }
      citySlug = slug
      cityName = label.replace(/\b\w/g, (char) => char.toUpperCase())
      state = state ?? code
      break
    }
  }

  if (cityName) {
    return { citySlug, state: state ?? 'NSW', location: `${cityName}, ${state ?? 'NSW'}` }
  }

  // No Australian city matched: try the international maps before falling
  // back to Australia, or a London posting would land in NSW.
  const first = source.split(',')[0].trim()
  const segments = source
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  const titleCase = (value) =>
    String(value)
      .replace(/(^|[\s-])\S/g, (match) => match.toUpperCase())
      .replace(/\bAnd\b/g, 'and')

  // 1. A known international city name in the FIRST segment — the city part
  // of "City, Region, Country". A city name in a later segment is the
  // state/region, not the city: "White Plains, New York" is White Plains,
  // not New York City. And a region the ad itself states ("Birmingham,
  // Alabama") beats the mapped city ("Birmingham, UK") when it pins a
  // different country.
  for (const [name, [slug, region, country]] of Object.entries(INTERNATIONAL_CITIES)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!new RegExp(`\\b${escaped}\\b`, 'i').test(first)) continue
    // Vancouver, WA (United States) vs Vancouver, BC (Canada): the state
    // code alone decides it, since the city name is the same.
    if (
      name === 'vancouver' &&
      (/\bwashington\b/i.test(source) || segments.includes('wa'))
    ) {
      return {
        citySlug: 'vancouver-wa',
        state: 'Washington',
        location: 'Vancouver, Washington',
        country: 'United States',
      }
    }
    // A stated region that pins another country voids the mapped city;
    // one in the same country but with a different name is the display
    // region (Newark, Delaware is Delaware, not the mapped New Jersey).
    let displayRegion = region
    let voided = false
    for (const [stated, statedCountry] of Object.entries(REGION_TO_COUNTRY)) {
      const matched =
        stated.length === 2
          ? segments.includes(stated)
          : new RegExp(`\\b${stated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)
      if (!matched) continue
      if (statedCountry !== country) {
        voided = true
        break
      }
      const statedName =
        stated.length === 2
          ? source
              .split(',')
              .map((part) => part.trim())
              .find((part) => part.toLowerCase() === stated) ?? stated.toUpperCase()
          : titleCase(stated)
      if (statedName !== region) displayRegion = statedName
      break
    }
    if (voided) continue
    const cityName = titleCase(name)
    return {
      citySlug: slug,
      state: displayRegion,
      location: cityName === displayRegion ? `${cityName}, ${country}` : `${cityName}, ${displayRegion}`,
      country,
    }
  }

  // 2. A country name in the location string; the city is the first part.
  // Prefer a named region (Ontario, Bavaria…) as the state when one is there.
  for (const [name, country] of COUNTRY_NAMES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(lower)) {
      const city = first || country
      // An Australian state code the ad itself states ("Cooma, NSW") is the
      // state; only when there is none does the country stand in for it.
      let displayRegion = country === 'Australia' && state ? state : country
      for (const [region, regionCountry] of Object.entries(REGION_TO_COUNTRY)) {
        if (regionCountry !== country) continue
        // Two-letter codes only count as their own comma-separated segment
        // (", TX"), never as a bare word — "in" must not match "in London".
        const matched =
          region.length === 2
            ? segments.includes(region)
            : new RegExp(`\\b${region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(
                lower,
              )
        if (matched) {
          displayRegion =
            region.length === 2
              ? (source
                  .split(',')
                  .map((part) => part.trim())
                  .find((part) => part.toLowerCase() === region) ?? region.toUpperCase())
              : titleCase(region)
          break
        }
      }
      let citySlug = slugify(city) || 'australia'
      // A slug that collides with an Australian city (Perth, Scotland) gets
      // the country appended so it never merges with the Australian one.
      if (CITY_STATE[citySlug] && country !== 'Australia') {
        citySlug = `${citySlug}-${slugify(country)}`
      }
      return {
        citySlug,
        state: displayRegion,
        location: `${city}, ${displayRegion}`,
        country,
      }
    }
  }

  // 3. A region that pins the country (state/province name, or a state code
  // as its own comma-separated segment — never as a bare word, so "in" can
  // only mean Indiana when the ad itself writes ", IN").
  for (const [region, country] of Object.entries(REGION_TO_COUNTRY)) {
    const isCode = region.length === 2
    const matched = isCode
      ? segments.includes(region)
      : new RegExp(
          `\\b${region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i',
        ).test(lower)
    if (matched) {
      const city = first || country
      const displayRegion = isCode
        ? source
            .split(',')
            .map((part) => part.trim())
            .find((part) => part.toLowerCase() === region) ?? region.toUpperCase()
        : titleCase(region)
      let citySlug = slugify(city) || 'australia'
      if (CITY_STATE[citySlug] && country !== 'Australia') {
        citySlug = `${citySlug}-${slugify(country)}`
      }
      return {
        citySlug,
        state: displayRegion,
        location: `${city}, ${displayRegion}`,
        country,
      }
    }
  }

  cityName = first || 'Australia'
  citySlug = slugify(cityName) || 'australia'

  return { citySlug, state: state ?? 'NSW', location: `${cityName}, ${state ?? 'NSW'}` }
}

/* ------------------------------------------------------------------ mapping */

function buildJob({
  source,
  externalId,
  title,
  company,
  description,
  postedAt,
  applyUrl,
  locationText,
  salaryMin,
  salaryMax,
}) {
  const cleanTitle = String(title ?? '').trim()
  // No stand-in company name: some Jooble ads name no employer, and "Unnamed
  // employer" on a card reads like a gap in the board. The empty string is kept
  // and the UI omits the line instead.
  const rawCompany = String(company ?? '').trim()
  const cleanCompany = /^(unnamed employer|unknown( employer)?|n\/?a|none)$/i.test(rawCompany)
    ? ''
    : rawCompany

  if (!cleanTitle || !externalId || !postedAt) return null

  const text = stripHtml(description)
  if (!isRelevantTitle(cleanTitle, cleanCompany, text)) return null

  const { citySlug, state, location, country } = classifyLocation(locationText)

  const hasRealSalary =
    Number.isFinite(salaryMin) && Number.isFinite(salaryMax) && salaryMax > 0 && salaryMax >= salaryMin
  const salary = hasRealSalary ? { min: salaryMin, max: salaryMax } : parseSalaryFromText(text)

  const tags = [
    /contract|fixed term/i.test(text) ? 'Contract' : null,
    /part time|part-time/i.test(text) ? 'Part time' : null,
    VISA_PATTERN.test(text) ? 'Visa sponsorship' : null,
  ]
    .filter(Boolean)
    .slice(0, 4)

  return {
    id: `${source}-${externalId}`,
    externalId: String(externalId),
    slug: `${[slugify(cleanTitle), slugify(cleanCompany)].filter(Boolean).join('-')}-${externalId}`,
    title: cleanTitle,
    roleSlug: classifyRole(cleanTitle),
    sector: classifySector(cleanTitle, cleanCompany),
    organisation: cleanCompany,
    city: citySlug,
    state,
    // Explicit for international listings: without it, a city outside the
    // taxonomy would be filed under Australia by countryOfJob.
    ...(country && country !== 'Australia' ? { country } : {}),
    location,
    ...(salary ? { salaryMin: salary.min, salaryMax: salary.max } : {}),
    salaryPeriod: 'year',
    employmentType: /part[- ]time/i.test(text) ? 'part-time' : /contract|fixed term/i.test(text) ? 'contract' : 'full-time',
    workArrangement: /\b(remote|work from home|wfh)\b/i.test(text)
      ? 'remote'
      : /\bhybrid\b/i.test(text)
        ? 'hybrid'
        : 'onsite',
    visaSponsorship: VISA_PATTERN.test(text),
    featured: false,
    postedAt,
    closingDate: addDays(postedAt, LISTING_DAYS),
    summary: truncate(text.split('\n')[0] || cleanTitle, 200),
    // Full ad text, not a snippet: the detail page shows the whole ad, so
    // keep up to 20k characters here. Aggregator snippets are short anyway;
    // the enrichment step below replaces them with the full text.
    description: truncate(text, 20000),
    responsibilities: [],
    requirements: [],
    tags,
    applyUrl: String(applyUrl ?? ''),
    source,
  }
}

/* ------------------------------------------------------- source: careerjet */

async function fetchCareerjetPage(keywords, page) {
  const params = new URLSearchParams({
    locale_code: 'en_AU',
    keywords,
    page: String(page),
    page_size: String(RESULTS_PER_PAGE),
    fragment_size: '1200',
    sort: 'date',
    // Careerjet requires the originating client; a scheduled job has no user,
    // so identify it as our own unattended ingest.
    user_ip: '127.0.0.1',
    user_agent: 'structuraljobaus-ingest/1.0 (+https://structuraljobaus.vercel.app)',
  })

  const auth = Buffer.from(`${CAREERJET_API_KEY}:`).toString('base64')
  const response = await fetch(`https://search.api.careerjet.net/v4/query?${params.toString()}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  })

  if (!response.ok) {
    // Careerjet explains 403s in the body (invalid key, missing/blocked client
    // params, or a site that has not been approved yet), so surface it.
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Careerjet "${keywords}" page ${page} returned HTTP ${response.status}${detail ? ` — ${detail.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`,
    )
  }

  const body = await response.json()
  return body?.type === 'JOBS' && Array.isArray(body.jobs) ? body.jobs : []
}

function fromCareerjet(raw) {
  const salaryYearly = String(raw.salary_type ?? 'Y').toUpperCase() === 'Y'
  const min = Number(raw.salary_min)
  const max = Number(raw.salary_max)

  return buildJob({
    source: 'careerjet',
    externalId: shortHash(String(raw.url ?? `${raw.title}-${raw.company}-${raw.date}`)),
    title: raw.title,
    company: raw.company,
    description: raw.description,
    postedAt: parseCareerjetDate(raw.date),
    applyUrl: raw.url,
    locationText: raw.locations,
    salaryMin: salaryYearly && Number.isFinite(min) ? min : NaN,
    salaryMax: salaryYearly && Number.isFinite(max) ? max : NaN,
  })
}

/* ----------------------------------------------------------- source: jooble */

async function fetchJooble(keywords) {
  const response = await fetch(`${JOOBLE_BASE_URL}/api/${JOOBLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, location: 'Australia', page: 1, ResultOnPage: RESULTS_PER_PAGE }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Jooble "${keywords}" returned HTTP ${response.status}${detail ? ` — ${detail.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`,
    )
  }

  const body = await response.json()
  return Array.isArray(body.jobs) ? body.jobs : []
}

function fromJooble(raw) {
  return buildJob({
    source: 'jooble',
    externalId: raw.id ? String(raw.id) : shortHash(String(raw.link ?? raw.title)),
    title: raw.title,
    company: raw.company,
    description: [raw.snippet, raw.type].filter(Boolean).join('\n'),
    postedAt: isoDate(raw.updated),
    applyUrl: raw.link,
    locationText: raw.location,
    salaryMin: NaN,
    salaryMax: NaN,
  })
}

/* ----------------------------------------------------------- source: adzuna */

async function fetchAdzunaPage(what, page) {
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: String(RESULTS_PER_PAGE),
    what,
    sort_by: 'date',
    'content-type': 'application/json',
  })

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/au/search/${page}?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Adzuna ${what} page ${page} returned HTTP ${response.status}${detail ? ` — ${detail.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`,
    )
  }

  const body = await response.json()
  return Array.isArray(body.results) ? body.results : []
}

function fromAdzuna(raw) {
  const area = (raw?.location?.area ?? []).map((part) => String(part))
  const locationText = [area[area.length - 1], raw?.location?.display_name].filter(Boolean).join(', ')

  // Adzuna flags predicted salaries; publishing them as fact would mislead.
  const hasRealSalary =
    raw.salary_is_predicted === 0 &&
    Number.isFinite(raw.salary_min) &&
    Number.isFinite(raw.salary_max)

  return buildJob({
    source: 'adzuna',
    externalId: raw.id ? String(raw.id) : null,
    title: raw.title,
    company: raw.company?.display_name,
    description: raw.description,
    postedAt: isoDate(raw.created),
    applyUrl: raw.redirect_url,
    locationText,
    salaryMin: hasRealSalary ? raw.salary_min : NaN,
    salaryMax: hasRealSalary ? raw.salary_max : NaN,
  })
}

/* --------------------------------------------------------------------- main */

// Employer-direct sources win every tie: their ad carries the real employer and
// an apply link that stays live for as long as the vacancy does.
const PRIORITY = { workday: 0, careerjet: 1, jooble: 2, adzuna: 3 }

/**
 * Text shown by an aggregator when the vacancy behind a listing has gone. A job
 * like this sends the visitor to a dead end, so it is dropped instead.
 */
const DEAD_LINK_MARKERS =
  /no longer (?:available|accepting|advertised|open)|has been filled|position (?:has been |is )?(?:closed|filled)|job (?:has )?expired|this (?:job|vacancy|advert) is no longer/i

const LINK_CHECK_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

/**
 * True only when the link is provably dead: a gone status, or the aggregator's
 * own "no longer available" notice. A 403, a timeout or a 5xx is treated as
 * unknown and the listing is kept — a blocked bot is not evidence that a real
 * vacancy has closed.
 */
async function isDeadApplyLink(url) {
  if (!url) return false
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': LINK_CHECK_UA, Accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(10000),
    })
    if (response.status === 404 || response.status === 410) return true
    if (!response.ok) return false
    const text = (await response.text()).slice(0, 20000)
    return DEAD_LINK_MARKERS.test(text)
  } catch {
    return false
  }
}

/**
 * Jooble's API returns only a ~300-character snippet, so a detail page built
 * from the snapshot would show a cut-off ad. The Jooble job page itself
 * carries the full ad as JobPosting JSON-LD — fetch it and replace the
 * snippet. Best effort only: a blocked fetch, a missing JSON-LD block or a
 * short text keeps the snippet, never drops the listing.
 */
async function fetchFullDescription(url) {
  if (!url) return null
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': LINK_CHECK_UA, Accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null
    const html = await response.text()
    for (const match of html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        const data = JSON.parse(match[1])
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item && item['@type'] === 'JobPosting' && item.description) {
            const text = stripHtml(String(item.description))
            if (text.length > 500) return text
          }
        }
      } catch {
        // Malformed JSON-LD — try the next block.
      }
    }
    return null
  } catch {
    return false
  }
}

/** Replaces Jooble snippets with the full ad text, concurrently. */
async function enrichDescriptions(jobs, concurrency = 8) {
  const queue = jobs.filter(
    (job) => job.source === 'jooble' && (!job.description || job.description.length < 2000),
  )
  let enriched = 0

  async function worker() {
    for (;;) {
      const job = queue.shift()
      if (!job) return
      const full = await fetchFullDescription(job.applyUrl)
      if (full) {
        job.description = full.slice(0, 20000)
        const firstLine = full
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line.length > 0)
        job.summary = truncate(firstLine ?? job.title, 200)
        enriched++
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  console.log(`[ingest] Full descriptions: ${enriched} of ${queue.length} Jooble snippets enriched.`)
  return jobs
}

/** Checks third-party links concurrently and returns the still-live listings. */
async function dropDeadLinks(jobs, concurrency = 8) {
  const queue = [...jobs]
  const dead = new Set()

  async function worker() {
    for (;;) {
      const job = queue.shift()
      if (!job) return
      if (await isDeadApplyLink(job.applyUrl)) dead.add(job.id)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker))
  const kept = jobs.filter((job) => !dead.has(job.id))
  console.log(`[ingest] Link check: ${dead.size} expired of ${jobs.length}, ${kept.length} kept.`)
  return kept
}

function dedupeKey(job) {
  return `${slugify(job.title)}|${slugify(job.organisation)}|${job.city}`
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'))
  } catch {
    return { generatedAt: null, source: 'none', jobs: [] }
  }
}

async function collect(queries, fetchPage, mapJob, label, calls, pages = PAGES_PER_QUERY) {
  const found = []
  for (const query of queries) {
    for (let page = 1; page <= pages; page++) {
      const results = await fetchPage(query, page)
      calls.count++
      if (results.length === 0) break
      for (const raw of results) {
        const job = mapJob(raw)
        if (job) found.push(job)
      }
    }
  }
  console.log(`[ingest] ${label}: ${found.length} matching listings from ${calls.count} calls`)
  return found
}

async function main() {
  const calls = { count: 0 }
  const used = []
  const merged = new Map()
  // Read before any source so the low-yield guard below can compare against
  // the previous snapshot.
  const existing = await readExisting()

  const add = (jobs, source) => {
    used.push(source)
    for (const job of jobs) {
      const key = dedupeKey(job)
      const existing = merged.get(key)
      if (!existing || PRIORITY[source] < PRIORITY[existing.source]) {
        merged.set(key, job)
      }
    }
  }

  if (!IS_HOURLY && CAREERJET_API_KEY) {
    try {
      add(await collect(QUERIES, fetchCareerjetPage, fromCareerjet, 'Careerjet', calls), 'careerjet')
    } catch (error) {
      console.warn(`[ingest] Careerjet failed: ${error instanceof Error ? error.message : error}`)
    }
  } else if (IS_HOURLY) {
    console.log('[ingest] Hourly run — skipping Careerjet (daily run only).')
  } else {
    console.warn('[ingest] CAREERJET_API_KEY not set — skipping Careerjet.')
  }

  if (!IS_HOURLY && JOOBLE_API_KEY) {
    try {
      add(
        await collect(
          JOOBLE_INDUSTRY_QUERIES,
          (keywords) => fetchJooble(keywords),
          fromJooble,
          'Jooble',
          calls,
        ),
        'jooble',
      )
    } catch (error) {
      console.warn(`[ingest] Jooble failed: ${error instanceof Error ? error.message : error}`)
    }
  } else if (IS_HOURLY) {
    // Jooble's free plan is 500 requests for the lifetime of the key: hourly
    // polling (3 calls x 24) would exhaust it in about a week.
    console.log('[ingest] Hourly run — skipping Jooble (daily run only, lifetime quota).')
  } else {
    console.warn('[ingest] JOOBLE_API_KEY not set — skipping Jooble.')
  }

  if (!IS_HOURLY && ADZUNA_APP_ID && ADZUNA_APP_KEY) {
    try {
      add(await collect(ADZUNA_QUERIES, fetchAdzunaPage, fromAdzuna, 'Adzuna', calls, 1), 'adzuna')
    } catch (error) {
      console.warn(`[ingest] Adzuna failed: ${error instanceof Error ? error.message : error}`)
    }
  } else if (IS_HOURLY) {
    // Adzuna trial is 25 calls for the lifetime of the key: hourly polling
    // would exhaust it within hours. It stays on the daily run.
    console.log('[ingest] Hourly run — skipping Adzuna (daily run only, lifetime quota).')
  } else if (ADZUNA_APP_ID || ADZUNA_APP_KEY) {
    // Adzuna needs the pair; one secret on its own is a half-finished setup, so
    // say which is missing instead of skipping the source without explanation.
    console.warn(
      `[ingest] Adzuna skipped: ${ADZUNA_APP_ID ? 'ADZUNA_APP_KEY' : 'ADZUNA_APP_ID'} is not set (both are required).`,
    )
  }

  // Employer career sites are read directly, so these ads need no aggregator:
  // they carry the employer's own name and a link that stays under their control.
  // The hourly run spends one page per term (not two) to keep the request
  // volume polite: ~100 search calls an hour across the six boards.
  const { jobs: employerRaws, readCompanies: readWorkdayCompanies } = await fetchWorkdayJobs(
    undefined,
    { pagesPerTerm: IS_HOURLY ? 1 : 2 },
  )
  const employerJobs = employerRaws.map(buildJob).filter(Boolean)
  if (employerJobs.length > 0) add(employerJobs, 'workday')

  if (used.length === 0) {
    console.warn('[ingest] No source produced listings — keeping the previous snapshot.')
    console.warn('[ingest] Missing credentials are skipped; failures are reported above.')
    return
  }

  // No cap on how many listings are published: every vacancy inside its 30-day
  // window is kept, so a busy geotechnical week can never push an older
  // structural ad off the board.
  const byNewest = (a, b) => b.postedAt.localeCompare(a.postedAt)
  const today = sydneyToday()
  const fresh = [...merged.values()]
    .filter((job) => job.closingDate >= today)
    .sort(byNewest)

  // Employer-direct links point at the employer's own board, which already
  // removes a vacancy when it closes, so only aggregator links need a liveness
  // test before publication.
  const directFromEmployer = (job) => job.source === 'workday'
  const checked = await dropDeadLinks(fresh.filter((job) => !directFromEmployer(job)))

  // Listings the fetched sources cannot produce — the international jobs
  // collected directly from company career sites, and any other manual
  // additions — must survive a refresh: a rebuild from sources alone would
  // wipe them. Carry over every still-open listing whose source was NOT
  // fetched this run (a fetched source's silence means the vacancy closed;
  // an unfetched source says nothing about it). Expiry still comes from
  // closingDate, so a carried listing leaves the board on its own.
  // 'workday' needs a finer key than the source alone: it covers several
  // company boards, and only the boards that answered this run were read —
  // a vacancy from a board that failed, or from a company with no board
  // configured, must be carried, not dropped because another employer's
  // board was silent about it.
  const sourceWasRead = (job) =>
    job.source === 'workday'
      ? readWorkdayCompanies.has(String(job.organisation ?? '').toLowerCase())
      : used.includes(job.source)
  const carried = []
  if (Array.isArray(existing.jobs)) {
    const seenKeys = new Set(
      [...checked, ...fresh.filter(directFromEmployer)].map(dedupeKey),
    )
    for (const job of existing.jobs) {
      if (!job || job.closingDate < today) continue
      if (sourceWasRead(job)) continue
      const key = dedupeKey(job)
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      carried.push(job)
    }
  }
  if (carried.length > 0) {
    console.log(
      `[ingest] Carried over ${carried.length} still-open listings from sources not fetched this run.`,
    )
  }

  const jobs = [...checked, ...fresh.filter(directFromEmployer), ...carried].sort(byNewest)

  if (jobs.length === 0) {
    console.warn('[ingest] No matching structural engineering vacancies returned — keeping the previous snapshot.')
    return
  }

  if (jobs.length < 5 && Array.isArray(existing.jobs) && existing.jobs.length > jobs.length) {
    console.warn(
      `[ingest] Only ${jobs.length} listings returned; keeping the previous ${existing.jobs.length}.`,
    )
    return
  }

  // Jooble snippets are cut off mid-sentence; replace them with the full ad
  // text from the Jooble job page before publishing. Only listings fetched
  // this run need it: carried-over Jooble ads were already enriched when
  // they first arrived, so re-fetching them every hour would be pure waste.
  await enrichDescriptions([...checked, ...fresh.filter(directFromEmployer)])

  await mkdir(path.dirname(DATA_FILE), { recursive: true })
  await writeFile(
    DATA_FILE,
    `${JSON.stringify(
      { generatedAt: new Date().toISOString(), source: used.join('+'), jobs },
      null,
      2,
    )}\n`,
    'utf8',
  )

  const fromBoards = jobs.filter((job) => directFromEmployer(job)).length
  console.log(
    `[ingest] Wrote ${jobs.length} industry listings (${fromBoards} direct from employer boards) from ${used.join(', ')} using ${calls.count} API calls.`,
  )
}

/* Exported for the classification checks; running the file still ingests. */
export { buildJob, classifySector, classifyLocation, isRelevantTitle, parseSalaryFromText, fromJooble }

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  main().catch((error) => {
    console.error('[ingest] Failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
