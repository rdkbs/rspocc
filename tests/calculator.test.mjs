import { defaultCurrency } from '../resources/js/currency-preference.ts';
import previewFixtures from './Fixtures/calculator-previews.json';
import { glossaryParts } from '../resources/js/glossary.ts';
import {
    formatNumericInput,
    parseNumericInput,
} from '../resources/js/components/number-field.tsx';
import { describe, expect, test } from 'bun:test';
import LZString from 'lz-string';
import {
    decode,
    defaults as initialDefaults,
    encode,
    useCalculator,
} from '../resources/js/hooks/use-calculator.ts';
import {
    formatCurrency,
    formatDisplayNumber,
} from '../resources/js/calculator-assumptions.ts';
import { pageScenario } from '../resources/js/hooks/use-calculator-scenario.ts';

const defaults = {
    ...initialDefaults,
    prices: { cspo: 3.67, cspko: 88.71, cspke: 0.1 },
};

describe('calculator scenarios', () => {
    test('converts tonnes, applies premiums and divides by FFB kg', () => {
        const result = useCalculator(defaults);
        expect(result.volumes).toEqual({
            cspo: 200000,
            cspko: 22500,
            cspke: 27500,
        });
        expect(result.usd).toBe(2732.725);
        expect(result.converted).toBe(43723600);
        expect(result.added).toBe(43.7236);
        expect(
            useCalculator({ ...defaults, volume: 1000000, unit: 'kg' }),
        ).toEqual(result);
    });
    test('handles zero harvest and USD without a foreign exchange multiplier', () => {
        expect(useCalculator({ ...defaults, volume: 0 }).added).toBe(0);
        expect(useCalculator({ ...defaults, currency: 'USD' }).converted).toBe(
            2732.725,
        );
    });
    test('round trips scenario URLs and rejects malformed or impossible inputs', () => {
        expect(decode(encode(defaults))).toEqual({
            inputs: defaults,
            invalid: false,
        });
        expect(
            JSON.parse(
                LZString.decompressFromEncodedURIComponent(encode(defaults)),
            ),
        ).not.toHaveProperty('included');
        expect(decode('bad link').invalid).toBe(true);
        expect(decode(encode({ ...defaults, oer: 101 })).invalid).toBe(true);
        expect(decode(encode({ ...defaults, exchange: 0 })).invalid).toBe(true);
        expect(decode(encode({ ...defaults, volume: -1 })).invalid).toBe(true);
    });
    test('rejects compressed scenarios that exceed the decoded size limit', () => {
        const payload = LZString.compressToEncodedURIComponent(
            JSON.stringify({ ...defaults, unused: 'a'.repeat(500_000) }),
        );

        expect(payload.length).toBeLessThan(4096);
        expect(decode(payload).invalid).toBe(true);
    });
    test('uses the page language for all scenarios', () => {
        expect(pageScenario('bad link', 'en').inputs.language).toBe('en');
        expect(pageScenario(null, 'en').inputs.language).toBe('en');
        expect(
            pageScenario(encode({ ...defaults, language: 'id' }), 'en').inputs
                .language,
        ).toBe('en');
    });
    test('includes credits with prices and excludes credits with blank prices', () => {
        const inputs = {
            ...defaults,
            prices: { cspo: 10, cspko: 20, cspke: 30 },
        };
        expect(useCalculator(inputs).revenues).toEqual({
            cspo: 2000,
            cspko: 450,
            cspke: 825,
        });
        expect(useCalculator(inputs).usd).toBe(3275);
        for (let mask = 0; mask < 8; mask++) {
            const prices = {
                cspo: mask & 1 ? 10 : null,
                cspko: mask & 2 ? 20 : null,
                cspke: mask & 4 ? 30 : null,
            };
            const expected =
                (prices.cspo === null ? 0 : 2000) +
                (prices.cspko === null ? 0 : 450) +
                (prices.cspke === null ? 0 : 825);
            const scenario = { ...inputs, prices };
            const result = useCalculator(scenario);
            expect(result.usd).toBe(expected);
            expect(result.added).toBe((expected * 16000) / 1000000);
            expect(result.volumes).toEqual({
                cspo: 200000,
                cspko: 22500,
                cspke: 27500,
            });
            expect(decode(encode(scenario)).inputs).toEqual(scenario);
        }

        const zeroPrice = {
            ...inputs,
            prices: { cspo: 0, cspko: null, cspke: null },
        };
        expect(useCalculator(zeroPrice).revenues).toEqual({
            cspo: 0,
            cspko: 0,
            cspke: 0,
        });
        expect(decode(encode(zeroPrice)).inputs).toEqual(zeroPrice);
    });
    test('migrates older excluded credits to blank prices', () => {
        const legacy = {
            ...defaults,
            prices: { cspo: 10, cspko: 20, cspke: 30 },
            included: { cspo: false, cspko: true, cspke: false },
        };
        const payload = LZString.compressToEncodedURIComponent(
            JSON.stringify(legacy),
        );

        const restored = decode(payload);

        expect(restored.invalid).toBe(false);
        expect(restored.inputs.prices).toEqual({
            cspo: null,
            cspko: 20,
            cspke: null,
        });
        expect(useCalculator(restored.inputs).usd).toBe(450);
    });
    test('preserves old single-price shared links', () => {
        const legacy = {
            ...defaults,
            prices: undefined,
            included: undefined,
            premium: 25,
        };
        const restored = decode(encode(legacy));
        expect(restored.invalid).toBe(false);
        expect(restored.inputs.prices).toEqual({
            cspo: 25,
            cspko: 25,
            cspke: 25,
        });
        expect(useCalculator(restored.inputs).usd).toBe(6250);
    });
    test('rejects invalid prices and malformed legacy inclusion state', () => {
        expect(
            decode(
                encode({
                    ...defaults,
                    prices: { ...defaults.prices, cspo: -1 },
                }),
            ).invalid,
        ).toBe(true);
        expect(
            decode(
                encode({
                    ...defaults,
                    included: { cspo: 'false', cspko: true, cspke: true },
                }),
            ).invalid,
        ).toBe(true);
        expect(
            decode(encode({ ...defaults, prices: { cspo: 10 } })).invalid,
        ).toBe(true);
    });
});

