import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { calculator } from '@/routes';
import {
    decode,
    encode,
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
    return payload && !scenario.invalid
        ? scenario
        : { ...scenario, inputs: { ...scenario.inputs, language } };
}

export function useCalculatorScenario(
    payload: string | null,
    language: Inputs['language'],
) {
    const initial = useMemo(
        () => pageScenario(payload, language),
        [payload, language],
    );
    const [inputs, setInputs] = useState<Inputs>(initial.inputs);
    const [invalid, setInvalid] = useState(initial.invalid);
    const [rateMode, setRateMode] = useState<RateMode>(
        payload ? 'saved' : 'auto',
    );
    const lastPayload = useRef(payload);
    const ratesValid = isValidExtractionRates(inputs);
    const valid = isValidInputs(inputs);

    useEffect(() => {
        if (payload !== lastPayload.current) {
            setInputs(initial.inputs);
            setInvalid(initial.invalid);
            setRateMode('saved');
            lastPayload.current = payload;
        } else if (payload && !initial.invalid) {
            setInvalid(false);
        }
    }, [initial, payload]);

    useEffect(() => {
        if (
            !valid ||
            encode(inputs) === payload ||
            (!payload &&
                JSON.stringify(inputs) === JSON.stringify(initial.inputs))
        ) {
            return;
        }

        const timer = setTimeout(() => {
            const nextPayload = encode(inputs);
            lastPayload.current = nextPayload;
            router.get(
                calculator.url(
                    { payload: nextPayload },
                    { query: { lang: inputs.language } },
                ),
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [inputs, initial.inputs, payload, valid]);

    const update = (key: keyof Inputs, value: string | number | null) => {
        setInputs((previous) => ({ ...previous, [key]: value }));
    };

    return {
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
