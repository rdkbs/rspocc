import { useRemember } from '@inertiajs/react';
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
    const lastPayload = useRef(payload);
    const ratesValid = isValidExtractionRates(inputs);
    const valid = isValidInputs(inputs);

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
