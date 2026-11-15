import { useEffect, useRef, useState } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

type Language = 'id' | 'en';
export function formatNumericInput(
    raw: string,
    language: Language,
    groupThousands = true,
): string {
    if (raw === '' || raw === '-') return raw;
    const [integer, fraction] = raw.split('.');
    const grouped = groupThousands
        ? new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
              maximumFractionDigits: 0,
          }).format(Number(integer === '-' ? '-0' : integer || 0))
        : integer;
    return (
        grouped +
        (fraction === undefined
            ? ''
            : (language === 'id' ? ',' : '.') + fraction)
    );
}
export function parseNumericInput(
    display: string,
    language: Language,
): string | null {
    const decimalSeparator = language === 'id' ? ',' : '.';
    const groupSeparator = language === 'id' ? '.' : ',';
    const [integer, fraction, ...extraFractions] =
        display.split(decimalSeparator);
    const sign = integer.startsWith('-') ? '-' : '';
    const integerParts = (sign ? integer.slice(1) : integer).split(
        groupSeparator,
    );
    const isUngroupedInteger =
        integerParts.length === 1 && /^\d*$/.test(integerParts[0]);
    const isGroupedInteger =
        /^\d{1,3}$/.test(integerParts[0]) &&
        integerParts.slice(1).every((part) => /^\d{3}$/.test(part));

    if (
        extraFractions.length > 0 ||
        (!isUngroupedInteger && !isGroupedInteger) ||
        (fraction !== undefined && !/^\d*$/.test(fraction))
    ) {
        return null;
    }

    const raw =
        sign +
        integerParts.join('') +
        (fraction === undefined ? '' : `.${fraction}`);
    return /^-?\d*(?:\.\d*)?$/.test(raw) ? raw : null;
}

type Props = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
    value: number | null;
    language: Language;
    onValueChange: (value: number | null) => void;
};
export default function NumberField({
    value,
    language,
    onValueChange,
    slotProps,
    ...props
}: Props) {
    const [draft, setDraft] = useState<string | null>(null);
    const lastEmitted = useRef<number | null>(value);
    useEffect(() => {
        if (lastEmitted.current !== value) {
            lastEmitted.current = value;
            setDraft(null);
        }
    }, [value]);
    const group = language === 'id' ? '.' : ',';
    return (
        <TextField
            {...props}
            value={formatNumericInput(
                draft ?? String(value ?? ''),
                language,
                draft === null,
            )}
            type="text"
            onFocus={() => setDraft(String(value ?? ''))}
            onBlur={() => setDraft(null)}
            onChange={(event) => {
                const input = event.target;
                const raw = parseNumericInput(input.value, language);
                if (raw === null) return;
                const beforeCaret = input.value
                    .slice(0, input.selectionStart ?? input.value.length)
                    .replaceAll(group, '').length;
                const formatted = formatNumericInput(raw, language, false);
                const numeric = Number(raw);
                const next =
                    raw === '' ? null : Number.isFinite(numeric) ? numeric : 0;
                lastEmitted.current = next;
                setDraft(raw);
                onValueChange(next);
                requestAnimationFrame(() => {
                    let significant = 0;
                    let caret = 0;
                    while (
                        caret < formatted.length &&
                        significant < beforeCaret
                    ) {
                        if (formatted[caret] !== group) significant++;
                        caret++;
                    }
                    if (document.activeElement === input)
                        input.setSelectionRange(caret, caret);
                });
            }}
            slotProps={{
                ...slotProps,
                htmlInput: (ownerState) => ({
                    ...(typeof slotProps?.htmlInput === 'function'
                        ? slotProps.htmlInput(ownerState)
                        : slotProps?.htmlInput),
                    inputMode: 'decimal',
                }),
            }}
        />
    );
}
