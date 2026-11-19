import { Fragment, useState } from 'react';
import type { RefObject } from 'react';
import { Link } from '@inertiajs/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ShareIcon from '@mui/icons-material/Share';
import {
    formatCurrencyParts,
    formatDisplayNumber,
} from '@/calculator-assumptions';
import type { CalculatorCopy } from '@/calculator-copy';
import ExchangeRateField from '@/components/exchange-rate-field';
import ExtractionRateSettings from '@/components/extraction-rate-settings';
import GlossaryText from '@/components/glossary-text';
import {
    credits,
    useCalculator,
    type Credit,
    type Inputs,
} from '@/hooks/use-calculator';
import type {
    RateMode,
    useCalculatorScenario,
} from '@/hooks/use-calculator-scenario';
import { localizedContent } from '@/routes';

const creditColors = {
    cspo: 'primary.main',
    cspko: 'secondary.main',
    cspke: '#929e78',
} as const;
export default function CalculatorResults({
    inputs,
    scenario,
    text,
    result,
    valid,
    ready,
    shareUrl,
    rateMode,
    onCurrencyChange,
    onRateModeChange,
    onExchangeRateChange,
    configDetails,
    rateSettingsOpen,
    onRateSettingsToggle,
    onEditExtractionRate,
}: {
    inputs: Inputs;
    scenario: ReturnType<typeof useCalculatorScenario>;
    text: CalculatorCopy;
    result: ReturnType<typeof useCalculator>;
    valid: boolean;
    ready: boolean;
    shareUrl: () => string;
    rateMode: RateMode;
    onCurrencyChange: (currency: Inputs['currency']) => void;
    onRateModeChange: (mode: RateMode) => void;
    onExchangeRateChange: (rate: number) => void;
    configDetails: RefObject<HTMLDetailsElement | null>;
    rateSettingsOpen: boolean;
    onRateSettingsToggle: (open: boolean) => void;
    onEditExtractionRate: (credit: Credit) => void;
}) {
    const extractionRates: Record<Credit, number> = {
        cspo: inputs.oer,
        cspko: inputs.ker,
        cspke: inputs.yield,
    };
    const getRateLabel = (credit: Credit) =>
        `${formatDisplayNumber(extractionRates[credit], inputs.language)}% ${inputs.language === 'id' ? 'dari TBS' : 'of FFB'}`;
    const number = (value: number) =>
        formatDisplayNumber(value, inputs.language);
    const money = (
        value: number,
        currency: string,
        currencySize = '0.78em',
    ) => {
        const parts = formatCurrencyParts(value, currency, inputs.language);
        const currencyIndex = parts.findIndex(
            (part) => part.type === 'currency',
        );
        const amountIndex = parts.findIndex((part) => part.type === 'integer');

        return parts.map((part, index) => {
            if (part.type === 'currency') {
                return (
                    <Box
                        key={index}
                        component="span"
                        sx={{
                            fontSize: currencySize,
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            ...(currencyIndex < amountIndex
                                ? { mr: '0.5em' }
                                : { ml: '0.5em' }),
                        }}
                    >
                        {part.value}
                    </Box>
                );
            }

            if (part.type === 'literal' && !part.value.trim()) {
                return null;
            }

            return <Fragment key={index}>{part.value}</Fragment>;
        });
    };
    const [shareMessage, setShareMessage] = useState('');
    const hasResults = ready && valid;
    const share = () => {
        const url = shareUrl();

        if (navigator.share) {
            void navigator
                .share({ title: document.title, url })
                .catch((error: unknown) => {
                    if (
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    ) {
                        return;
                    }

                    setShareMessage(text.shareFailed);
                });

            return;
        }

        if (!navigator.clipboard) {
            setShareMessage(text.shareFailed);

            return;
        }

        void navigator.clipboard
            .writeText(url)
            .then(() => setShareMessage(text.copied))
            .catch(() => setShareMessage(text.shareFailed));
    };

    const currencySettings = (
        <Box
            component="form"
            aria-label={
                inputs.language === 'id'
                    ? 'Pengaturan mata uang'
                    : 'Currency settings'
            }
            onSubmit={(event) => event.preventDefault()}
            sx={{ mt: 1, mb: 2 }}
        >
            <ExchangeRateField
                value={inputs.exchange}
                currency={inputs.currency}
                language={inputs.language}
                mode={rateMode}
                onModeChange={onRateModeChange}
                onChange={onExchangeRateChange}
                onCurrencyChange={onCurrencyChange}
            />
        </Box>
    );

    return (
        <Stack
            component="section"
            sx={{ position: { md: 'sticky' }, top: 24, gap: 3 }}
            aria-label={text.results}
        >
            <Paper
                sx={{
                    p: { xs: 3, md: 4 },
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                }}
            >
                <Typography
                    component="h2"
                    color="inherit"
                    sx={{ fontSize: 24, fontWeight: 600 }}
                >
                    {text.total}
                </Typography>
                {ready && currencySettings}
                {hasResults ? (
                    <>
                        <Typography
                            variant="h2"
                            component="p"
                            color="inherit"
                            sx={{
                                mt: 2,
                                fontSize: {
                                    xs: '2.35rem',
                                    lg: '3.1rem',
                                },
                                fontVariantNumeric: 'tabular-nums',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {money(result.converted, inputs.currency, '0.46em')}
                        </Typography>
                        {inputs.currency !== 'USD' && (
                            <Typography
                                color="inherit"
                                sx={{ mt: 1, opacity: 0.8 }}
                            >
                                {money(result.usd, 'USD')}
                            </Typography>
                        )}
                    </>
                ) : (
                    <Typography color="inherit" sx={{ mt: 2, lineHeight: 1.6 }}>
                        {!valid
                            ? inputs.exchange <= 0
                                ? text.missingRate
                                : text.error
                            : text.estimatePrompt}
                    </Typography>
                )}
                {hasResults && (
                    <Box
                        sx={{
                            mt: 4,
                            pt: 3,
                            borderTop: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography
                            color="secondary.main"
                            sx={{ color: 'inherit', fontWeight: 600 }}
                        >
                            {text.added}
                        </Typography>
                        <Typography
                            variant="h3"
                            component="p"
                            color="inherit"
                            sx={{
                                mt: 1,
                                fontSize: { xs: '2rem', md: '2.5rem' },
                            }}
                        >
                            {money(result.added, inputs.currency, '0.55em')}{' '}
                            <Typography component="span" color="inherit">
                                / kg
                            </Typography>
                        </Typography>
                    </Box>
                )}
            </Paper>
            {inputs.volume !== null && (
                <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                        component="h2"
                        sx={{
                            mb: 2,
                            fontSize: 24,
                            fontWeight: 600,
                            color: 'primary.main',
                        }}
                    >
                        {text.outputs}
                    </Typography>
                    <Box
                        component="figure"
                        role="img"
                        aria-label={
                            inputs.language === 'id'
                                ? 'Perbandingan volume produk CSPO, CSPKO, dan CSPKE'
                                : 'Comparison of CSPO, CSPKO, and CSPKE product volumes'
                        }
                        sx={{
                            m: 0,
                            display: valid ? 'flex' : 'none',
                            height: 8,
                            gap: 0.5,
                            mb: 2,
                            overflow: 'hidden',
                            borderRadius: 1,
                        }}
                    >
                        {credits.map((credit) => (
                            <Box
                                key={credit}
                                sx={{
                                    flexGrow: result.volumes[credit],
                                    bgcolor:
                                        inputs.prices[credit] === null
                                            ? 'action.disabledBackground'
                                            : creditColors[credit],
                                }}
                            />
                        ))}
                    </Box>
                    {credits.map((credit, index) => (
                        <Stack
                            key={credit}
                            direction="row"
                            sx={{
                                display: valid ? 'flex' : 'none',
                                justifyContent: 'space-between',
                                py: 1.5,
                                borderBottom:
                                    index < credits.length - 1 ? 1 : 0,
                                borderColor: 'divider',
                                color:
                                    inputs.prices[credit] === null
                                        ? 'text.disabled'
                                        : 'text.primary',
                                gap: 2,
                            }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        component="span"
                                        aria-hidden="true"
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            flexShrink: 0,
                                            bgcolor:
                                                inputs.prices[credit] === null
                                                    ? 'action.disabledBackground'
                                                    : creditColors[credit],
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        color="inherit"
                                        aria-label={
                                            inputs.language === 'id'
                                                ? `Ubah rendemen ${credit.toUpperCase()}: ${getRateLabel(credit)}`
                                                : `Edit ${credit.toUpperCase()} rate: ${getRateLabel(credit)}`
                                        }
                                        onClick={() =>
                                            onEditExtractionRate(credit)
                                        }
                                        sx={{
                                            minWidth: 0,
                                            minHeight: 44,
                                            px: 0,
                                            gap: 1.5,
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            color: 'inherit',
                                            fontSize: 'inherit',
                                            fontWeight: 'inherit',
                                            textTransform: 'none',
                                        }}
                                    >
                                        <Box component="span">
                                            {credit.toUpperCase()}
                                        </Box>
                                        <Box
                                            component="span"
                                            sx={{
                                                color:
                                                    inputs.prices[credit] ===
                                                    null
                                                        ? 'text.disabled'
                                                        : 'text.secondary',
                                                fontSize: 13,
                                                fontWeight: 400,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                                textDecoration: 'underline',
                                                textUnderlineOffset: 3,
                                            }}
                                        >
                                            {getRateLabel(credit)}
                                        </Box>
                                    </Button>
                                </Typography>
                                <Stack
                                    direction="row"
                                    sx={{
                                        columnGap: 4,
                                        rowGap: 0.5,
                                        flexWrap: 'wrap',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    <Typography
                                        color={
                                            inputs.prices[credit] === null
                                                ? 'text.disabled'
                                                : 'text.secondary'
                                        }
                                        sx={{ fontSize: 14 }}
                                    >
                                        {inputs.prices[credit] === null
                                            ? text.excluded
                                            : money(
                                                  result.revenues[credit],
                                                  'USD',
                                              )}
                                    </Typography>
                                    {inputs.prices[credit] !== null &&
                                        inputs.currency !== 'USD' && (
                                            <Typography
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: 14,
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {money(
                                                    result.revenues[credit] *
                                                        inputs.exchange,
                                                    inputs.currency,
                                                )}
                                            </Typography>
                                        )}
                                </Stack>
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: 22, sm: 24 },
                                    fontWeight: 650,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {number(result.volumes[credit] / 1000)} t
                            </Typography>
                        </Stack>
                    ))}
                    <Box sx={{ mt: scenario.ratesValid ? 2 : 0 }}>
                        <ExtractionRateSettings
                            inputs={inputs}
                            text={text}
                            ratesValid={scenario.ratesValid}
                            open={rateSettingsOpen}
                            detailsRef={configDetails}
                            onRateChange={(key, value) =>
                                scenario.update(key, value)
                            }
                            onOpenChange={onRateSettingsToggle}
                        />
                    </Box>
                </Paper>
            )}
            {hasResults && (
                <Stack sx={{ alignItems: 'flex-start', gap: 0.5 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={share}
                        startIcon={<ShareIcon aria-hidden="true" />}
                        sx={{
                            minHeight: 44,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.main' },
                        }}
                    >
                        {text.share}
                    </Button>
                    <Typography
                        role="status"
                        aria-live="polite"
                        color="text.secondary"
                    >
                        {shareMessage}
                    </Typography>
                </Stack>
            )}
            {hasResults && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: 15, lineHeight: 1.7 }}
                >
                    <GlossaryText language={inputs.language}>
                        {text.disclaimerBeforeEmphasis}
                    </GlossaryText>
                    <strong>
                        <GlossaryText language={inputs.language}>
                            {text.disclaimerEmphasis}
                        </GlossaryText>
                    </strong>
                    <GlossaryText language={inputs.language}>
                        {text.disclaimerAfterEmphasis}
                    </GlossaryText>{' '}
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: 'primary.main',
                            verticalAlign: 'baseline',
                        }}
                    >
                        <Link
                            href={localizedContent.url({
                                language: inputs.language,
                                page: 'terms',
                            })}
                            style={{
                                color: 'inherit',
                                fontWeight: 600,
                                textUnderlineOffset: 4,
                            }}
                        >
                            {text.termsLink}
                        </Link>
                    </Box>
                </Typography>
            )}
        </Stack>
    );
}
