import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
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
    const formattedReferenceRate = reference
        ? `${new Intl.NumberFormat(id ? 'id-ID' : 'en-US', {
              maximumFractionDigits: 4,
          }).format(reference.rate)} ${currency}`
        : null;
    return (
        <Box
            sx={{
                pt: 1,
            }}
        >
            <NumberField
                fullWidth
                size="small"
                label={id ? 'Kurs per USD' : 'Rate per USD'}
                language={language}
                value={currency === 'USD' ? 1 : value}
                onValueChange={(rate) => {
                    onModeChange('manual');
                    onChange(rate ?? 0);
                }}
                slotProps={{
                    htmlInput: {
                        'aria-label': id ? 'Kurs per USD' : 'Rate per USD',
                    },
                    input: {
                        readOnly: currency === 'USD',
                        startAdornment: (
                            <InputAdornment position="start">
                                <Select
                                    variant="standard"
                                    disableUnderline
                                    value={currency === 'USD' ? '' : currency}
                                    displayEmpty
                                    renderValue={() => currency}
                                    onChange={(event) => {
                                        onModeChange('auto');
                                        onCurrencyChange(event.target.value);
                                        onChange(0);
                                    }}
                                    inputProps={{
                                        'aria-label': id
                                            ? 'Mata uang'
                                            : 'Currency',
                                    }}
                                    sx={{
                                        minHeight: 44,
                                        minWidth: 80,
                                        borderRight: 1,
                                        borderColor: 'divider',
                                        pr: 1,
                                    }}
                                >
                                    {['IDR', 'MYR'].map((code) => (
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
                    sx={{
                        mt: 0.5,
                    }}
                >
                    {reference &&
                        Number.isFinite(reference.rate) &&
                        reference.rate > 0 &&
                        reference.rate !== value && (
                            <Button
                                type="button"
                                size="small"
                                onClick={() => {
                                    onModeChange('auto');
                                    onChange(reference.rate);
                                }}
                                sx={{
                                    minWidth: 0,
                                    px: 0.5,
                                    textTransform: 'none',
                                    verticalAlign: 'baseline',
                                }}
                            >
                                {id
                                    ? `Gunakan kurs ini: ${formattedReferenceRate} untuk 1 USD`
                                    : `Use this rate: ${formattedReferenceRate} for 1 USD`}
                            </Button>
                        )}
                    <Typography
                        component="div"
                        variant="caption"
                        color="text.secondary"
                    >
                        <Box
                            component="a"
                            href="https://frankfurter.dev/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                minHeight: 44,
                            }}
                        >
                            Frankfurter
                        </Box>
                        {' · '}
                        <Box component="span" role="status">
                            {rateDate
                                ? id
                                    ? `Diperbarui ${rateDate}`
                                    : `Updated ${rateDate}`
                                : failed || result
                                  ? id
                                      ? 'Pembaruan tidak tersedia'
                                      : 'Update unavailable'
                                  : id
                                    ? 'Memuat pembaruan…'
                                    : 'Loading update…'}
                        </Box>
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
