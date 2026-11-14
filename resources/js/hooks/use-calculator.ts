import LZString from 'lz-string';
import {
    defaultExchangeRate,
    defaultExtractionRates,
    defaultPriceReference,
} from '@/calculator-assumptions';

export const credits = ['cspo', 'cspko', 'cspke'] as const;
export type Credit = (typeof credits)[number];
const maxDecodedScenarioLength = 64 * 1024;
export type Inputs = {
    volume: number;
    unit: 'kg' | 't';
    oer: number;
    ker: number;
    yield: number;
    prices: Record<Credit, number>;
    included: Record<Credit, boolean>;
    exchange: number;
    currency: 'IDR' | 'MYR' | 'USD';
    language: 'id' | 'en';
};
export const defaults: Inputs = {
    volume: 1000,
    unit: 't',
    oer: defaultExtractionRates.cspo,
    ker: defaultExtractionRates.cspko,
    yield: defaultExtractionRates.cspke,
    prices: defaultPriceReference.prices,
    included: { cspo: true, cspko: true, cspke: true },
    exchange: defaultExchangeRate,
    currency: 'IDR',
    language: 'id',
};
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isNumber(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1e12
    );
}
export function isValidExtractionRates(value: unknown): boolean {
    if (!isRecord(value)) return false;

    return (
        isNumber(value.oer) &&
        isNumber(value.ker) &&
        isNumber(value.yield) &&
        isNumber(value.exchange) &&
        value.exchange > 0 &&
        value.oer + value.ker + value.yield <= 100
    );
}
export function isValidInputs(value: unknown): value is Inputs {
    if (
        !isRecord(value) ||
        !isRecord(value.prices) ||
        !isRecord(value.included)
    ) {
        return false;
    }

    const { prices, included } = value;
    return (
        isNumber(value.volume) &&
        isValidExtractionRates(value) &&
        (value.unit === 'kg' || value.unit === 't') &&
        (value.currency === 'IDR' ||
            value.currency === 'MYR' ||
            value.currency === 'USD') &&
        (value.language === 'id' || value.language === 'en') &&
        isNumber(prices.cspo) &&
        isNumber(prices.cspko) &&
        isNumber(prices.cspke) &&
        typeof included.cspo === 'boolean' &&
        typeof included.cspko === 'boolean' &&
        typeof included.cspke === 'boolean'
    );
}
function migrateLegacyPrices(data: Record<string, unknown>): void {
    if ('prices' in data || !isNumber(data.premium)) {
        return;
    }

    // Older shared links store one premium for all three credits.
    data.prices = {
        cspo: data.premium,
        cspko: data.premium,
        cspke: data.premium,
    };
    data.included = { cspo: true, cspko: true, cspke: true };
}
function toInputs(data: Inputs): Inputs {
    return {
        volume: data.volume,
        unit: data.unit,
        oer: data.oer,
        ker: data.ker,
        yield: data.yield,
        prices: {
            cspo: data.prices.cspo,
            cspko: data.prices.cspko,
            cspke: data.prices.cspke,
        },
        included: {
            cspo: data.included.cspo,
            cspko: data.included.cspko,
            cspke: data.included.cspke,
        },
        exchange: data.exchange,
        currency: data.currency,
        language: data.language,
    };
}
function invalidScenario(): { inputs: Inputs; invalid: true } {
    return { inputs: defaults, invalid: true };
}
export function decode(payload: string | null): {
    inputs: Inputs;
    invalid: boolean;
} {
    if (!payload) return { inputs: defaults, invalid: false };
    if (payload.length > 4096) return invalidScenario();

    try {
        const decompressed = decompressScenario(payload);
        if (decompressed === null) return invalidScenario();

        const data: unknown = JSON.parse(decompressed);
        if (!isRecord(data)) return invalidScenario();
        migrateLegacyPrices(data);
        if (!isValidInputs(data)) return invalidScenario();
        return { inputs: toInputs(data), invalid: false };
    } catch {
        return invalidScenario();
    }
}
export function encode(inputs: Inputs): string {
    return LZString.compressToEncodedURIComponent(JSON.stringify(inputs));
}
function decompressScenario(payload: string): string | null {
    const alphabet =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
    const encoded = payload.replaceAll(' ', '+');
    const values = Array.from(encoded, (character) =>
        alphabet.indexOf(character),
    );

    if (values.some((value) => value < 0)) return null;

    let value = values[0] ?? 0;
    let position = 32;
    let index = 1;
    const readBits = (count: number) => {
        let result = 0;
        let power = 1;

        for (let bit = 0; bit < count; bit++) {
            if ((value & position) > 0) result |= power;
            position >>= 1;
            if (position === 0) {
                position = 32;
                value = values[index++] ?? 0;
            }
            power <<= 1;
        }

        return result;
    };
    const readCharacter = (width: number) =>
        String.fromCharCode(readBits(width));

    const initialCode = readBits(2);
    let character =
        initialCode === 0
            ? readCharacter(8)
            : initialCode === 1
              ? readCharacter(16)
              : null;

    if (character === null) return initialCode === 2 ? '' : null;

    const dictionary: Array<string | number> = [0, 1, 2, character];
    const result = [character];
    let outputLength = character.length;
    let enlargeIn = 4;
    let dictionarySize = 4;
    let bitWidth = 3;
    let previous = character;

    while (true) {
        if (index > values.length) return null;

        let code = readBits(bitWidth);

        if (code === 0) {
            dictionary[dictionarySize++] = readCharacter(8);
            code = dictionarySize - 1;
            enlargeIn--;
        } else if (code === 1) {
            dictionary[dictionarySize++] = readCharacter(16);
            code = dictionarySize - 1;
            enlargeIn--;
        } else if (code === 2) {
            return result.join('');
        }

        if (enlargeIn === 0) {
            enlargeIn = 2 ** bitWidth;
            bitWidth++;
        }

        const entry = dictionary[code];
        const next =
            typeof entry === 'string'
                ? entry
                : code === dictionarySize
                  ? previous + previous.charAt(0)
                  : null;

        if (
            next === null ||
            outputLength + next.length > maxDecodedScenarioLength
        ) {
            return null;
        }

        result.push(next);
        outputLength += next.length;
        const dictionaryEntry = previous + next.charAt(0);
        if (dictionaryEntry.length > maxDecodedScenarioLength) return null;

        dictionary[dictionarySize++] = dictionaryEntry;
        enlargeIn--;
        previous = next;

        if (enlargeIn === 0) {
            enlargeIn = 2 ** bitWidth;
            bitWidth++;
        }
    }
}
export function useCalculator(inputs: Inputs) {
    const kg = inputs.volume * (inputs.unit === 't' ? 1000 : 1);
    const volumes: Record<Credit, number> = {
        cspo: (kg * inputs.oer) / 100,
        cspko: (kg * inputs.ker) / 100,
        cspke: (kg * inputs.yield) / 100,
    };
    const revenues = Object.fromEntries(
        credits.map((credit) => [
            credit,
            inputs.included[credit]
                ? (volumes[credit] / 1000) * inputs.prices[credit]
                : 0,
        ]),
    ) as Record<Credit, number>;
    const usd = credits.reduce((total, credit) => total + revenues[credit], 0);
    const rate = inputs.currency === 'USD' ? 1 : inputs.exchange;
    return {
        kg,
        volumes,
        revenues,
        usd,
        converted: usd * rate,
        added: kg > 0 ? (usd * rate) / kg : 0,
    };
}
