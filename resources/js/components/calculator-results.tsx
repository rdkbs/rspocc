import { Fragment, useState } from 'react';
import { Link } from '@inertiajs/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ShareIcon from '@mui/icons-material/Share';
import type { CalculatorCopy } from '@/calculator-copy';
import GlossaryText from '@/components/glossary-text';
import { credits, useCalculator, type Inputs } from '@/hooks/use-calculator';
import { localizedContent } from '@/routes';

const creditColors = {
    cspo: 'primary.main',
    cspko: 'secondary.main',
    cspke: '#929e78',
} as const;

export default function CalculatorResults({
    inputs,
    text,
    result,
    valid,
    ready,
    shareUrl,
    onCurrencyChange,
}: {
    inputs: Inputs;
    text: CalculatorCopy;
    result: ReturnType<typeof useCalculator>;
    valid: boolean;
    ready: boolean;
    shareUrl: () => string;
    onCurrencyChange: (currency: Inputs['currency']) => void;
}) {
    const locale = inputs.language === 'id' ? 'id-ID' : 'en-US';
    const number = (value: number) =>
        new Intl.NumberFormat(locale, {
            maximumFractionDigits: value > 999999 ? 0 : 2,
        }).format(value);
    const money = (
        value: number,
        currency: string,
        currencySize = '0.78em',
    ) => {
        const parts = new Intl.NumberFormat(
            inputs.language === 'id' ? 'id-ID' : 'en-US',
            {
                style: 'currency',
                currency,
                currencyDisplay: 'code',
                minimumFractionDigits: 0,
                maximumFractionDigits: value > 999999 ? 0 : 2,
            },
        ).formatToParts(value);
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

    const currencySelector = (
        <Select
            value={inputs.currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            size="small"
            inputProps={{
                'aria-label':
                    inputs.language === 'id'
                        ? 'Mata uang hasil'
                        : 'Result currency',
            }}
            sx={{
                color: 'primary.dark',
                minWidth: 96,
                minHeight: 44,
                '& .MuiSelect-icon': { color: 'inherit' },
                '&.Mui-focused': {
                    outline: '2px solid currentColor',
                    outlineOffset: 2,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                    border: 0,
                },
            }}
        >
            {(['CNY', 'EUR', 'IDR', 'MYR', 'SGD', 'USD'] as const).map(
                (currency) => (
                    <MenuItem key={currency} value={currency}>
                        {currency}
                    </MenuItem>
                ),
            )}
        </Select>
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
                    '& .MuiTypography-root': { color: 'inherit' },
                }}
            >
                <Stack
                    direction="row"
                    sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Typography
                        component="h2"
                        sx={{
                            fontSize: 24,
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 600,
                        }}
                    >
                        {text.total}
                    </Typography>
                    {currencySelector}
                </Stack>
                {hasResults ? (
                    <>
                        <Typography
                            variant="h2"
                            component="p"
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
                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                {money(result.usd, 'USD')}
                            </Typography>
                        )}
                    </>
                ) : (
                    <Typography sx={{ mt: 2, lineHeight: 1.6 }}>
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
                            sx={{ fontWeight: 600 }}
                        >
                            {text.added}
                        </Typography>
                        <Typography
                            variant="h3"
                            component="p"
                            sx={{
                                mt: 1,
                                fontSize: { xs: '2rem', md: '2.5rem' },
                            }}
                        >
                            {money(result.added, inputs.currency, '0.55em')}{' '}
                            <Typography component="span" color="text.secondary">
                                / kg
                            </Typography>
                        </Typography>
                    </Box>
                )}
            </Paper>
            {valid && inputs.volume !== null && (
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
                            display: 'flex',
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
                    {credits.map((credit) => (
                        <Stack
                            key={credit}
                            direction="row"
                            sx={{
                                justifyContent: 'space-between',
                                py: 1.5,
                                borderBottom: 1,
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
                                    {credit.toUpperCase()}
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
                            <Typography sx={{ fontWeight: 650 }}>
                                {number(result.volumes[credit] / 1000)} t
                            </Typography>
                        </Stack>
                    ))}
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