describe('localized numeric inputs', () => {
    test('groups thousands and preserves editable decimals', () => {
        expect(formatNumericInput('1234567.50', 'id')).toBe('1.234.567,50');
        expect(formatNumericInput('1234567.50', 'en')).toBe('1,234,567.50');
        expect(formatNumericInput('1000', 'en', false)).toBe('1000');
        expect(formatNumericInput('1000.50', 'id', false)).toBe('1000,50');
        expect(formatNumericInput('2.', 'id')).toBe('2,');
        expect(formatNumericInput('', 'en')).toBe('');
        expect(formatNumericInput('-', 'en')).toBe('-');
        expect(formatNumericInput('-.', 'id')).toBe('-0,');
    });
    test('parses display values without changing their numeric meaning', () => {
        expect(parseNumericInput('1.234.567,50', 'id')).toBe('1234567.50');
        expect(parseNumericInput('1,234,567.50', 'en')).toBe('1234567.50');
        expect(parseNumericInput('2,25', 'id')).toBe('2.25');
        expect(parseNumericInput('12.34', 'id')).toBeNull();
        expect(parseNumericInput('12,34', 'en')).toBeNull();
        expect(parseNumericInput('12,34,567.89', 'en')).toBeNull();
        expect(parseNumericInput('1abc', 'en')).toBeNull();
        expect(parseNumericInput('1.2.3', 'en')).toBeNull();
    });
});

