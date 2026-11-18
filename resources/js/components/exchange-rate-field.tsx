import type { ExchangeRates } from '@/calculator-assumptions';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NumberField from '@/components/number-field';
import type { Inputs } from '@/hooks/use-calculator';
import type { RateMode } from '@/hooks/use-calculator-scenario';

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
    const { exchangeRates } = usePage<{ exchangeRates: ExchangeRates }>().props;
    const id = language === 'id';
    const reference = currency !== 'USD' ? exchangeRates[currency] : undefined;
    const currencySelect = (
        <Select
            name="currency"
            variant="standard"
            disableUnderline
            value={currency}
            displayEmpty
            renderValue={() => currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            inputProps={{
                'aria-label': id ? 'Mata uang' : 'Currency',
            }}
            sx={{
                minHeight: 44,
                minWidth: 80,
                color:
                    currency === 'USD'
                        ? 'primary.contrastText'
                        : 'text.primary',
                borderRight: currency === 'USD' ? 0 : 1,
                borderColor: 'primary.main',
                pr: 1,
                '& .MuiSelect-icon': { color: 'inherit' },
                '&.Mui-focused': {
                    outline: '2px solid currentColor',
                    outlineOffset: 1,
                    borderRadius: 1,
                },
            }}
        >
            {['CNY', 'EUR', 'IDR', 'MYR', 'SGD', 'USD'].map((code) => (
                <MenuItem key={code} value={code}>
                    {code}
                </MenuItem>
            ))}
        </Select>
    );
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
    if (currency === 'USD') {
        return (
            <Stack
                direction="row"
                sx={{
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.contrastText',
                }}
            >
                {currencySelect}
                <Typography sx={{ opacity: 0.8 }}>
                    {id
                        ? 'Tidak perlu kurs untuk hasil dalam USD.'
                        : 'No exchange rate is needed for USD.'}
                </Typography>
            </Stack>
        );
    }
    const rateDate = reference?.date
        ? new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
              dateStyle: 'medium',
              timeZone: 'UTC',
          }).format(new Date(`${reference.date}T00:00:00Z`))
        : null;
    const formattedReferenceRate = reference
        ? `${new Intl.NumberFormat(id ? 'id-ID' : 'en-US', {
              maximumFractionDigits: reference.rate > 999999 ? 0 : 4,
          }).format(reference.rate)} ${currency}/USD`
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
                variant="outlined"
                language={language}
                value={value}
                sx={(theme) => ({
                    '& .MuiOutlinedInput-root': {
                        minHeight: 48,
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        '& fieldset': { border: 0 },
                        '&.Mui-focused': {
                            outline: `2px solid ${theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.contrastText}`,
                            outlineOffset: 1,
                            borderRadius: 1,
                        },
                    },
                    '& .MuiInputAdornment-root': {
                        color: theme.palette.text.secondary,
                    },
                })}
                onValueChange={(rate) => {
                    onModeChange('manual');
                    onChange(rate ?? 0);
                }}
                slotProps={{
                    htmlInput: {
                        'aria-label': id ? 'Kurs per USD' : 'Rate per USD',
                        name: 'exchange',
                    },
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                {currencySelect}
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">/USD</InputAdornment>
                        ),
                    },
                }}
            />
            <Box
                sx={{
                    mt: 0.5,
                }}
            >
                {reference &&
                Number.isFinite(reference.rate) &&
                reference.rate > 0 &&
                reference.rate !== value ? (
                    <Button
                        type="button"
                        size="small"
                        color="inherit"
                        variant="text"
                        onClick={() => {
                            onModeChange('auto');
                            onChange(reference.rate);
                        }}
                        sx={{
                            minWidth: 0,
                            minHeight: 44,
                            px: 0,
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            color: 'primary.contrastText',
                            textDecoration: 'underline',
                            '&:hover': {
                                bgcolor: 'rgba(242, 241, 235, 0.06)',
                            },
                        }}
                    >
                        {id
                            ? `Gunakan kurs terbaru dari Frankfuter: ${formattedReferenceRate}`
                            : `Use latest rate from Frankfuter: ${formattedReferenceRate}`}
                    </Button>
                ) : (
                    <Typography
                        component="div"
                        variant="caption"
                        sx={{ color: 'rgba(242, 241, 235, 0.72)' }}
                    >
                        <Box
                            component="a"
                            href="https://frankfurter.dev/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: 'inherit',
                                textDecoration: 'underline',
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
                                : id
                                  ? 'Pembaruan tidak tersedia'
                                  : 'Update unavailable'}
                        </Box>
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
