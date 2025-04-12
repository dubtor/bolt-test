import countryData from '../data/countries.json';

export type CountryCode = string;
export type RegionCode = string;

interface Region {
  name: string;
  slug: string;
}

interface Country {
  code: CountryCode;
  name: string;
  slug: string;
  regions?: Record<string, Region>;
}

// Create a map of country codes to country objects for quick lookup
const countryMap = new Map<CountryCode, Country>(
  countryData.countries.map(country => [country.code, country])
);

// Create a map of slugs to country codes for reverse lookup
const countrySlugMap = new Map<string, CountryCode>(
  countryData.countries.map(country => [country.slug, country.code])
);

// Create a map of region slugs to region codes for each country
const regionSlugMap = new Map<string, Map<string, RegionCode>>();
countryData.countries.forEach(country => {
  if (country.regions) {
    const slugMap = new Map<string, RegionCode>();
    Object.entries(country.regions).forEach(([code, region]) => {
      slugMap.set(region.slug, code);
    });
    regionSlugMap.set(country.code, slugMap);
  }
});

// Create a map of country codes to country names for legacy compatibility
export const countries: Record<CountryCode, string> = Object.fromEntries(
  countryData.countries.map(country => [country.code, country.name])
);

// Create a map of country codes to regions for legacy compatibility
export const regions: Record<CountryCode, Record<string, string>> = Object.fromEntries(
  countryData.countries
    .filter(country => country.regions)
    .map(country => [
      country.code,
      Object.fromEntries(
        Object.entries(country.regions!).map(([code, region]) => [code, region.name])
      )
    ])
);


// Helper function to get a specific country with all its data
export function getCountry(code: CountryCode): Country | undefined {
  return countryMap.get(code);
}

export function getCountryName(code: CountryCode): string {
  return countryMap.get(code)?.name || code;
}

export function getCountrySlug(code: CountryCode): string {
  return countryMap.get(code)?.slug || code.toLowerCase();
}

export function getCountryBySlug(slug: string): Country | undefined {
  const code = countrySlugMap.get(slug);
  return code ? countryMap.get(code) : undefined;
}

export function getCountryCodeBySlug(slug: string): CountryCode | undefined {
  return countrySlugMap.get(slug);
}

export function isValidCountryCode(code: string): code is CountryCode {
  return countryMap.has(code);
}

export function getCountryFlag(code: CountryCode): string {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}

export function getRegions(countryCode: CountryCode) {
  return countryMap.get(countryCode)?.regions || null;
}

export function getRegionName(countryCode: CountryCode, regionCode: RegionCode): string | null {
  const country = countryMap.get(countryCode);
  return country?.regions?.[regionCode]?.name || null;
}

export function getRegionSlug(countryCode: CountryCode, regionCode: RegionCode): string | null {
  const country = countryMap.get(countryCode);
  return country?.regions?.[regionCode]?.slug || null;
}

export function getRegionBySlug(countryCode: CountryCode, slug: string): { code: RegionCode; name: string } | null {
  const slugMap = regionSlugMap.get(countryCode);
  if (!slugMap) return null;

  const regionCode = slugMap.get(slug);
  if (!regionCode) return null;

  const region = countryMap.get(countryCode)?.regions?.[regionCode];
  if (!region) return null;

  return { code: regionCode, name: region.name };
}

export function hasRegions(countryCode: CountryCode): boolean {
  const country = countryMap.get(countryCode);
  return !!country?.regions;
}

// Helper function to get all countries
export function getAllCountries(): Country[] {
  return countryData.countries;
}