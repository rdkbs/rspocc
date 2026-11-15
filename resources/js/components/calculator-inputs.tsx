import { useEffect, useRef, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { defaultPriceReference } from '@/calculator-assumptions';
import type { CalculatorCopy } from '@/calculator-copy';
import ExchangeRateField from '@/components/exchange-rate-field';
import NumberField from '@/components/number-field';
import { credits, type Inputs } from '@/hooks/use-calculator';
import { useCalculatorScenario } from '@/hooks/use-calculator-scenario';
import { calculator } from '@/routes';

type Scenario = ReturnType<typeof useCalculatorScenario>;

export default function CalculatorInputs({
    scenario,
    text,
}: {
    scenario: Scenario;
    text: CalculatorCopy;
}) {
    const { inputs, setInputs, update, rateMode, setRateMode, ratesValid } =
        scenario;
    const configDetails = useRef<HTMLDetailsElement>(null);
    const [activeConfig, setActiveConfig] = useState<'rates' | 'currency'>(
        'currency',
    );

    useEffect(() => {
        if (!ratesValid) {
            setActiveConfig('rates');
            if (configDetails.current) {
                configDetails.current.open = true;
            }
        }
    }, [ratesValid]);

    const rateLabels = {
        oer: 'CSPO',
        ker: 'CSPKO',
        yield: 'CSPKE',
    } as const;
    const pricePresets = [
        {
            key: 'is',
            label:
                inputs.language === 'id'
                    ? 'Petani Swadaya (IS)'
                    : 'Independent Smallholder (IS)',
            prices: defaultPriceReference.prices.is,
        },
        {
            key: 'standard',
            label: inputs.language === 'id' ? 'Standar' : 'Standard',
            prices: defaultPriceReference.prices.standard,
        },
    ] as const;
    const priceFormat = new Intl.NumberFormat(
        inputs.language === 'id' ? 'id-ID' : 'en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    );
    const priceReferenceDate = new Intl.DateTimeFormat(
        inputs.language === 'id' ? 'id-ID' : 'en-US',
        { dateStyle: 'medium', timeZone: 'UTC' },
    ).format(new Date(`${defaultPriceReference.checkedOn}T00:00:00Z`));
    const brandedNumberFieldSx = {
        '& .MuiInputLabel-root': { color: 'primary.main' },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.dark',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            {
                borderColor: 'primary.main',
                borderWidth: 2,
            },
        '& .MuiOutlinedInput-root:active .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: 2,
        },
    };

    return (
        <Paper
            component="form"
            aria-label={text.inputs}
            action={
                calculator.url(undefined, {
                    query: { lang: inputs.language },
                }) || '/'
            }
            onSubmit={(event) => event.preventDefault()}
            variant="outlined"
            sx={{
                p: { xs: 2.5, md: 4 },
                containerType: 'inline-size',
                containerName: 'calculator-inputs',
            }}
        >
            <Typography
                component="h1"
                id="calculator-title"
                sx={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
            >
                {text.inputs}
            </Typography>
            <Stack sx={{ gap: 3 }}>
                <NumberField
                    fullWidth
                    label={text.volume}
                    sx={brandedNumberFieldSx}
                    language={inputs.language}
                    value={inputs.volume}
                    onValueChange={(value) => update('volume', value)}
                    slotProps={{
                        htmlInput: { min: 0, max: 1e12, step: 'any' },
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Select
                                        variant="standard"
                                        disableUnderline
                                        value={inputs.unit}
                                        onChange={(event) =>
                                            update(
                                                'unit',
                                                event.target
                                                    .value as Inputs['unit'],
                                            )
                                        }
                                        inputProps={{ 'aria-label': text.unit }}
                                        sx={{
                                            minWidth: 82,
                                            minHeight: 48,
                                            borderLeft: 1,
                                            borderColor: 'divider',
                                            pl: 1.5,
                                        }}
                                        SelectDisplayProps={{
                                            style: {
                                                minHeight: 44,
                                                boxSizing: 'border-box',
                                            },
                                        }}
                                    >
                                        <MenuItem value="kg">kg</MenuItem>
                                        <MenuItem value="t">
                                            {inputs.language === 'id'
                                                ? 'Ton'
                                                : 'Tonnes'}
                                        </MenuItem>
                                    </Select>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Stack
                    sx={{
                        gap: 2.5,
                        '& .MuiOutlinedInput-root': {
                            minHeight: 48,
                            pr: 1,
                        },
                        '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button':
                            { WebkitAppearance: 'none', margin: 0 },
                        '& .MuiInputBase-input': {
                            py: 1.4,
                            fontSize: '1rem',
                            px: { xs: 1, sm: 1.5 },
                        },
                    }}
                >
                    <Box>
                        <Stack
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr)',
                                gap: 1.5,
                                '@container calculator-inputs (inline-size > 30rem)':
                                    {
                                        gridTemplateColumns:
                                            'repeat(3, minmax(0, 1fr))',
                                    },
                            }}
                        >
                            {credits.map((credit) => (
                                <NumberField
                                    key={credit}
                                    fullWidth
                                    size="small"
                                    sx={{
                                        ...brandedNumberFieldSx,
                                        minWidth: 0,
                                    }}
                                    label={
                                        inputs.language === 'id'
                                            ? 'Harga ' + credit.toUpperCase()
                                            : credit.toUpperCase() + ' Price'
                                    }
                                    language={inputs.language}
                                    value={inputs.prices[credit]}
                                    onValueChange={(value) =>
                                        setInputs((previous) => ({
                                            ...previous,
                                            prices: {
                                                ...previous.prices,
                                                [credit]: value,
                                            },
                                        }))
                                    }
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    USD
                                                </InputAdornment>
                                            ),
                                        },
                                        htmlInput: {
                                            'aria-label':
                                                credit.toUpperCase() +
                                                ' ' +
                                                (inputs.language === 'id'
                                                    ? 'Harga'
                                                    : 'Price') +
                                                ' (USD)',
                                            min: 0,
                                            max: 1e12,
                                            step: 'any',
                                        },
                                    }}
                                />
                            ))}
                        </Stack>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1.5 }}
                        >
                            {inputs.language === 'id'
                                ? 'Harga dapat diisi dari salah satu referensi di bawah.'
                                : 'You can fill these prices from either reference below.'}
                        </Typography>
                        <Box
                            role="group"
                            aria-label={
                                inputs.language === 'id'
                                    ? 'Referensi harga PRISMA'
                                    : 'PRISMA price references'
                            }
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr)',
                                gap: 1,
                                mt: 1.5,
                                '@container calculator-inputs (inline-size > 30rem)':
                                    {
                                        gridTemplateColumns:
                                            'repeat(2, minmax(0, 1fr))',
                                    },
                            }}
                        >
                            {pricePresets.map((preset) => {
                                const selected = credits.every(
                                    (credit) =>
                                        inputs.prices[credit] ===
                                        preset.prices[credit],
                                );

                                return (
                                    <Button
                                        key={preset.key}
                                        type="button"
                                        disableRipple
                                        aria-pressed={selected}
                                        onClick={() =>
                                            setInputs((previous) => ({
                                                ...previous,
                                                prices: preset.prices,
                                            }))
                                        }
                                        sx={{
                                            width: '100%',
                                            minHeight: 48,
                                            justifyContent: 'flex-start',
                                            alignItems: 'flex-start',
                                            border: 1,
                                            borderColor: selected
                                                ? 'primary.main'
                                                : 'divider',
                                            borderRadius: 1,
                                            px: 1.25,
                                            py: 1,
                                            textAlign: 'left',
                                            color: selected
                                                ? 'text.primary'
                                                : 'text.secondary',
                                            bgcolor: selected
                                                ? 'action.selected'
                                                : 'transparent',
                                            containerType: 'inline-size',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'action.hover',
                                            },
                                            '&:focus-visible': {
                                                outline: '2px solid',
                                                outlineColor: 'primary.main',
                                                outlineOffset: 2,
                                            },
                                        }}
                                    >
                                        <Stack sx={{ gap: 1, width: '100%' }}>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 500,
                                                    lineHeight: 1.3,
                                                    ...(selected && {
                                                        color: 'primary.main',
                                                    }),
                                                }}
                                            >
                                                {preset.label} · USD
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns:
                                                        'repeat(3, minmax(0, 1fr))',
                                                    gap: 1,
                                                    width: '100%',
                                                }}
                                            >
                                                {credits.map((credit) => (
                                                    <Box
                                                        key={credit}
                                                        sx={{ minWidth: 0 }}
                                                    >
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                fontSize:
                                                                    'clamp(0.75rem, calc(0.45rem + 2.7cqi), 0.875rem)',
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            {credit.toUpperCase()}
                                                        </Typography>
                                                        <Typography
                                                            component="span"
                                                            sx={{
                                                                display:
                                                                    'block',
                                                                color: 'primary.main',
                                                                fontSize:
                                                                    'clamp(0.875rem, calc(0.5rem + 3.5cqi), 1rem)',
                                                                fontVariantNumeric:
                                                                    'tabular-nums',
                                                                lineHeight: 1.3,
                                                            }}
                                                        >
                                                            {priceFormat.format(
                                                                preset.prices[
                                                                    credit
                                                                ],
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ lineHeight: 1.2 }}
                                            >
                                                {defaultPriceReference.source} ·{' '}
                                                {priceReferenceDate}
                                            </Typography>
                                        </Stack>
                                    </Button>
                                );
                            })}
                        </Box>
                    </Box>
                    <Box
                        component="details"
                        ref={configDetails}
                        sx={{
                            border: 1,
                            borderColor:
                                !ratesValid && activeConfig === 'rates'
                                    ? 'error.main'
                                    : 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            '&[open] > summary': {
                                borderBottom: 1,
                                borderColor: 'divider',
                            },
                            '&[open] > summary .settings-disclosure-icon': {
                                transform: 'rotate(180deg)',
                            },
                        }}
                    >
                        <Box
                            component="summary"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 2,
                                py: 1,
                                minHeight: 48,
                                cursor: 'pointer',
                                listStyle: 'none',
                                '&::-webkit-details-marker': {
                                    display: 'none',
                                },
                            }}
                        >
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: 500 }}
                            >
                                {inputs.language === 'id'
                                    ? 'Pengaturan Mata Uang dan Rendemen'
                                    : 'Currency and Extraction Rate Settings'}
                            </Typography>
                            <ExpandMoreIcon
                                className="settings-disclosure-icon"
                                aria-hidden="true"
                                sx={{
                                    ml: 'auto',
                                    color: 'text.secondary',
                                    transition: 'transform 160ms ease',
                                }}
                            />
                        </Box>
                        <Tabs
                            value={activeConfig}
                            onChange={(_, value: 'rates' | 'currency') =>
                                setActiveConfig(value)
                            }
                            aria-label={
                                inputs.language === 'id'
                                    ? 'Pengaturan kalkulator'
                                    : 'Calculator settings'
                            }
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab
                                value="currency"
                                id="calculator-currency-tab"
                                label={
                                    inputs.language === 'id'
                                        ? 'Kurs mata uang'
                                        : 'Currency rate'
                                }
                            />
                            <Tab
                                value="rates"
                                id="calculator-rates-tab"
                                label={
                                    inputs.language === 'id'
                                        ? 'Rendemen'
                                        : 'Extraction rates'
                                }
                            />
                        </Tabs>
                        {activeConfig === 'rates' ? (
                            <Stack
                                role="tabpanel"
                                id="calculator-rates-panel"
                                aria-labelledby="calculator-rates-tab"
                                sx={{ p: 2, gap: 2.5 }}
                            >
                                <Typography
                                    component="h3"
                                    variant="body2"
                                    sx={{ fontSize: 16, fontWeight: 600 }}
                                >
                                    {inputs.language === 'id'
                                        ? 'Rendemen (% dari TBS)'
                                        : 'Extraction rates (% of FFB)'}
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(3, minmax(0, 1fr))',
                                        gap: { xs: 1, sm: 2 },
                                    }}
                                >
                                    {(['oer', 'ker', 'yield'] as const).map(
                                        (key) => (
                                            <Box key={key} sx={{ minWidth: 0 }}>
                                                <NumberField
                                                    fullWidth
                                                    size="small"
                                                    label={rateLabels[key]}
                                                    language={inputs.language}
                                                    value={inputs[key]}
                                                    onValueChange={(value) =>
                                                        update(key, value ?? 0)
                                                    }
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment
                                                                    position="end"
                                                                    sx={{
                                                                        ml: 0,
                                                                    }}
                                                                >
                                                                    %
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                        htmlInput: {
                                                            'aria-label':
                                                                text[key] +
                                                                ' (%)',
                                                            min: 0,
                                                            max: 100,
                                                            step: 0.01,
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        ),
                                    )}
                                </Box>
                            </Stack>
                        ) : (
                            <Box
                                role="tabpanel"
                                id="calculator-currency-panel"
                                aria-labelledby="calculator-currency-tab"
                                sx={{ p: 2 }}
                            >
                                <ExchangeRateField
                                    value={inputs.exchange}
                                    currency={inputs.currency}
                                    language={inputs.language}
                                    mode={rateMode}
                                    onModeChange={setRateMode}
                                    onChange={(value) =>
                                        update('exchange', value)
                                    }
                                    onCurrencyChange={(currency) =>
                                        update('currency', currency)
                                    }
                                />
                            </Box>
                        )}
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}
