import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import NumberField from '@/components/number-field';
import { exchangeRates } from '@/routes';
import type { Inputs } from '@/hooks/use-calculator';
import type { RateMode } from '@/hooks/use-calculator-scenario';

type RateResponse = {
    rates: Partial<Record<'IDR' | 'MYR', { rate: number; date: string }>>;
    stale: boolean;
};
export default function ExchangeRateField({
    value,
    currency,
    language,
    mode,
    onChange,
    onCurrencyChange,
    onModeChange,
}: {
    value: number;
    currency: Inputs['currency'];
    language: Inputs['language'];
    mode: RateMode;
    onChange: (value: number) => void;
    onCurrencyChange: (currency: Inputs['currency']) => void;
    onModeChange: (mode: RateMode) => void;
}) {
    const [result, setResult] = useState<RateResponse | null>(null);
    const [failed, setFailed] = useState(false);
    const id = language === 'id';
    const reference =
        currency !== 'USD' ? result?.rates?.[currency] : undefined;
    useEffect(() => {
        const controller = new AbortController();
        void fetch(exchangeRates.url(), {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Exchange rates unavailable');
                const data: RateResponse = await response.json();
                setResult(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });
        return () => controller.abort();
    }, []);
    useEffect(() => {
        if (
            mode === 'auto' &&
            reference &&
            Number.isFinite(reference.rate) &&
            reference.rate > 0 &&
            reference.rate !== value
        )
            onChange(reference.rate);
    }, [mode, reference, value, onChange]);
    const rateDate = reference?.date
        ? new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
              dateStyle: 'medium',
              timeZone: 'UTC',
          }).format(new Date(`${reference.date}T00:00:00Z`))
        : null;
    return (
        <Box>
            <NumberField
                fullWidth
                size="small"
                label={id ? 'Kurs per USD' : 'Rate per USD'}
                language={language}
                value={currency === 'USD' ? 1 : value}
                onValueChange={(rate) => {
                    onModeChange('manual');
                    onChange(rate);
                }}
                slotProps={{
                    htmlInput: {
                        'aria-label': id ? 'Kurs per USD' : 'Rate per USD',
                    },
                    input: {
                        readOnly: currency === 'USD',
                        endAdornment: (
                            <InputAdornment position="end">
                                <Select
                                    variant="standard"
                                    disableUnderline
                                    value={currency}
                                    onChange={(event) => {
                                        onModeChange('auto');
                                        onCurrencyChange(event.target.value);
                                        onChange(
                                            event.target.value === 'USD'
                                                ? 1
                                                : 0,
                                        );
                                    }}
                                    inputProps={{
                                        'aria-label': id
                                            ? 'Mata uang'
                                            : 'Currency',
                                    }}
                                    sx={{
                                        minHeight: 44,
                                        minWidth: 80,
                                        borderLeft: 1,
                                        borderColor: 'divider',
                                        pl: 1,
                                    }}
                                >
                                    {['IDR', 'MYR', 'USD'].map((code) => (
                                        <MenuItem key={code} value={code}>
                                            {code}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </InputAdornment>
                        ),
                    },
                }}
            />
            {currency !== 'USD' && (
                <Box
                    role="status"
                    sx={{
                        mt: 1,
                        fontSize: 14,
                        color: 'text.secondary',
                        lineHeight: 1.6,
                    }}
                >
                    <Box
                        component="a"
                        href="https://frankfurter.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Frankfurter
                    </Box>
                    {' · '}
                    {rateDate
                        ? `${id ? 'Tanggal kurs' : 'Rate date'}: ${rateDate}`
                        : failed || result
                          ? id
                              ? 'Pembaruan tidak tersedia'
                              : 'Update unavailable'
                          : id
                            ? 'Memuat pembaruan…'
                            : 'Loading update…'}
                </Box>
            )}
        </Box>
    );
}
