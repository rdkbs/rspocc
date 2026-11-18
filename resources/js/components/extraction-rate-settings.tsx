import { useEffect, type RefObject } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CalculatorCopy } from '@/calculator-copy';
import NumberField from '@/components/number-field';
import type { Inputs } from '@/hooks/use-calculator';

type Props = {
    inputs: Inputs;
    text: CalculatorCopy;
    ratesValid: boolean;
    open: boolean;
    detailsRef: RefObject<HTMLDetailsElement | null>;
    onRateChange: (key: 'oer' | 'ker' | 'yield', value: number) => void;
    onOpenChange: (open: boolean) => void;
};

export default function ExtractionRateSettings({
    inputs,
    text,
    ratesValid,
    open,
    detailsRef,
    onRateChange,
    onOpenChange,
}: Props) {
    useEffect(() => {
        if (!ratesValid) {
            onOpenChange(true);
        }
    }, [ratesValid, onOpenChange]);

    const rateLabels = {
        oer: 'CSPO',
        ker: 'CSPKO',
        yield: 'CSPKE',
    } as const;

    return (
        <Box
            component="details"
            ref={detailsRef}
            open={open}
            onToggle={(event) => onOpenChange(event.currentTarget.open)}
            sx={{
                border: 1,
                borderColor: !ratesValid ? 'error.main' : 'divider',
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
                    '&::-webkit-details-marker': { display: 'none' },
                }}
            >
                <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                >
                    {inputs.language === 'id'
                        ? 'Pengaturan rendemen'
                        : 'Extraction Rate Settings'}
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
            <Stack
                role="group"
                id="calculator-rates-panel"
                aria-labelledby="calculator-rates-heading"
                sx={{ p: 2, gap: 2.5 }}
            >
                <Typography
                    component="h3"
                    id="calculator-rates-heading"
                    tabIndex={-1}
                    variant="body2"
                    sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'primary.main',
                    }}
                >
                    {inputs.language === 'id'
                        ? 'Rendemen (% dari TBS)'
                        : 'Extraction rates (% of FFB)'}
                </Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: { xs: 1, sm: 2 },
                    }}
                >
                    {(['oer', 'ker', 'yield'] as const).map((key) => (
                        <Box key={key} sx={{ minWidth: 0 }}>
                            <NumberField
                                fullWidth
                                size="small"
                                label={rateLabels[key]}
                                language={inputs.language}
                                value={inputs[key]}
                                onValueChange={(value) =>
                                    onRateChange(key, value ?? 0)
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
                                        id: `${rateLabels[key].toLowerCase()}-rate`,
                                        'aria-label': text[key] + ' (%)',
                                        min: 0,
                                        max: 100,
                                        step: 0.01,
                                    },
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            </Stack>
        </Box>
    );
}
