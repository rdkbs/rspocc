import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { defaultPriceReference } from '@/calculator-assumptions';
import type { CalculatorCopy } from '@/calculator-copy';
import ExchangeRateField from '@/components/exchange-rate-field';
import NumberField from '@/components/number-field';
import { credits, type Inputs } from '@/hooks/use-calculator';
import { useCalculatorScenario } from '@/hooks/use-calculator-scenario';
import { calculator, glossary } from '@/routes';

function Help({ text, label }: { text: string; label: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Tooltip
            title={text}
            describeChild
            open={open}
            onClose={() => setOpen(false)}
            disableHoverListener
            disableFocusListener
            disableTouchListener
            arrow
        >
            <Button
                type="button"
                size="small"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                {label} ?
            </Button>
        </Tooltip>
    );
}

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
    const ratesDetails = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        if (!ratesValid && ratesDetails.current) {
            ratesDetails.current.open = true;
        }
    }, [ratesValid]);

    const rateLabels = {
        oer: 'CSPO',
        ker: 'CSPKO',
        yield: 'CSPKE',
    } as const;
    const rateHelp = {
        oer: text.oerHelp,
        ker: text.kerHelp,
        yield: text.yieldHelp,
    } as const;

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
            sx={{ p: { xs: 2.5, md: 4 } }}
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
                    language={inputs.language}
                    value={inputs.volume}
                    onValueChange={(value) => update('volume', value)}
                    placeholder={
                        inputs.language === 'id'
                            ? 'Masukkan Volume TBS'
                            : 'Enter FFB volume'
                    }
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
                        <Typography
                            component="h3"
                            variant="body2"
                            sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}
                        >
                            {inputs.language === 'id'
                                ? 'Harga kredit IS (USD / kredit)'
                                : 'IS credit prices (USD / credit)'}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 14, lineHeight: 1.6, mb: 2 }}
                        >
                            {text.basis}
                        </Typography>
                        <Stack sx={{ gap: 1.5 }}>
                            {credits.map((credit) => (
                                <Box
                                    key={credit}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            '130px minmax(0, 1fr)',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}
                                >
                                    <FormControlLabel
                                        sx={{
                                            m: 0,
                                            '& .MuiTypography-root': {
                                                fontSize: 16,
                                            },
                                        }}
                                        control={
                                            <Checkbox
                                                sx={{
                                                    minHeight: 44,
                                                    minWidth: 44,
                                                }}
                                                checked={
                                                    inputs.included[credit]
                                                }
                                                onChange={(event) =>
                                                    setInputs((previous) => ({
                                                        ...previous,
                                                        included: {
                                                            ...previous.included,
                                                            [credit]:
                                                                event.target
                                                                    .checked,
                                                        },
                                                    }))
                                                }
                                            />
                                        }
                                        label={'IS-' + credit.toUpperCase()}
                                    />
                                    <NumberField
                                        fullWidth
                                        size="small"
                                        disabled={!inputs.included[credit]}
                                        label={
                                            inputs.language === 'id'
                                                ? 'Harga'
                                                : 'Price'
                                        }
                                        language={inputs.language}
                                        value={inputs.prices[credit]}
                                        placeholder={
                                            inputs.language === 'id'
                                                ? `Masukkan harga ${credit.toUpperCase()}`
                                                : `Enter ${credit.toUpperCase()} price`
                                        }
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
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
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
                                </Box>
                            ))}
                        </Stack>
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 14, lineHeight: 1.6, mt: 2 }}
                        >
                            {inputs.language === 'id'
                                ? `Placeholder harga IS dari transaksi terakhir ${defaultPriceReference.period}, diperiksa `
                                : `IS price placeholders show last-traded prices from ${defaultPriceReference.period}, checked `}
                            {defaultPriceReference.checkedOn}
                            {' · '}
                            <Box
                                component="a"
                                href={defaultPriceReference.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {defaultPriceReference.source}
                            </Box>
                        </Typography>
                    </Box>
                    <Box
                        component="details"
                        ref={ratesDetails}
                        sx={{
                            border: 1,
                            borderColor: ratesValid ? 'divider' : 'error.main',
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            '&[open] > summary': {
                                borderBottom: 1,
                                borderColor: 'divider',
                            },
                        }}
                    >
                        <Box
                            component="summary"
                            sx={{
                                px: 2,
                                py: 1.5,
                                minHeight: 64,
                                cursor: 'pointer',
                                '&::marker': { color: 'primary.main' },
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{ fontSize: 16, fontWeight: 600 }}
                            >
                                {inputs.language === 'id'
                                    ? 'Kurs & rendemen'
                                    : 'Rates'}
                            </Typography>
                            <Typography
                                component="span"
                                color="text.secondary"
                                sx={{ display: 'block', fontSize: 14, mt: 0.5 }}
                            >
                                {inputs.language === 'id'
                                    ? 'Rendemen dan '
                                    : 'Extraction rates and '}
                                {inputs.currency}/USD
                            </Typography>
                        </Box>
                        <Stack sx={{ p: 2, gap: 2.5 }}>
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
                                            <Typography
                                                sx={{
                                                    fontSize: 14,
                                                    color: 'text.secondary',
                                                    mb: 1,
                                                }}
                                            >
                                                {rateLabels[key]}
                                            </Typography>
                                            <NumberField
                                                fullWidth
                                                size="small"
                                                label={
                                                    key === 'oer'
                                                        ? 'OER'
                                                        : inputs.language ===
                                                            'id'
                                                          ? 'Rendemen'
                                                          : 'Rate'
                                                }
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
                                                                sx={{ ml: 0 }}
                                                            >
                                                                %
                                                            </InputAdornment>
                                                        ),
                                                    },
                                                    htmlInput: {
                                                        'aria-label':
                                                            text[key] + ' (%)',
                                                        min: 0,
                                                        max: 100,
                                                        step: 0.01,
                                                    },
                                                }}
                                            />
                                            <Help
                                                label={rateLabels[key]}
                                                text={rateHelp[key]}
                                            />
                                        </Box>
                                    ),
                                )}
                            </Box>
                            <Button
                                component="a"
                                href={glossary.url({
                                    query: { lang: inputs.language },
                                })}
                            >
                                {inputs.language === 'id'
                                    ? 'Arti istilah'
                                    : 'Glossary'}
                            </Button>
                            <ExchangeRateField
                                value={inputs.exchange}
                                currency={inputs.currency}
                                language={inputs.language}
                                mode={rateMode}
                                onModeChange={setRateMode}
                                onChange={(value) => update('exchange', value)}
                                onCurrencyChange={(currency) =>
                                    update('currency', currency)
                                }
                            />
                        </Stack>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}
