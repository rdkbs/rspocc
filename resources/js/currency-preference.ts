import type { Inputs } from '@/hooks/use-calculator';

export const currencyPreferenceKey = 'rspocc:currency';
const regionCurrencies: Record<string, Inputs['currency']> = {
    ID: 'IDR',
    MY: 'MYR',
    SG: 'SGD',
    CN: 'CNY',
    US: 'USD',
    AT: 'EUR',
    BE: 'EUR',
    BG: 'EUR',
    CY: 'EUR',
    DE: 'EUR',
    EE: 'EUR',
    ES: 'EUR',
    FI: 'EUR',
    FR: 'EUR',
    GR: 'EUR',
    HR: 'EUR',
    IE: 'EUR',
    IT: 'EUR',
    LT: 'EUR',
    LU: 'EUR',
    LV: 'EUR',
    MT: 'EUR',
    NL: 'EUR',
    PT: 'EUR',
    SI: 'EUR',
    SK: 'EUR',
};

export function defaultCurrency(
    saved: unknown,
    locales: readonly string[],
): Inputs['currency'] {
    if (
        typeof saved === 'string' &&
        ['IDR', 'MYR', 'SGD', 'CNY', 'EUR', 'USD'].includes(saved)
    ) {
        return saved as Inputs['currency'];
    }
    let englishCurrency: Inputs['currency'] | undefined;
    for (const locale of locales) {
        try {
            const { language, region } = new Intl.Locale(locale);
            const currency = region
                ? regionCurrencies[region]
                : language === 'id'
                  ? 'IDR'
                  : language === 'ms'
                    ? 'MYR'
                    : undefined;
            if (!currency) continue;
            if (language !== 'en') return currency;
            englishCurrency ??= currency;
        } catch {
            // Ignore malformed browser language tags.
        }
    }
    return englishCurrency ?? 'IDR';
}
