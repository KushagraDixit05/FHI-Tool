import { PrismaClient } from '@prisma/client';

/**
 * Generates a unique quote number in format: FHI-{LINE_CODE}-{COUNTRY_CODE}-{YEAR}-{SEQUENCE}
 * Example: FHI-TXT-AUS-2026-00001
 */
export async function generateQuoteNumber(
  categoryCode: string,
  countryCode: string,
  prisma: PrismaClient
): Promise<string> {
  const year = new Date().getFullYear();
  const safeCategory = categoryCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  // ISO 3166-1 alpha-3 style — take first 3 chars, uppercase
  const safeCountry = countryCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const prefix = `FHI-${safeCategory}-${safeCountry}-${year}`;

  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: prefix } },
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${sequence}`;
}

/**
 * Extracts category and country codes from buyer + product context.
 * Falls back to 'GEN' and 'INT' if unable to determine.
 */
export function extractQuoteCodeContext(
  productLineCode?: string,
  buyerCountry?: string
): { categoryCode: string; countryCode: string } {
  // Map country name to 3-letter code
  const COUNTRY_CODES: Record<string, string> = {
    Australia: 'AUS',
    'New Zealand': 'NZL',
    Japan: 'JPN',
    'United States': 'USA',
    'United Kingdom': 'GBR',
    Germany: 'DEU',
    France: 'FRA',
    Canada: 'CAN',
    Singapore: 'SGP',
    'United Arab Emirates': 'UAE',
    India: 'IND',
  };

  return {
    categoryCode: productLineCode || 'GEN',
    countryCode: (buyerCountry && COUNTRY_CODES[buyerCountry]) || buyerCountry?.slice(0, 3).toUpperCase() || 'INT',
  };
}
