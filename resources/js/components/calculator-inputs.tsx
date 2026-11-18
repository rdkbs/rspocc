import { usePage } from '@inertiajs/react';
import type { RefObject } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
    formatDisplayNumber,
    type PriceReference,
} from '@/calculator-assumptions';
import type { CalculatorCopy } from '@/calculator-copy';
import ExtractionRateSettings from '@/components/extraction-rate-settings';
import NumberField from '@/components/number-field';
import { credits, type Inputs } from '@/hooks/use-calculator';
import { useCalculatorScenario } from '@/hooks/use-calculator-scenario';
import { language as calculatorLanguage } from '@/routes/calculator';

type Scenario = ReturnType<typeof useCalculatorScenario>;

export default function CalculatorInputs({
    scenario,
    text,
    configDetails,
    showRateSettings,
    rateSettingsOpen,
    onRateSettingsToggle,
}: {
    scenario: Scenario;
    text: CalculatorCopy;
    configDetails: RefObject<HTMLDetailsElement | null>;
    showRateSettings: boolean;
    rateSettingsOpen: boolean;
    onRateSettingsToggle: (open: boolean) => void;
}) {
    const { inputs, setInputs, update } = scenario;
    const { priceReference } = usePage<{
        priceReference: PriceReference | null;
    }>().props;
    const pricePresets = priceReference
        ? ([
              {
                  key: 'is',
                  label:
                      inputs.language === 'id'
                          ? 'Petani swadaya (IS)'
                          : 'Independent Smallholder (IS)',
                  prices: priceReference.prices.is,
              },
              {
                  key: 'standard',
                  label: inputs.language === 'id' ? 'Standar' : 'Standard',
                  prices: priceReference.prices.standard,
              },
          ] as const)
        : [];
    const formatPrice = (value: number) =>
        formatDisplayNumber(value, inputs.language);
    const priceReferenceDate = new Intl.DateTimeFormat(
        inputs.language === 'id' ? 'id-ID' : 'en-US',
        { dateStyle: 'medium', timeZone: 'UTC' },
    ).format(new Date(priceReference?.checkedOn ?? 0));
    const brandedNumberFieldSx = {
        '& .MuiInputLabel-root': { color: 'primary.dark' },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.dark',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.dark',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            {
                borderColor: 'primary.dark',
                borderWidth: 2,
            },
        '& .MuiOutlinedInput-root:active .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.dark',
            borderWidth: 2,
        },
    };

    return (
        <Paper
            component="form"
            aria-label={text.inputs}
            action={calculatorLanguage.url({ language: inputs.language })}
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
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                    sx={{
                                                        '& .MuiTypography-root':
                                                            {
                                                                fontSize:
                                                                    '1rem',
                                                            },
                                                    }}
                                                >
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
                        {priceReference && (
                            <>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 3 }}
                                >
                                    {inputs.language === 'id'
                                        ? 'Klik kartu untuk memakai harga transaksi terakhir di PRISMA.'
                                        : 'Select a card to use PRISMA’s last-traded prices.'}
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
                                                    justifyContent:
                                                        'flex-start',
                                                    alignItems: 'flex-start',
                                                    border: 1,
                                                    borderColor: selected
                                                        ? 'primary.dark'
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
                                                    containerType:
                                                        'inline-size',
                                                    '&:hover': {
                                                        borderColor:
                                                            'primary.dark',
                                                        bgcolor: 'action.hover',
                                                    },
                                                    '&:focus-visible': {
                                                        outline: '2px solid',
                                                        outlineColor:
                                                            'primary.dark',
                                                        outlineOffset: 2,
                                                    },
                                                }}
                                            >
                                                <Stack
                                                    sx={{
                                                        gap: 1,
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            lineHeight: 1.3,
                                                            ...(selected && {
                                                                color: 'primary.dark',
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
                                                        {credits.map(
                                                            (credit) => (
                                                                <Box
                                                                    key={credit}
                                                                    sx={{
                                                                        minWidth: 0,
                                                                    }}
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
                                                                            color: 'primary.dark',
                                                                            fontSize:
                                                                                'clamp(0.875rem, calc(0.5rem + 3.5cqi), 1rem)',
                                                                            fontVariantNumeric:
                                                                                'tabular-nums',
                                                                            lineHeight: 1.3,
                                                                        }}
                                                                    >
                                                                        {formatPrice(
                                                                            preset
                                                                                .prices[
                                                                                credit
                                                                            ],
                                                                        )}
                                                                    </Typography>
                                                                </Box>
                                                            ),
                                                        )}
                                                    </Box>
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ lineHeight: 1.2 }}
                                                    >
                                                        {priceReference?.source}{' '}
                                                        ·{' '}
                                                        {inputs.language ===
                                                        'id'
                                                            ? 'Diambil'
                                                            : 'Retrieved'}{' '}
                                                        {priceReferenceDate}
                                                    </Typography>
                                                </Stack>
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </>
                        )}
                    </Box>
                    {showRateSettings && (
                        <ExtractionRateSettings
                            inputs={inputs}
                            text={text}
                            ratesValid={scenario.ratesValid}
                            open={rateSettingsOpen}
                            detailsRef={configDetails}
                            onRateChange={(key, value) => update(key, value)}
                            onOpenChange={onRateSettingsToggle}
                        />
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}
