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

export type PriceReference = {
    source: string;
    checkedOn: string;
    periodStart: string;
    periodEnd: string;
    prices: Record<
        'is' | 'standard',
        Record<'cspo' | 'cspko' | 'cspke', number>
    >;
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
        minimumFractionDigits: 0,
        maximumFractionDigits: value > 999999 ? 0 : 2,
    }).format(value);
}

export type ExchangeRates = Partial<
    Record<
        'CNY' | 'EUR' | 'IDR' | 'MYR' | 'SGD',
        { rate: number; date: string }
    >
>;
