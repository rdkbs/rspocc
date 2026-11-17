import { currencyPreferenceKey, defaultCurrency } from '@/currency-preference';
import type { ExchangeRates } from '@/calculator-assumptions';
import { usePage, useRemember } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    decode,
    isValidExtractionRates,
    isValidInputs,
    type Inputs,
} from '@/hooks/use-calculator';

export type RateMode = 'auto' | 'manual' | 'saved';

export function pageScenario(
    payload: string | null,
    language: Inputs['language'],
) {
    const scenario = decode(payload);
    return { ...scenario, inputs: { ...scenario.inputs, language } };
}

export function useCalculatorScenario(
    payload: string | null,
    language: Inputs['language'],
) {
    const { exchangeRates } = usePage<{ exchangeRates: ExchangeRates }>().props;
    const initial = useMemo(
        () => pageScenario(payload, language),
        [payload, language],
    );
    const [inputs, setInputs] = useRemember<Inputs>(
        initial.inputs,
        'calculator.inputs',
    );
    const [invalid, setInvalid] = useState(initial.invalid);
    const [rateMode, setRateMode] = useRemember<RateMode>(
        payload ? 'saved' : 'auto',
        'calculator.rateMode',
    );
    const [currencyInitialized, setCurrencyInitialized] = useRemember(
        false,
        'calculator.currencyInitialized',
    );
    const lastPayload = useRef(payload);
    const ratesValid = isValidExtractionRates(inputs);
    const valid = isValidInputs(inputs);

    useEffect(() => {
        if (currencyInitialized || payload) return;
        setCurrencyInitialized(true);
        if (
            inputs.volume !== null ||
            rateMode !== 'auto' ||
            inputs.currency !== 'IDR'
        )
            return;
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(currencyPreferenceKey);
        } catch {}
        const currency = defaultCurrency(saved, navigator.languages);
        setInputs((previous) => ({
            ...previous,
            currency,
            exchange:
                currency === previous.currency
                    ? previous.exchange
                    : currency === 'USD'
                      ? 1
                      : 0,
        }));
    }, [currencyInitialized, payload]);

    useEffect(() => {
        if (payload !== lastPayload.current) {
            setInputs(initial.inputs);
            setInvalid(initial.invalid);
            setRateMode('saved');
            lastPayload.current = payload;
        } else {
            if (payload && !initial.invalid) {
                setInvalid(false);
            }

            setInputs((previous) =>
                previous.language === initial.inputs.language
                    ? previous
                    : { ...previous, language: initial.inputs.language },
            );
        }
    }, [initial, payload]);

    const update = (key: keyof Inputs, value: string | number | null) => {
        setInputs((previous) => ({ ...previous, [key]: value }));
    };

    const changeCurrency = (currency: Inputs['currency']) => {
        try {
            localStorage.setItem(currencyPreferenceKey, currency);
        } catch {}
        setRateMode('auto');
        setInputs((previous) => ({
            ...previous,
            currency,
            exchange:
                currency === 'USD'
                    ? 1
                    : (exchangeRates[currency]?.rate ??
                      (currency === previous.currency ? previous.exchange : 0)),
        }));
    };

    return {
        changeCurrency,
        inputs,
        setInputs,
        update,
        invalid,
        rateMode,
        setRateMode,
        ratesValid,
        valid,
    };
}