describe('currency formatting', () => {
    test('omits zero decimals and rounds large values in every currency', () => {
        expect(formatCurrency(49.2, 'IDR', 'id')).toContain('49,2');
        for (const currency of ['CNY', 'EUR', 'IDR', 'MYR', 'SGD', 'USD']) {
            expect(formatCurrency(1000, currency, 'en')).toMatch(/1,000$/);
            expect(formatCurrency(1000000.5, currency, 'en')).toMatch(
                /1,000,001$/,
            );
            expect(formatCurrency(999999, currency, 'en')).toMatch(/999,999$/);
            expect(formatCurrency(999999.5, currency, 'en')).toMatch(
                /1,000,000$/,
            );
        }
        expect(formatCurrency(2700.25, 'USD', 'id')).toContain(',25');
        expect(formatCurrency(1.25, 'MYR', 'en')).toContain('.25');
    });

    test('preserves small nonzero amounts and marks values below display precision', () => {
        expect(formatDisplayNumber(0.0042, 'en')).toBe('0.0042');
        expect(formatDisplayNumber(0.0042, 'id')).toBe('0,0042');
        expect(formatDisplayNumber(0.0001, 'en')).toBe('0.0001');
        expect(formatDisplayNumber(0.00009, 'en')).toBe('<0.0001');
        expect(formatDisplayNumber(0.00009, 'id')).toBe('<0,0001');
        expect(formatCurrency(0.00009, 'USD', 'en')).toContain('<0.0001');
        expect(formatCurrency(0.0042, 'USD', 'id')).toContain('0,0042');
    });

    test('formats exact decimal trade values with result-card precision', () => {
        expect(formatDisplayNumber('73787050000000000000e-16', 'en')).toBe(
            '7,378.71',
        );
        expect(formatDisplayNumber('73787050000000000000e-16', 'id')).toBe(
            '7.378,71',
        );
        expect(formatDisplayNumber('4.2e-3', 'en')).toBe('0.0042');
        expect(formatDisplayNumber('9e-5', 'en')).toBe('<0.0001');
        expect(formatDisplayNumber('1000000.5', 'en')).toBe('1,000,001');
        expect(formatDisplayNumber('1000.00', 'en')).toBe('1,000');
    });
});

describe('glossary term matching', () => {
    test('preserves text and matches complete terms before shorter acronyms', () => {
        const text = 'IS-CSPO credits, CSPO oil, FFB weight, and FFB again.';
        const parts = glossaryParts(text);
        expect(parts.map((part) => part.text).join('')).toBe(text);
        expect(
            parts.filter((part) => part.entry).map((part) => part.entry.term),
        ).toEqual(['IS credits', 'CSPO', 'FFB / TBS']);
    });
    test('ignores word fragments and handles Indonesian terms', () => {
        expect(
            glossaryParts('kernel and RSVP').filter((part) => part.entry),
        ).toEqual([]);
        expect(
            glossaryParts('TBS dan kurs')
                .filter((part) => part.entry)
                .map((part) => part.entry.term),
        ).toEqual(['FFB / TBS', 'Exchange rate']);
    });
});

test('shared preview fixtures stay consistent with the JavaScript calculator', () => {
    for (const { payload, result } of previewFixtures) {
        const scenario = decode(payload);
        expect(scenario.invalid).toBe(false);
        const calculated = useCalculator(scenario.inputs);
        for (const key of ['kg', 'usd', 'converted', 'added']) {
            expect(calculated[key]).toBeCloseTo(result[key], 6);
        }
        expect(scenario.inputs.currency).toBe(result.currency);
    }
});

test('currency defaults prefer saved choices and explicit supported browser regions', () => {
    expect(defaultCurrency('MYR', ['en-SG'])).toBe('MYR');
    for (const [locale, currency] of [
        ['id-ID', 'IDR'],
        ['en-SG', 'SGD'],
        ['ms-MY', 'MYR'],
        ['zh-Hans-CN', 'CNY'],
        ['nl-NL', 'EUR'],
        ['en-US', 'USD'],
    ]) {
        expect(defaultCurrency(null, [locale])).toBe(currency);
    }
    expect(defaultCurrency('invalid', ['broken_tag', 'en-SG'])).toBe('SGD');
    expect(defaultCurrency(null, ['en'])).toBe('IDR');
    expect(defaultCurrency(null, ['en-GB'])).toBe('IDR');
    expect(defaultCurrency(null, [])).toBe('IDR');
});

test('currency detection prioritizes non-English preferences without overriding saved choices', () => {
    expect(defaultCurrency(null, ['en-US', 'en', 'id'])).toBe('IDR');
    expect(defaultCurrency(null, ['en-US', 'ms'])).toBe('MYR');
    expect(defaultCurrency(null, ['en-US', 'zh-CN'])).toBe('CNY');
    expect(defaultCurrency(null, ['en-US', 'nl-NL'])).toBe('EUR');
    expect(defaultCurrency('USD', ['en-US', 'id'])).toBe('USD');
    expect(defaultCurrency(null, ['en-SG', 'zh'])).toBe('SGD');
    expect(defaultCurrency(null, ['en-US', 'broken_tag', 'ms-SG'])).toBe('SGD');
    expect(defaultCurrency(null, ['en-US', 'ms-BN'])).toBe('USD');
});
