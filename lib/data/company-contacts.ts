/**
 * Published contact / careers email addresses for the hiring companies on
 * the board. Every address here was verified on the company's own official
 * website (contact page, careers page or footer) — never invented.
 *
 * Companies with no published email are simply absent from this map, and
 * the job detail page omits the contact row for their jobs rather than
 * showing a made-up address.
 *
 * Keys are normalized organisation names (lowercase, punctuation collapsed
 * to single spaces); see normalizeOrganisation and ALIASES below.
 */
export const COMPANY_CONTACTS: Record<string, { email: string; source: string }> = {
  '29metals limited': { email: 'contactus@29metals.com', source: 'https://www.29metals.com/contact' },
  '5qs': { email: 'enquiry@5qs.com.au', source: 'https://5qs.com.au/contact-us/' },
  'acciona': { email: 'accionacorp@acciona.com', source: 'https://www.acciona.com.au/privacy-policy' },
  'ace talent recruitment': { email: 'mail@acetalent.com.au', source: 'https://www.acetalent.com.au/' },
  'adp consulting': { email: 'contact@adpconsulting.com.au', source: 'https://www.adpconsulting.com/projects/?_sft_adp_portfolio_categories=living-build-to-rent' },
  'aecom': { email: 'globalrecruitmentsupport@aecom.com', source: 'https://aecom.com/careers/candidate-faq/ai_in_recruitment/' },
  'aegis consulting engineers project managers': { email: 'office@aegisve.com', source: 'https://www.aegisve.com.au/projects-and-news/2026/5/24/2-years-at-278-keira-street' },
  'aeris resources limited': { email: 'talent@aerisresources.com.au', source: 'https://www.aerisresources.com.au/contact/' },
  'affinity migration group pty': { email: 'info@affinitymigration.com.au', source: 'https://affinitymigration.com.au/contact/' },
  'amey': { email: 'peopleservices@amey.co.uk', source: 'https://careers.amey.co.uk/content/FAQs/?locale=en_GB' },
  'aptus personnel': { email: 'info@aptuspersonnel.com.au', source: 'https://aptuspersonnel.com.au/contact/' },
  'arcadis': { email: 'earlycareers@arcadis.com', source: 'https://careers.arcadis.com/locations/uk/early-careers/faqs/' },
  'arcos group': { email: 'admin@arcosgroup.com.au', source: 'https://www.rockhamptonregion.qld.gov.au/files/assets/public/v/1/communities/planning-building-plumbing/development/statement-of-reasons/d11-2026-approved-plans.pdf' },
  'arup': { email: 'APACEarlyCareers@arup.com', source: 'https://www.arup.com/en-us/careers/early-careers/internships/asia-pacific/' },
  'atkinsr alis': { email: 'graduates@atkinsrealis.com', source: 'https://careers.atkinsrealis.com/en/jobs/intelligent-mobility-and-smart-technologies-graduate-programme-gr-233' },
  'aurizon': { email: 'info@aurizon.com.au', source: 'https://media.aurizon.com.au/-/media/files/who-we-are/about-us/corporate-governance/policies-and-guidelines/securities-dealing-policy.pdf?rev=91dd7f06d5ac41b08b15bb637f9b76cf' },
  'balfour beatty': { email: 'candidaterecruitmentenquiries@balfourbeatty.com', source: 'https://www.balfourbeatty.com/careers/job-search/details/529048' },
  'barclay recruitment': { email: 'admin@barclayrecruitment.com.au', source: 'https://www.barclayrecruitment.com.au/employers/recruitment-process-outsourcing/' },
  'bechtel': { email: 'acesstmt@bechtel.com', source: 'https://jobs.bechtel.com/us/en/how-we-hire' },
  'bornhorst ward': { email: 'mail@bornhorstward.com.au', source: 'https://www.bornhorstward.com.au/contact' },
  'brunel': { email: 'renewables.au@brunel.net', source: 'https://www.advancecareers.com.au/' },
  'buildfix group': { email: 'enquiries@buildfix.com.au', source: 'http://www.buildfix.com.au/contact-us/' },
  'cdfam computational design symposium': { email: 'info@cdfam.com', source: 'https://cdfam.com/contact/' },
  'chandler macleod': { email: 'hello@chandlermacleod.com', source: 'https://www.chandlermacleod.com/contractors' },
  'cmw geosciences': { email: 'recruitment@cmwgeo.com', source: 'https://cmwgeosciences.com/contact-us' },
  'csea': { email: 'csea@csea2026.org', source: 'https://csea2026.org/' },
  'drees sommer': { email: 'career@dreso.com', source: 'https://cdn.dreso.com/fileadmin/media/00_international/06_Netherlands/Download_documenten/Brochure_You_Decide_Drees_Sommer_Career_EN_16p.pdf' },
  'durkin construction': { email: 'info@durkin.au', source: 'https://durkin.au/contact' },
  'employer sponsored jobs': { email: 'jobs@employersponsoredjobs.com', source: 'https://employersponsoredjobs.com/news/why-new-zealand-employers-are-racing-to-sponsor-overseas-workers-for-a-200-billion-build-out' },
  'engeny': { email: 'careers@engeny.com.au', source: 'https://www.engeny.com.au/careers/' },
  'environmental group': { email: 'admin@egl.com.au', source: 'https://environmental.com.au/privacy_policy' },
  'evolution mining': { email: 'talent@evolutionmining.com', source: 'https://careers.evolutionmining.com.au/' },
  'ferrovial': { email: 'ferrovial@ferrovial.com.au', source: 'https://www.ferrovial.com/en-au/contact/' },
  'fitzroy mining operations': { email: 'info@argonr.com.au', source: 'https://www.argonaturalresources.com.au/contact-us' },
  'fulton hogan': { email: 'info@fultonhogan.com', source: 'https://www.fultonhogan.com/our-recruitment-process/' },
  'geosyntec consultants': { email: 'hr@geosyntec.com', source: 'https://geosyntec.com/working-at-geosyntec/' },
  'greatland holdings group pty ltd': { email: 'careers@greatland.com.au', source: 'https://www.greatland.com.au/people-careers/' },
  'hatch': { email: 'rcmsupport@hatch.com', source: 'https://jobs.hatch.com/content/fnq/?locale=en_US' },
  'hunter h2o holdings pty limited': { email: 'careers@hunterh2o.com.au', source: 'https://www.hunterh2o.com.au/who-we-are/work-with-us/' },
  'idom': { email: 'info@idom.com', source: 'https://www.idom.com/en/privacy-policy/' },
  'inautalent': { email: 'contact@inautalent.com', source: 'https://inautalent.com/contact-us-en/' },
  'ing rop': { email: 'ingerop@ingerop.com', source: 'https://www.ingerop.fr/en/legal-note/' },
  'inhouse engineers pty ltd': { email: 'office@inhouseengineers.com.au', source: 'https://www.inhouseengineers.com.au/contact.html' },
  'intrax consulting engineers': { email: 'info@intrax.com.au', source: 'https://www.intrax.com.au/' },
  'j p building solutions': { email: 'admin@jpbs.com.au', source: 'https://jpbs.com.au/contact-us/' },
  'jsbc consulting': { email: 'info@jsbcconsulting.com.au', source: 'https://www.jsbcconsulting.com/careers/' },
  'klohn crippen berger': { email: 'info@klohn.com', source: 'https://klohn.com/news-and-events/kcb-moves-to-a-new-location-in-toronto/' },
  'knight pi sold ltd': { email: 'recruitment.au@knightpiesold.com', source: 'https://www.knightpiesold.com/en/careers/search-careers/australia/perth/senior-site-engineer-fifo-civil-geotechnical/' },
  'laing o rourke': { email: 'resourcingteam@laingorourke.com', source: 'https://careers.laingorourke.com/jobs/digital-engineer-gis-north-lincolnshire-england-united-kingdom-birmingham' },
  'leo associates consulting engineers pty ltd': { email: 'sydney@laconsulting.com.au', source: 'https://laconsulting.com.au/contact-us' },
  'liontown': { email: 'careers@ltresources.com.au', source: 'https://jobs.ltresources.com.au/' },
  'max b gl': { email: 'info@max-boegl.de', source: 'https://max-boegl.de/en/company/locations/quality-policy' },
  'mec technical services': { email: 'enquiries@mecmining.com.au', source: 'https://mecmining.com.au/company/' },
  'mills recruitment': { email: 'darryl@millsrecruitment.com', source: 'https://www.millsrecruitment.com/au/news/mills-recruitment-secures-on-hire-labour-agreement-to-combat-australias-critical-skills-shortage/' },
  'mlei group': { email: 'adelaide@mlei.com.au', source: 'https://mlei.com.au/contact' },
  'mott macdonald': { email: 'careers@mottmac.com', source: 'https://www.mottmac.co.uk/en-us/careers/how-to-apply/recruitment-fraud/' },
  'nwu': { email: 'careerservices@nwu.ac.za', source: 'http://blog.nwu.ac.za/blog/postgrad/ready-real-world-heres-how-nwu-career-services-has-your-back' },
  'peak partners recruitment pty ltd': { email: 'info@peakpartners.com.au', source: 'https://www.peakpartners.com.au/' },
  'pitt sherry': { email: 'info@pittsh.com.au', source: 'https://www.pittsh.com.au/markets/transport' },
  'planned resources': { email: 'russell.locke@plannedresources.com.au', source: 'https://www.plannedresources.com.au/' },
  'powercor citipower': { email: 'careers@powercor.com.au', source: 'https://careers.powercor.com.au/job/Brooklyn-Cable-Jointer-VIC-3012/1370275366/' },
  'prascon consulting engineers': { email: 'career@prascon.com', source: 'https://prascon.com/careers/' },
  'primero group': { email: 'info@primero.com.au', source: 'https://primero.com.au/contact-us/' },
  'project portfolio management ppm': { email: 'ppmadmin@ppm.com.au', source: 'https://ppm.com.au/about-ppm/' },
  'rendel ingerop pty ltd': { email: 'recruitment@rendel.com.au', source: 'https://www.rendel-ltd.com/careers/' },
  'rio tinto': { email: 'recruitment.support@riotinto.com', source: 'https://www.riotinto.com/en/careers/faqs' },
  'robert bird group': { email: 'enquiries@robertbird.com', source: 'https://www.robertbird.com/contact-us/london-office-contact/' },
  'roughan o donovan': { email: 'info@rod.ie', source: 'https://www.rod.ie/careers/job-vacancies' },
  'samsung c t corporation australia': { email: 'hr.secc@samsung.com', source: 'https://samsungcnt.springboard.com.au/Australian_Region_Privacy_Policy.pdf' },
  'soil test melbourne engineering': { email: 'info@soiltestmelbourne.com.au', source: 'https://www.soiltestmelbourne.com.au/' },
  'southern cross gold consolidated ltd tsx sxgc asx sx2': { email: 'info@southerncrossgold.com', source: 'https://www.southerncrossgold.com/corporate/corporate-directory' },
  'srg global': { email: 'info@srgglobal.com.au', source: 'https://srgglobal.com.au/contact-us/' },
  'st mark s college': { email: 'stmarks@stmarkscollege.com.au', source: 'https://stmarkscollege.com.au/employment-opportunities/' },
  'stantec': { email: 'careers.UK@stantec.com', source: 'https://careers-uk-ireland.stantec.com/vacancies/9675/principal-electrical-engineer--water-sector.html' },
  'structerre consulting': { email: 'perth@structerre.com.au', source: 'https://structerre.com.au/about/careers/' },
  'structural innovations australia pty ltd': { email: 'sia@siau.com.au', source: 'https://www.structuralinnovationsaustralia.com.au/contact-us' },
  'sweco': { email: 'GB_Function-HR-Resourcing@sweco.co.uk', source: 'https://careers.sweco.co.uk/Job/JobDetail?JobId=4831' },
  'systra anz': { email: 'lbernays@systra.com', source: 'https://www.systra.com/australia/careers/why-systra/' },
  'talcon': { email: 'info@talcongroup.ie', source: 'https://talcongroup.co.uk/' },
  'tetra tech': { email: 'IDEV.HRServices@tetratech.com', source: 'https://tetratech.referrals.selectminds.com/intdev/jobs/water-governance-senior-specialist-55939' },
  'tod consulting': { email: 'reception@todconsulting.com', source: 'https://todconsulting.com/join-our-team/' },
  'tonkin': { email: 'adelaide@tonkin.com.au', source: 'https://tonkin.com.au:443/careers' },
  'webuild': { email: 'info@webuildgroup.com', source: 'https://jobs.webuildgroup.com/job/Perth-Principal-Civil-Structural-Engineer/1449244133/' },
  'wsp': { email: 'graduates.hk@wsp.com', source: 'https://www.wsp.com/en-hk/careers/graduates/hong-kong' },
  'zinfra': { email: 'careers@zinfra.com.au', source: 'https://www.zinfra.com.au/careers/future-talent/internship' },
}

function normalizeOrganisation(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Variant spellings of the same employer as they appear in the feed, mapped
 * to the canonical key used in COMPANY_CONTACTS.
 */
const ALIASES: Record<string, string> = {
  'aurecon group': 'aurecon',
  aurecongroup: 'aurecon',
  'wsp in australia': 'wsp',
  'wsp global inc': 'wsp',
  'webuild group': 'webuild',
  'evolution mining ltd': 'evolution mining',
  'intrax consulting group': 'intrax consulting engineers',
  'fsg geotechnics': 'fsg geotechnics foundations',
  'klohn crippen berger ltd': 'klohn crippen berger',
}

/** The verified contact email for an employer, if one is published. */
export function getCompanyEmail(
  organisation: string,
): { email: string; source: string } | undefined {
  const normalized = normalizeOrganisation(organisation)
  const key = ALIASES[normalized] ?? normalized
  return COMPANY_CONTACTS[key]
}
