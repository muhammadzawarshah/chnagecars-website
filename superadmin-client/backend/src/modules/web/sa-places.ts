import { Province } from '../../generated/prisma/client';
import { PROVINCE_NAMES, slugify } from './web-format';

/**
 * The website's sell forms and dealer sign-up ask for a suburb or an address, not a province,
 * but sell requests and dealers are routed by province. This list resolves the common cities,
 * towns and suburbs; anything unknown is reported back to the visitor so they can add the province.
 */
const PLACES: Record<Province, string[]> = {
  GAUTENG: [
    'johannesburg', 'joburg', 'jhb', 'sandton', 'rosebank', 'randburg', 'roodepoort', 'soweto', 'midrand', 'fourways', 'rivonia',
    'bryanston', 'sunninghill', 'centurion', 'pretoria', 'tshwane', 'menlyn', 'hatfield', 'brooklyn', 'faerie glen', 'garsfontein',
    'montana', 'mamelodi', 'soshanguve', 'akasia', 'irene', 'midstream', 'kempton park', 'edenvale', 'bedfordview', 'germiston',
    'boksburg', 'benoni', 'brakpan', 'springs', 'alberton', 'vereeniging', 'vanderbijlpark', 'meyerton', 'krugersdorp',
    'randfontein', 'westonaria', 'carletonville', 'tembisa', 'alexandra', 'kyalami', 'northcliff', 'melville', 'parktown',
    'lonehill', 'douglasdale', 'morningside', 'illovo', 'greenstone', 'modderfontein', 'olifantsfontein', 'cullinan',
    'bronkhorstspruit', 'heidelberg', 'nigel', 'katlehong', 'vosloorus', 'lenasia', 'honeydew', 'ruimsig', 'muldersdrift', 'lanseria',
    'waterkloof', 'lynnwood', 'silverton', 'wonderboom', 'pretoria north', 'pretoria east', 'pretoria west', 'gp',
  ],
  WESTERN_CAPE: [
    'cape town', 'kaapstad', 'bellville', 'durbanville', 'brackenfell', 'kuils river', 'parow', 'goodwood', 'milnerton',
    'table view', 'tableview', 'bloubergstrand', 'blouberg', 'parklands', 'sea point', 'green point', 'gardens', 'claremont',
    'rondebosch', 'newlands', 'constantia', 'tokai', 'bergvliet', 'muizenberg', 'fish hoek', 'simons town', 'hout bay',
    'camps bay', 'somerset west', 'strand', 'gordons bay', 'stellenbosch', 'paarl', 'wellington', 'franschhoek', 'worcester',
    'malmesbury', 'atlantis', 'mitchells plain', 'khayelitsha', 'george', 'knysna', 'mossel bay', 'plettenberg bay', 'oudtshoorn',
    'hermanus', 'caledon', 'swellendam', 'vredenburg', 'saldanha', 'langebaan', 'beaufort west', 'montague gardens', 'epping',
    'n1 city', 'tygervalley', 'wc',
  ],
  KWAZULU_NATAL: [
    'durban', 'ethekwini', 'umhlanga', 'ballito', 'westville', 'pinetown', 'hillcrest', 'kloof', 'gillitts', 'amanzimtoti',
    'umlazi', 'chatsworth', 'phoenix', 'verulam', 'tongaat', 'queensburgh', 'berea', 'morningside durban', 'glenwood',
    'pietermaritzburg', 'maritzburg', 'pmb', 'howick', 'hilton', 'richards bay', 'empangeni', 'newcastle', 'ladysmith', 'dundee',
    'vryheid', 'port shepstone', 'margate', 'scottburgh', 'kokstad', 'estcourt', 'eshowe', 'stanger', 'kwadukuza', 'kzn',
  ],
  EASTERN_CAPE: [
    'gqeberha', 'port elizabeth', 'nelson mandela bay', 'east london', 'buffalo city', 'mthatha', 'umtata', 'uitenhage',
    'kariega', 'despatch', 'jeffreys bay', 'grahamstown', 'makhanda', 'queenstown', 'komani', 'king williams town',
    'qonce', 'butterworth', 'graaff-reinet', 'graaff reinet', 'port alfred', 'humansdorp', 'walmer', 'summerstrand', 'ec',
  ],
  FREE_STATE: [
    'bloemfontein', 'mangaung', 'welkom', 'kroonstad', 'bethlehem', 'sasolburg', 'parys', 'harrismith', 'phuthaditjhaba',
    'virginia', 'odendaalsrus', 'ficksburg', 'botshabelo', 'thaba nchu', 'fs',
  ],
  LIMPOPO: [
    'polokwane', 'pietersburg', 'tzaneen', 'mokopane', 'potgietersrus', 'thohoyandou', 'louis trichardt', 'makhado',
    'phalaborwa', 'lephalale', 'ellisras', 'bela-bela', 'bela bela', 'warmbaths', 'modimolle', 'musina', 'giyani', 'burgersfort',
    'thabazimbi', 'lp',
  ],
  MPUMALANGA: [
    'mbombela', 'nelspruit', 'witbank', 'emalahleni', 'middelburg', 'secunda', 'ermelo', 'standerton', 'white river',
    'hazyview', 'barberton', 'lydenburg', 'mashishing', 'bethal', 'piet retief', 'mkhondo', 'komatipoort', 'delmas', 'malelane', 'mp',
  ],
  NORTH_WEST: [
    'rustenburg', 'mahikeng', 'mafikeng', 'potchefstroom', 'klerksdorp', 'brits', 'hartbeespoort', 'harties', 'lichtenburg',
    'zeerust', 'vryburg', 'orkney', 'stilfontein', 'mogwase', 'sun city', 'nw',
  ],
  NORTHERN_CAPE: [
    'kimberley', 'upington', 'springbok', 'kuruman', 'de aar', 'kathu', 'postmasburg', 'colesberg', 'calvinia', 'nc',
  ],
};

/** Longest names first so "pretoria east" beats "pretoria" and "cape town" beats "cape". */
const INDEX: { slug: string; province: Province }[] = (Object.entries(PLACES) as [Province, string[]][])
  .flatMap(([province, names]) => [...names, PROVINCE_NAMES[province]].map((name) => ({ slug: slugify(name), province })))
  .sort((a, b) => b.slug.length - a.slug.length);

/** Finds the province named in free text such as "12 Main Road, Sandton" or "Durbanville, Cape Town". */
export function provinceFromPlace(text: string | null | undefined): Province | undefined {
  if (!text) return undefined;
  const haystack = `-${slugify(text)}-`;
  return INDEX.find((place) => haystack.includes(`-${place.slug}-`))?.province;
}

/**
 * Splits "12 Main Road, Sandton, Gauteng" into a city ("Sandton") for dealer sign-up:
 * the last comma part that is not just the province name, or the whole text when there are no commas.
 */
export function cityFromAddress(address: string): string {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  const provinces = new Set(Object.values(PROVINCE_NAMES).map((name) => slugify(name)));
  const candidates = parts.filter((part) => !provinces.has(slugify(part)) && !/^\d+$/.test(part));
  return (candidates.length > 1 ? candidates[candidates.length - 1] : candidates[0] ?? address).slice(0, 120);
}
