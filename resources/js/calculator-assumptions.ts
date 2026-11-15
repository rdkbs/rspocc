export type Language = 'id' | 'en';

export const extractionAssumptions = {
    cspoOer: 20,
    kernel: 5,
    kernelOilRecovery: 45,
    kernelExpellerRecovery: 55,
} as const;

export const defaultExtractionRates = {
    cspo: extractionAssumptions.cspoOer,
    cspko:
        (extractionAssumptions.kernel *
            extractionAssumptions.kernelOilRecovery) /
        100,
    cspke:
        (extractionAssumptions.kernel *
            extractionAssumptions.kernelExpellerRecovery) /
        100,
} as const;

export const defaultPriceReference = {
    source: 'PRISMA',
    url: 'https://platform.prismabyrspo.org/credit-market-trends',
    checkedOn: '2026-11-15',
    period: '2026 YTD',
    prices: {
        is: { cspo: 3.67, cspko: 88.71, cspke: 0.1 },
        standard: { cspo: 0.12, cspko: 18.05, cspke: 0.25 },
    },
};
export const defaultExchangeRate = 16000;

export function formatPercent(value: number, language: Language): string {
    return `${new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        maximumFractionDigits: 2,
    }).format(value)}%`;
}

export function formatCurrency(
    value: number,
    currency: string,
    language: Language,
): string {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(value);
}
