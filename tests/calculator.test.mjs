import { glossaryParts } from '../resources/js/glossary.ts';
import {
    formatNumericInput,
    parseNumericInput,
} from '../resources/js/components/number-field.tsx';
import { describe, expect, test } from 'bun:test';
import LZString from 'lz-string';
import {
    decode,
    defaults,
    encode,
    useCalculator,
} from '../resources/js/hooks/use-calculator.ts';
import { formatCurrency } from '../resources/js/calculator-assumptions.ts';
import { pageScenario } from '../resources/js/hooks/use-calculator-scenario.ts';

describe('calculator scenarios', () => {
    test('converts tonnes, applies premiums and divides by FFB kg', () => {
        const result = useCalculator(defaults);
        expect(result.volumes).toEqual({
            cspo: 200000,
            cspko: 22500,
            cspke: 27500,
        });
        expect(result.usd).toBe(2700.25);
        expect(result.converted).toBe(43204000);
        expect(result.added).toBe(43.204);
        expect(
            useCalculator({ ...defaults, volume: 1000000, unit: 'kg' }),
        ).toEqual(result);
    });
    test('handles zero harvest and USD without a foreign exchange multiplier', () => {
        expect(useCalculator({ ...defaults, volume: 0 }).added).toBe(0);
        expect(useCalculator({ ...defaults, currency: 'USD' }).converted).toBe(
            2700.25,
        );
    });
    test('round trips scenario URLs and rejects malformed or impossible inputs', () => {
        expect(decode(encode(defaults))).toEqual({
            inputs: defaults,
            invalid: false,
        });
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
    test('uses the selected language when a scenario link is invalid', () => {
        expect(pageScenario('bad link', 'en').inputs.language).toBe('en');
        expect(pageScenario(null, 'en').inputs.language).toBe('en');
        expect(
            pageScenario(encode({ ...defaults, language: 'id' }), 'en').inputs
                .language,
        ).toBe('id');
    });
    test('prices credits individually and sums only selected revenues', () => {
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
            const included = {
                cspo: Boolean(mask & 1),
                cspko: Boolean(mask & 2),
                cspke: Boolean(mask & 4),
            };
            const expected =
                (included.cspo ? 2000 : 0) +
                (included.cspko ? 450 : 0) +
                (included.cspke ? 825 : 0);
            const result = useCalculator({ ...inputs, included });
            expect(result.usd).toBe(expected);
            expect(result.added).toBe((expected * 16000) / 1000000);
            expect(result.volumes).toEqual({
                cspo: 200000,
                cspko: 22500,
                cspke: 27500,
            });
            expect(decode(encode({ ...inputs, included })).inputs).toEqual({
                ...inputs,
                included,
            });
        }
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
        expect(restored.inputs.included).toEqual(defaults.included);
        expect(useCalculator(restored.inputs).usd).toBe(6250);
    });
    test('rejects invalid individual prices and selection flags', () => {
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
                    included: { ...defaults.included, cspo: 'false' },
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
    test('rounds IDR to whole rupiah and keeps minor units for other currencies', () => {
        expect(formatCurrency(49.2, 'IDR', 'id')).toMatch(/49$/);
        expect(formatCurrency(2700.25, 'USD', 'id')).toContain(',25');
        expect(formatCurrency(1.25, 'MYR', 'en')).toContain('.25');
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
