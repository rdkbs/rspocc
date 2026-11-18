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

function belowDisplayPrecision(value: number): boolean {
    return value > 0 && value < 0.0001;
}

function maximumFractionDigits(value: number): number {
    return value > 999999 ? 0 : value > 0 && value < 0.01 ? 4 : 2;
}

export function formatDisplayNumber(value: number, language: Language): string {
    const locale = language === 'id' ? 'id-ID' : 'en-US';

    if (belowDisplayPrecision(value)) {
        return `<${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(0.0001)}`;
    }

    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: maximumFractionDigits(value),
    }).format(value);
}

export function formatCurrencyParts(
    value: number,
    currency: string,
    language: Language,
): Intl.NumberFormatPart[] {
    const locale = language === 'id' ? 'id-ID' : 'en-US';
    const parts = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 0,
        maximumFractionDigits: maximumFractionDigits(value),
    }).formatToParts(belowDisplayPrecision(value) ? 0.0001 : value);

    return parts.map((part) =>
        belowDisplayPrecision(value) && part.type === 'integer'
            ? { ...part, value: `<${part.value}` }
            : part,
    );
}

export function formatCurrency(
    value: number,
    currency: string,
    language: Language,
): string {
    return formatCurrencyParts(value, currency, language)
        .map((part) => part.value)
        .join('');
}

export type ExchangeRates = Partial<
    Record<
        'CNY' | 'EUR' | 'IDR' | 'MYR' | 'SGD',
        { rate: number; date: string }
    >
>;
