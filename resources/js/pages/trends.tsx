import { Form, router } from '@inertiajs/react';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import {
    ChartsTooltipContainer,
    useAxesTooltip,
    useItemTooltip,
} from '@mui/x-charts/ChartsTooltip';
import {
    useChartsLayerContainerRef,
    useDrawingArea,
    useXScale,
} from '@mui/x-charts/hooks';
import {
    ScatterChart,
    ScatterMarker,
    type ScatterMarkerProps,
} from '@mui/x-charts/ScatterChart';
import { createContext, useContext, useEffect, useState } from 'react';
import { formatDisplayNumber } from '@/calculator-assumptions';
import Layout from '@/components/layout';
import DateRangeFields from '@/components/date-range-fields';
import { index as trendsIndex } from '@/routes/trends';

const products = ['CSPO', 'CSPKO', 'CSPKE'] as const;
const seriesColors = ['primary.dark', 'secondary.main'] as const;
const dayMs = 86_400_000;
const priceMarkerOffsetsContext = createContext<
    Map<string, { dateIndex: number; offset: number }>
>(new Map());

type Language = 'id' | 'en';
type Metric = 'price' | 'volume';
type Period =
    | 'week'
    | 'month'
    | 'three-months'
    | '90-days'
    | 'six-months'
    | '180-days'
    | 'last-7-days'
    | 'last-30-days'
    | 'last-365-days'
    | 'year'
    | 'custom';
type Trade = {
    price: number | null;
    volume: number | null;
    pricedVolume: number | null;
    tradeValue: number | null;
    partialTradeValue: boolean;
    csvValues: [string | null, string | null, string | null];
};
type Trades = Record<string, Record<string, Trade>>;
type ExcludedDate = {
    date: string;
    creditTypes: string[];
};
type TradeInterval = {
    start: string;
    end: string;
    quantity: number;
    low: number;
    high: number;
    csvValues: [string | null, string | null, string | null, string | null];
};
type PartialSpending = Omit<TradeInterval, 'csvValues'> & {
    creditType: string;
};
type TradeIntervals = Record<string, Record<string, TradeInterval[]>>;

type ExcludedDates = {
    inProgress: ExcludedDate[];
    couldNotVerify: ExcludedDate[];
};

type CollectionDates = ExcludedDates & {
    awaiting: ExcludedDate[];
    notChecked: ExcludedDate[];
};

function timestampCsv(
    dates: string[],
    trades: Trades,
    tradeIntervals: TradeIntervals,
    excludedDates: CollectionDates,
) {
    const excluded = new Map<string, string>();
    for (const [status, entries] of [
        ['awaiting_collection', excludedDates.awaiting],
        ['no_check_recorded', excludedDates.notChecked],
        ['in_progress', excludedDates.inProgress],
        ['could_not_verify', excludedDates.couldNotVerify],
    ] as const) {
        for (const { date, creditTypes } of entries) {
            for (const creditType of creditTypes) {
                excluded.set(`${date}/${creditType}`, status);
            }
        }
    }

    const rows = [
        'period_start_utc,period_end_utc,credit_type,credits_sold,min_price_usd,max_price_usd,trade_value_usd,status',
    ];
    for (const date of dates) {
        for (const product of products) {
            for (const creditType of [product, `IS_${product}`]) {
                const trade = trades[creditType]?.[date];
                const exclusionStatus = excluded.get(`${date}/${creditType}`);
                const intervals = tradeIntervals[creditType]?.[date] ?? [];
                if (intervals.length > 0) {
                    for (const interval of intervals
                        .slice()
                        .sort((a, b) => a.start.localeCompare(b.start))) {
                        const status =
                            exclusionStatus ??
                            (interval.csvValues[3] !== null
                                ? 'traded'
                                : 'partial_trade_value');

                        rows.push(
                            [
                                `${interval.start.replace(' ', 'T')}Z`,
                                `${interval.end.replace(' ', 'T')}Z`,
                                creditType,
                                ...interval.csvValues,
                                status,
                            ].join(','),
                        );
                    }

                    continue;
                }

                let status = exclusionStatus ?? 'no_data_yet';
                if (trade) {
                    if (trade.volume === 0) {
                        status = 'no_trades';
                    } else if (trade.partialTradeValue) {
                        status = 'partial_trade_value';
                    } else {
                        status =
                            trade.volume === null ||
                            trade.price === null ||
                            trade.tradeValue === null
                                ? 'incomplete_data'
                                : 'traded';
                    }
                }

                rows.push(
                    [
                        `${date}T00:00:00.000Z`,
                        `${date}T23:59:59.999Z`,
                        creditType,
                        trade?.csvValues[0] ?? null,
                        trade?.csvValues[1] ?? null,
                        trade?.csvValues[1] ?? null,
                        trade?.csvValues[2] ?? null,
                        status,
                    ].join(','),
                );
            }
        }
    }

    return rows.join('\r\n') + '\r\n';
}

type Point = {
    date: string;
    values: (number | null)[];
    observed: boolean[];
    noTrades: boolean[];
    dailyVolumes: (number | null)[];
    intervals: TradeInterval[][];
};

function SpendingExclusions({
    rows,
    lang,
}: {
    rows: PartialSpending[];
    lang: Language;
}) {
    const id = lang === 'id';
    const format = (value: number) => formatDisplayNumber(value, lang);
    const dateFormat = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const quantity = format(rows.reduce((sum, row) => sum + row.quantity, 0));

    return (
        <Box
            component="details"
            sx={{
                mt: 'auto',
                pt: 0.5,
                fontSize: '0.875rem',
                color: 'text.secondary',
            }}
        >
            <Box component="summary" sx={{ cursor: 'pointer' }}>
                {id
                    ? `${quantity} kredit lainnya diperdagangkan, tetapi nilai transaksinya belum dapat dipastikan.`
                    : `${quantity} more credits were traded, but we could not verify their trade value.`}
            </Box>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
                {id
                    ? 'PRISMA melaporkan beberapa harga dalam rentang satu milidetik, tetapi tidak merinci jumlah kredit pada tiap harga. Kredit ini tetap dihitung satu kali dalam volume, tetapi nilai transaksinya tidak dihitung.'
                    : 'PRISMA reported multiple prices within one millisecond but not how many credits traded at each price. These credits still count once in volume, but their trade value is excluded.'}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ pl: 2, mb: 1 }}>
                {rows.map(({ start, end, quantity: excluded, low, high }) => (
                    <li key={`${start}/${end}`}>
                        <Box component="span" sx={{ display: 'block' }}>
                            {dateFormat.format(new Date(start.slice(0, 10)))}{' '}
                            {start.slice(11)}
                            {end !== start && `–${end.slice(11)}`} UTC
                        </Box>
                        {format(excluded)} {id ? 'kredit' : 'credits'} · USD{' '}
                        {format(low)}–{format(high)}
                    </li>
                ))}
            </Stack>
        </Box>
    );
}

function TradingSummary({
    dates,
    partialSpending,
    collectionDates,
    historicalGaps,
    scheduledCheckAt,
    trades,
    lang,
}: {
    dates: string[];
    partialSpending: PartialSpending[];
    collectionDates: CollectionDates;
    historicalGaps: ExcludedDate[];
    scheduledCheckAt: string;
    trades: Trades;
    lang: Language;
}) {
    const id = lang === 'id';
    const format = (value: number) => formatDisplayNumber(value, lang);
    const formatPercent = (value: number) =>
        new Intl.NumberFormat(id ? 'id-ID' : 'en-US', {
            style: 'percent',
            maximumFractionDigits: 0,
        }).format(value);

    const { awaiting, inProgress, couldNotVerify, notChecked } =
        collectionDates;
    const collectingDates = [...awaiting, ...inProgress];
    const [browserTimeZone, setBrowserTimeZone] = useState<string>();
    useEffect(() => {
        setBrowserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, []);
    const scheduledCollection = new Date(scheduledCheckAt);
    const scheduledTime = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: browserTimeZone ?? 'UTC',
        timeZoneName: 'short',
    }).format(scheduledCollection);
    const pendingDateFormat = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });

    const dateGroup = (label: string, entries: ExcludedDate[]) =>
        entries.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
                <Typography
                    component="p"
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                >
                    {label} ({entries.length})
                </Typography>
                <Typography component="p" variant="body2">
                    {entries
                        .map(
                            ({ date, creditTypes }) =>
                                `${pendingDateFormat.format(new Date(date))} (${creditTypes.join(', ').replaceAll('_', ' ')})`,
                        )
                        .join(' · ')}
                </Typography>
            </Box>
        );

    const collectionClock = (
        <ScheduleOutlined
            titleAccess={
                id ? 'Pengecekan PRISMA belum selesai' : 'PRISMA check pending'
            }
            sx={{
                color: 'text.disabled',
                fontSize: '0.9em',
                display: 'block',
                mb: 0.25,
            }}
        />
    );
    const summaryRows = products.map((product) => {
        const [standard, smallholder] = ['', 'IS_'].map((prefix) => {
            let volume = 0;
            let tradeValue = 0n;
            let daysWithVolume = 0;
            let daysWithTradeValue = 0;
            let hasPartialTrade = false;
            for (const date of dates) {
                const trade = trades[prefix + product]?.[date];
                if (trade?.pricedVolume != null) {
                    volume += trade.pricedVolume;
                    daysWithVolume += 1;
                }
                hasPartialTrade ||= trade?.partialTradeValue === true;
                const exactTradeValue = trade?.csvValues[2];
                if (exactTradeValue != null) {
                    // Each value is calculated from quantities and prices with up to eight decimal places each.
                    const [whole, fraction = ''] = exactTradeValue.split('.');
                    tradeValue += BigInt(whole + fraction.padEnd(16, '0'));
                    daysWithTradeValue += 1;
                }
            }
            const waitingDays = collectingDates.filter(({ creditTypes }) =>
                creditTypes.includes(prefix + product),
            ).length;
            return {
                prefix,
                collecting: waitingDays > 0,
                volumeGap: daysWithVolume + waitingDays < dates.length,
                exclusions: partialSpending.filter(
                    ({ creditType }) => creditType === prefix + product,
                ),
                volume,
                tradeValue,
                hasVolume: daysWithVolume > 0,
                hasTradeValue: daysWithTradeValue > 0,
                completeTradeValue:
                    !hasPartialTrade && daysWithTradeValue === dates.length,
            };
        });
        const total = {
            prefix: 'total',
            collecting: false,
            volumeGap: standard.volumeGap || smallholder.volumeGap,
            exclusions: [],
            volume: standard.volume + smallholder.volume,
            tradeValue: standard.tradeValue + smallholder.tradeValue,
            hasVolume: standard.hasVolume || smallholder.hasVolume,
            hasTradeValue: standard.hasTradeValue || smallholder.hasTradeValue,
        };

        return { product, standard, smallholder, total };
    });
    const tradedTotals = (['standard', 'smallholder'] as const).map((key) =>
        summaryRows.reduce(
            (total, row) => ({
                value: total.value + row[key].tradeValue,
                hasValue: total.hasValue || row[key].hasTradeValue,
                complete: total.complete && row[key].completeTradeValue,
            }),
            { value: 0n, hasValue: false, complete: true },
        ),
    );
    const [standardTraded, smallholderTraded] = tradedTotals;
    const combinedTraded = {
        value: standardTraded.value + smallholderTraded.value,
        hasValue: standardTraded.hasValue || smallholderTraded.hasValue,
        complete: standardTraded.complete && smallholderTraded.complete,
    };
    const creditCells = summaryRows.flatMap(
        ({ standard, smallholder, total }) => [standard, smallholder, total],
    );
    const hasClockNote = creditCells.some(({ collecting }) => collecting);
    const hasAsteriskNote = creditCells.some(
        ({ hasVolume, volumeGap }) => hasVolume && volumeGap,
    );

    const hasDateGaps =
        historicalGaps.length > 0 ||
        couldNotVerify.length > 0 ||
        notChecked.length > 0;

    const formatTradeValue = (value: bigint) =>
        formatDisplayNumber(`${value}e-16` as `${number}`, lang);
    const shareChart = (standard: bigint, smallholder: bigint) => {
        const total = standard + smallholder;
        const standardShare = Number(standard) / Number(total);
        const smallholderShare = Number(smallholder) / Number(total);
        const standardPercent = Number(
            (standard * 200n + total) / (2n * total),
        );

        return (
            <Box sx={{ mt: 0.5, mb: 1 }}>
                <Box
                    aria-hidden="true"
                    sx={{
                        display: 'flex',
                        height: 6,
                        borderRadius: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            width: `${standardShare * 100}%`,
                            bgcolor: 'primary.dark',
                        }}
                    />
                    <Box
                        sx={{
                            width: `${smallholderShare * 100}%`,
                            bgcolor: 'secondary.main',
                        }}
                    />
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        columnGap: 0.5,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                    }}
                >
                    <span>
                        {id ? 'Kredit RSPO non-IS' : 'Non-IS RSPO Credits'}{' '}
                        {formatPercent(standardPercent / 100)}
                    </span>
                    <span>
                        {id
                            ? 'Kredit RSPO petani swadaya (IS)'
                            : 'IS RSPO Credits'}{' '}
                        {formatPercent((100 - standardPercent) / 100)}
                    </span>
                </Box>
            </Box>
        );
    };

    return (
        <Paper
            component="section"
            variant="outlined"
            sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0 }}
        >
            <Typography component="h2" variant="h5" id="trading-summary">
                {id ? 'Ringkasan perdagangan' : 'Trading summary'}
            </Typography>
            <Typography
                color="text.secondary"
                variant="body2"
                sx={{ mt: 1, mb: 2 }}
            >
                {id
                    ? 'Ringkasan hanya menghitung kredit dengan harga transaksi yang dapat dipastikan. Total menggabungkan kredit RSPO non-IS dan IS untuk tiap jenis kredit.'
                    : 'This summary counts only credits traded at prices we could verify. Each product total combines Non-IS RSPO Credits and IS RSPO Credits.'}
            </Typography>
            <Box
                role="region"
                aria-labelledby="trading-summary"
                tabIndex={0}
                sx={{ overflowX: 'auto' }}
            >
                <Box
                    component="table"
                    aria-describedby={
                        hasClockNote || hasAsteriskNote || hasDateGaps
                            ? 'partial-total-note'
                            : undefined
                    }
                    sx={(theme) => ({
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                        textAlign: 'left',
                        tableLayout: 'fixed',
                        minWidth: '44rem',
                        '& th, & td': {
                            p: { xs: 0.5, sm: 1.5 },
                            verticalAlign: 'top',
                            borderBottom: 1,
                            borderColor: 'divider',
                            overflowWrap: 'anywhere',
                        },
                        '& tr > th:first-of-type': {
                            width: '15%',
                        },
                        '& tbody td:has(details)': { height: '1px' },
                        '& sup': { color: 'text.disabled' },
                        '& thead th': {
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                        '& tbody th[scope="row"]': {
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                        },
                        '& thead th:nth-of-type(2)': {
                            color: 'primary.dark',
                        },
                        '& thead th:nth-of-type(3)': {
                            color: 'secondary.main',
                        },
                        '& tbody td:nth-of-type(1)': {
                            bgcolor: alpha(theme.palette.primary.dark, 0.035),
                        },
                        '& tbody td:nth-of-type(2)': {
                            bgcolor: alpha(theme.palette.secondary.main, 0.035),
                        },
                        '& tbody tr:last-of-type > *': { borderBottom: 0 },
                    })}
                >
                    <thead>
                        <tr>
                            <th scope="col">{id ? 'Kredit' : 'Credits'}</th>
                            <th scope="col">
                                {id
                                    ? 'Kredit RSPO non-IS'
                                    : 'Non-IS RSPO Credits'}
                            </th>
                            <th scope="col">
                                {id
                                    ? 'Kredit RSPO petani swadaya (IS)'
                                    : 'IS RSPO Credits'}
                            </th>
                            <th scope="col">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryRows.map(
                            ({ product, standard, smallholder, total }) => {
                                return (
                                    <tr key={product}>
                                        <th scope="row">{product}</th>
                                        {[standard, smallholder, total].map(
                                            ({
                                                prefix,
                                                volume,
                                                tradeValue,
                                                hasVolume,
                                                hasTradeValue,
                                                exclusions,
                                                collecting,
                                                volumeGap,
                                            }) => {
                                                return (
                                                    <td key={prefix}>
                                                        <Box
                                                            sx={
                                                                exclusions.length
                                                                    ? {
                                                                          display:
                                                                              'flex',
                                                                          flexDirection:
                                                                              'column',
                                                                          height: '100%',
                                                                      }
                                                                    : undefined
                                                            }
                                                        >
                                                            <Typography
                                                                component="p"
                                                                variant="inherit"
                                                                sx={{
                                                                    fontSize:
                                                                        'clamp(1rem, 0.92rem + 0.35vw, 1.3rem)',
                                                                    fontWeight: 600,
                                                                    lineHeight: 1.3,
                                                                    fontVariantNumeric:
                                                                        'tabular-nums',
                                                                }}
                                                            >
                                                                {collecting &&
                                                                    collectionClock}
                                                                {hasVolume ? (
                                                                    <>
                                                                        <Box
                                                                            component="span"
                                                                            sx={{
                                                                                fontWeight: 700,
                                                                            }}
                                                                        >
                                                                            {format(
                                                                                volume,
                                                                            )}
                                                                        </Box>
                                                                        {volumeGap && (
                                                                            <sup>
                                                                                *
                                                                            </sup>
                                                                        )}{' '}
                                                                        <Box
                                                                            component="span"
                                                                            sx={{
                                                                                color: 'text.secondary',
                                                                                fontSize:
                                                                                    '0.8em',
                                                                                fontWeight: 500,
                                                                            }}
                                                                        >
                                                                            {hasTradeValue
                                                                                ? id
                                                                                    ? 'kredit dengan nilai transaksi'
                                                                                    : 'credits traded for'
                                                                                : id
                                                                                  ? 'kredit dihitung'
                                                                                  : 'credits counted'}
                                                                        </Box>
                                                                    </>
                                                                ) : id ? (
                                                                    'Volume belum tersedia'
                                                                ) : (
                                                                    'Volume unavailable'
                                                                )}
                                                                {hasVolume &&
                                                                    hasTradeValue && (
                                                                        <>
                                                                            {' '}
                                                                            <Box
                                                                                component="span"
                                                                                sx={{
                                                                                    whiteSpace:
                                                                                        'nowrap',
                                                                                    fontWeight: 700,
                                                                                }}
                                                                            >
                                                                                <Box
                                                                                    component="span"
                                                                                    sx={{
                                                                                        fontSize:
                                                                                            '0.78em',
                                                                                        fontWeight: 500,
                                                                                    }}
                                                                                >
                                                                                    USD
                                                                                </Box>{' '}
                                                                                {formatTradeValue(
                                                                                    tradeValue,
                                                                                )}
                                                                            </Box>
                                                                        </>
                                                                    )}
                                                            </Typography>
                                                            {!hasTradeValue && (
                                                                <Typography
                                                                    component="p"
                                                                    variant="body2"
                                                                    sx={{
                                                                        my: 0.5,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {id
                                                                        ? 'Nilai transaksi belum tersedia'
                                                                        : 'Trade value unavailable'}
                                                                </Typography>
                                                            )}
                                                            {exclusions.length >
                                                                0 && (
                                                                <SpendingExclusions
                                                                    rows={
                                                                        exclusions
                                                                    }
                                                                    lang={lang}
                                                                />
                                                            )}
                                                            {prefix ===
                                                                total.prefix &&
                                                                standard.hasTradeValue &&
                                                                smallholder.hasTradeValue &&
                                                                total.tradeValue >
                                                                    0n &&
                                                                shareChart(
                                                                    standard.tradeValue,
                                                                    smallholder.tradeValue,
                                                                )}
                                                        </Box>
                                                    </td>
                                                );
                                            },
                                        )}
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                    <Box
                        component="tfoot"
                        sx={{
                            bgcolor: 'action.hover',
                            '& th, & td': {
                                borderTop: 1,
                                borderBottom: 0,
                                borderColor: 'divider',
                            },
                        }}
                    >
                        <tr>
                            <th scope="row">
                                {id ? 'Total nilai transaksi' : 'Total traded'}
                            </th>
                            {[...tradedTotals, combinedTraded].map(
                                ({ value, hasValue, complete }, index) => (
                                    <td key={index}>
                                        {hasValue ? (
                                            <>
                                                <Typography
                                                    component="p"
                                                    variant="inherit"
                                                    sx={{
                                                        fontSize:
                                                            'clamp(1rem, 0.92rem + 0.35vw, 1.3rem)',
                                                        fontWeight: 700,
                                                        fontVariantNumeric:
                                                            'tabular-nums',
                                                    }}
                                                >
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            fontSize: '0.78em',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        USD
                                                    </Box>{' '}
                                                    {formatTradeValue(value)}
                                                </Typography>
                                                {index === 2 && !complete && (
                                                    <Typography
                                                        component="p"
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {id
                                                            ? 'Berdasarkan transaksi terverifikasi'
                                                            : 'Based on verified trades'}
                                                    </Typography>
                                                )}
                                            </>
                                        ) : (
                                            <Typography
                                                component="p"
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {id
                                                    ? 'Nilai transaksi belum tersedia'
                                                    : 'Trade value unavailable'}
                                            </Typography>
                                        )}
                                        {index === 2 &&
                                            standardTraded.hasValue &&
                                            smallholderTraded.hasValue &&
                                            combinedTraded.value > 0n &&
                                            shareChart(
                                                standardTraded.value,
                                                smallholderTraded.value,
                                            )}
                                    </td>
                                ),
                            )}
                        </tr>
                    </Box>
                </Box>
            </Box>
            {(hasClockNote || hasAsteriskNote || hasDateGaps) && (
                <Stack
                    id="partial-total-note"
                    component="footer"
                    spacing={0.25}
                    sx={{ pt: 0.5 }}
                >
                    {hasClockNote && (
                        <Box component="details">
                            <Typography
                                variant="caption"
                                component="summary"
                                sx={{ cursor: 'pointer' }}
                            >
                                <ScheduleOutlined
                                    aria-hidden="true"
                                    sx={{
                                        fontSize: '1em',
                                        verticalAlign: 'middle',
                                        mr: 0.5,
                                        color: 'text.disabled',
                                    }}
                                />
                                {id
                                    ? 'Pengecekan PRISMA terjadwal atau sedang berlangsung.'
                                    : 'PRISMA check scheduled or in progress.'}
                            </Typography>
                            {dateGroup(
                                id
                                    ? 'Menunggu jadwal pengecekan'
                                    : 'Waiting for scheduled check',
                                awaiting,
                            )}
                            {awaiting.length > 0 && (
                                <Typography variant="body2">
                                    {id
                                        ? 'Jadwal pengecekan PRISMA:'
                                        : 'Scheduled PRISMA check:'}{' '}
                                    <time
                                        dateTime={scheduledCollection.toISOString()}
                                    >
                                        {scheduledTime}
                                    </time>
                                    .
                                </Typography>
                            )}
                            {dateGroup(
                                id
                                    ? 'Pengecekan PRISMA tertunda atau sedang berlangsung'
                                    : 'PRISMA check pending or in progress',
                                inProgress,
                            )}
                        </Box>
                    )}
                    {(hasAsteriskNote || hasDateGaps) && (
                        <Box component="details">
                            <Typography
                                variant="caption"
                                component="summary"
                                sx={{ cursor: 'pointer' }}
                            >
                                {hasAsteriskNote && (
                                    <Box
                                        component="span"
                                        sx={{ mr: 0.5, color: 'text.disabled' }}
                                    >
                                        *
                                    </Box>
                                )}
                                {id
                                    ? 'Sebagian data belum tersedia atau belum dapat dipastikan.'
                                    : 'Some data is missing or could not be verified.'}
                            </Typography>
                            {dateGroup(
                                id
                                    ? 'Belum ada catatan pengecekan'
                                    : 'No check recorded yet',
                                notChecked,
                            )}
                            {dateGroup(
                                id ? 'Data belum tersedia' : 'No data yet',
                                historicalGaps,
                            )}
                            {dateGroup(
                                id
                                    ? 'Belum dapat dipastikan'
                                    : 'Could not verify',
                                couldNotVerify,
                            )}
                        </Box>
                    )}
                </Stack>
            )}
        </Paper>
    );
}

function chartPoints(
    product: string,
    dates: string[],
    trades: Trades,
    tradeIntervals: TradeIntervals,
    metric: Metric,
): Point[] {
    const types = [product, `IS_${product}`];
    return dates.map((date) => ({
        date,
        observed: types.map(
            (type) =>
                trades[type]?.[date] !== undefined ||
                !!tradeIntervals[type]?.[date]?.length,
        ),
        dailyVolumes: types.map((type) => {
            const dailyVolume = trades[type]?.[date]?.volume;
            if (dailyVolume !== null && dailyVolume !== undefined) {
                return dailyVolume;
            }

            const intervals = tradeIntervals[type]?.[date] ?? [];
            return intervals.length > 0
                ? intervals.reduce(
                      (total, interval) => total + interval.quantity,
                      0,
                  )
                : null;
        }),
        noTrades: types.map((type) => trades[type]?.[date]?.volume === 0),
        values: types.map((type) => {
            const dailyValue = trades[type]?.[date]?.[metric];
            if (dailyValue !== null && dailyValue !== undefined) {
                return dailyValue;
            }

            const intervals = tradeIntervals[type]?.[date] ?? [];
            return metric === 'volume' && intervals.length > 0
                ? intervals.reduce(
                      (total, interval) => total + interval.quantity,
                      0,
                  )
                : null;
        }),
        intervals: types.map((type) => tradeIntervals[type]?.[date] ?? []),
    }));
}

function PriceDateHoverListener({
    count,
    onDateHover,
}: {
    count: number;
    onDateHover: (index: number | null) => void;
}) {
    const drawingArea = useDrawingArea();
    const xScale = useXScale<'point'>();
    const chartContainerRef = useChartsLayerContainerRef();

    useEffect(() => {
        const container = chartContainerRef.current;
        const svg = container?.querySelector('svg');

        if (!container || !svg) {
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const matrix = svg?.getScreenCTM();

            if (!matrix || count === 0) {
                return;
            }

            const pointer = svg.createSVGPoint();
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            const { x, y } = pointer.matrixTransform(matrix.inverse());
            const svgHeight =
                svg.viewBox.baseVal.height ||
                Number(svg.getAttribute('height'));

            if (
                x < drawingArea.left ||
                x > drawingArea.left + drawingArea.width ||
                y < drawingArea.top ||
                y > svgHeight
            ) {
                onDateHover(null);
                return;
            }

            const index = Array.from(
                { length: count },
                (_, item) => item,
            ).reduce((nearest, item) => {
                const position = xScale(item);
                const nearestPosition = xScale(nearest);

                return position !== undefined &&
                    nearestPosition !== undefined &&
                    Math.abs(x - position) < Math.abs(x - nearestPosition)
                    ? item
                    : nearest;
            }, 0);

            onDateHover(index);
        };

        const handlePointerLeave = () => onDateHover(null);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerleave', handlePointerLeave);

        return () => {
            container.removeEventListener('pointermove', handlePointerMove);
            container.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, [chartContainerRef, count, drawingArea, onDateHover, xScale]);

    return null;
}

function scrollHoveredChartTooltip(section: HTMLElement | null) {
    if (!section) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scrollingTooltip: HTMLElement | null = null;
    let scrollTarget = 0;
    let frame = 0;

    const scrollFrame = () => {
        if (!scrollingTooltip?.isConnected) {
            frame = 0;
            return;
        }

        const distance = scrollTarget - scrollingTooltip.scrollTop;
        if (Math.abs(distance) <= 2) {
            scrollingTooltip.scrollTop = scrollTarget;
            frame = 0;
            return;
        }

        scrollingTooltip.scrollTop += distance * 0.35;
        frame = requestAnimationFrame(scrollFrame);
    };

    const handleWheel = (event: WheelEvent) => {
        if (
            event.ctrlKey ||
            event.deltaY === 0 ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ) {
            return;
        }

        const tooltip = section.querySelector<HTMLElement>(
            '[data-chart-tooltip]',
        );
        if (!tooltip || !event.cancelable) return;

        event.preventDefault();

        const deltaY =
            event.deltaY *
            (event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                ? tooltip.clientHeight
                : event.deltaMode === WheelEvent.DOM_DELTA_LINE
                  ? 16
                  : 1);
        if (reducedMotion.matches) {
            cancelAnimationFrame(frame);
            frame = 0;
            tooltip.scrollTop += deltaY;
            return;
        }

        if (!frame || scrollingTooltip !== tooltip) {
            cancelAnimationFrame(frame);
            scrollingTooltip = tooltip;
            scrollTarget = tooltip.scrollTop;
            frame = requestAnimationFrame(scrollFrame);
        }

        scrollTarget = Math.round(
            Math.max(
                0,
                Math.min(
                    scrollTarget + deltaY,
                    tooltip.scrollHeight - tooltip.clientHeight,
                ),
            ),
        );
    };

    section.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
        cancelAnimationFrame(frame);
        section.removeEventListener('wheel', handleWheel);
    };
}

const NoChartTooltip = () => null;

function TradeChartTooltip({
    points,
    volume,
    hoveredDateIndex,
    renderDetails,
}: {
    points: Point[];
    volume: boolean;
    hoveredDateIndex: number | null;
    renderDetails: (point: Point) => React.ReactNode;
}) {
    const item = useItemTooltip<'scatter'>();
    const axis = useAxesTooltip<'bar'>({ directions: ['x'] })?.[0];
    const dateIndex = volume
        ? axis?.dataIndex
        : (hoveredDateIndex ?? item?.value?.x);
    const point = dateIndex == null ? undefined : points[dateIndex];
    const axisTooltip = volume || hoveredDateIndex !== null;

    return point ? (
        <ChartsTooltipContainer
            trigger={axisTooltip ? 'axis' : 'item'}
            anchor={axisTooltip ? 'chart' : 'node'}
        >
            {renderDetails(point)}
        </ChartsTooltipContainer>
    ) : null;
}

function OffsetPriceMarker(props: ScatterMarkerProps) {
    const markerOffsets = useContext(priceMarkerOffsetsContext);
    const xScale = useXScale<'point'>();
    const marker = markerOffsets.get(`${props.seriesId}/${props.dataIndex}`);
    const currentPosition = marker ? xScale(marker.dateIndex) : undefined;
    const adjacentPositions =
        marker && currentPosition !== undefined
            ? [xScale(marker.dateIndex - 1), xScale(marker.dateIndex + 1)]
                  .filter(
                      (position): position is number => position !== undefined,
                  )
                  .map((position) => Math.abs(position - currentPosition))
            : [];
    const dateSpacing = adjacentPositions.length
        ? Math.min(...adjacentPositions)
        : 24;

    return (
        <ScatterMarker
            {...props}
            x={
                props.x +
                (marker?.offset ?? 0) * Math.min(12, dateSpacing * 0.4)
            }
        />
    );
}

function ProductChart({
    product,
    points,
    metric,
    lang,
    excludedDates,
}: {
    product: string;
    points: Point[];
    metric: Metric;
    lang: Language;
    excludedDates: CollectionDates;
}) {
    const [includeNoTradeDates, setIncludeNoTradeDates] = useState(false);
    const [hoveredDateIndex, setHoveredDateIndex] = useState<number | null>(
        null,
    );
    const id = lang === 'id';
    const volume = metric === 'volume';
    const { palette } = useTheme();
    const dateOptions = {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    } as const;
    const locale = id ? 'id-ID' : 'en-US';
    const dateFormat = new Intl.DateTimeFormat(locale, dateOptions);
    const fullDateFormat = new Intl.DateTimeFormat(locale, {
        ...dateOptions,
        year: 'numeric',
    });
    const formatDate = (date: string | number) =>
        dateFormat.format(new Date(date));
    const formatWindow = ({ start, end }: TradeInterval) =>
        `${fullDateFormat.format(new Date(start.slice(0, 10)))} · ${start.slice(11)}${end === start ? '' : `–${end.slice(11)}`}`;
    const renderTime = (timestamp: string) => (
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
            {timestamp.slice(11, 19)}
            <Box component="span" sx={{ fontSize: '0.8em' }}>
                {timestamp.slice(19)}
            </Box>
        </Box>
    );
    const formatRange = ({ low, high }: Pick<TradeInterval, 'low' | 'high'>) =>
        low === high
            ? formatDisplayNumber(low, lang)
            : `${formatDisplayNumber(low, lang)}–${formatDisplayNumber(high, lang)}`;
    const visiblePoints = points;
    const priceRanges = new Map<string, TradeInterval>();
    const pricePoints = [0, 1].map((index) =>
        points.flatMap(({ date, values, intervals }, x) => {
            const intervalPoints = intervals[index].flatMap(
                (interval, intervalIndex) => {
                    const id = `${date}/${index}/${intervalIndex}`;
                    priceRanges.set(id, interval);

                    return [...new Set([interval.low, interval.high])].map(
                        (y) => ({ x, y, id: `${id}/${y}` }),
                    );
                },
            );
            const closingPrice = values[index];

            return closingPrice === null ||
                intervalPoints.some(({ y }) => y === closingPrice)
                ? intervalPoints
                : [{ x, y: closingPrice, id: date }, ...intervalPoints];
        }),
    );
    const markerGroups = new Map<
        string,
        { seriesId: string; dataIndex: number; dateIndex: number }[]
    >();
    pricePoints.forEach((seriesPoints, seriesIndex) => {
        seriesPoints.forEach(({ x, y }, dataIndex) => {
            const position = `${x}/${y}`;
            const markers = markerGroups.get(position) ?? [];
            markers.push({
                seriesId: `${product}-${seriesIndex}`,
                dataIndex,
                dateIndex: x,
            });
            markerGroups.set(position, markers);
        });
    });
    const priceMarkerOffsets = new Map<
        string,
        { dateIndex: number; offset: number }
    >();
    for (const markers of markerGroups.values()) {
        if (markers.length < 2) {
            continue;
        }

        const spread = Math.min(2, markers.length - 1);
        markers.forEach(({ seriesId, dataIndex, dateIndex }, index) => {
            priceMarkerOffsets.set(`${seriesId}/${dataIndex}`, {
                dateIndex,
                offset: ((index / (markers.length - 1)) * 2 - 1) * (spread / 2),
            });
        });
    }
    const tableRows = points
        .slice()
        .reverse()
        .flatMap((point) => {
            const windows = new Map<string, (TradeInterval | null)[]>();
            point.intervals.forEach((intervals, index) => {
                for (const interval of intervals) {
                    const key = `${interval.start}/${interval.end}`;
                    const row = windows.get(key) ?? [null, null];
                    row[index] = interval;
                    windows.set(key, row);
                }
            });
            if (windows.size === 0) {
                return !includeNoTradeDates && point.noTrades.every(Boolean)
                    ? []
                    : [{ point, window: point.date, records: [null, null] }];
            }
            return [...windows]
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([window, records]) => ({ point, window, records }));
        });
    const values = volume
        ? points.flatMap((point) =>
              point.values.filter((value) => value !== null),
          )
        : pricePoints.flat();
    const noTrades =
        visiblePoints.length > 0 &&
        visiblePoints.every((point) => point.noTrades.every(Boolean));
    const showEmptyPriceTimeline = !volume && noTrades;
    const hasStatusCells = visiblePoints.some(({ date }) =>
        [product, `IS_${product}`].some((creditType) =>
            [
                excludedDates.awaiting,
                excludedDates.notChecked,
                excludedDates.inProgress,
                excludedDates.couldNotVerify,
            ].some((statusDates) =>
                statusDates.some(
                    (entry) =>
                        entry.date === date &&
                        entry.creditTypes.includes(creditType),
                ),
            ),
        ),
    );
    const labels = id
        ? ['Kredit RSPO non-IS', 'Kredit RSPO petani swadaya (IS)']
        : ['Non-IS RSPO Credits', 'IS RSPO Credits'];
    const observedPriceRanges = [0, 1].map((index) => {
        let low: number | null = null;
        let high: number | null = null;

        for (const point of points) {
            const prices = point.intervals[index].flatMap(({ low, high }) => [
                low,
                high,
            ]);
            const closingPrice = point.values[index];
            if (closingPrice !== null) {
                prices.push(closingPrice);
            }

            for (const price of prices) {
                low = low === null ? price : Math.min(low, price);
                high = high === null ? price : Math.max(high, price);
            }
        }

        return low === null || high === null ? null : { low, high };
    });
    const noTradesByType = [0, 1].map(
        (index) =>
            points.length > 0 && points.every((point) => point.noTrades[index]),
    );
    const volumeTotals = [0, 1].map((index) => {
        let total = 0;
        let hasVolume = false;
        let hasMissingDates = false;

        for (const point of points) {
            const volume = point.values[index];
            if (volume === null) {
                hasMissingDates = true;
                continue;
            }

            total += volume;
            hasVolume = true;
        }

        return {
            total: hasVolume ? total : null,
            partial: hasVolume && hasMissingDates,
        };
    });
    const hasPartialVolume = volumeTotals.some(({ partial }) => partial);
    const formatObservedPriceRange = (
        range: (typeof observedPriceRanges)[number],
        index: number,
    ) => {
        if (range === null) {
            return noTradesByType[index]
                ? id
                    ? 'Tidak ada transaksi'
                    : 'No trades'
                : id
                  ? 'Belum ada harga terverifikasi'
                  : 'No verified prices';
        }

        const low = formatDisplayNumber(range.low, lang);
        const high = formatDisplayNumber(range.high, lang);

        return `USD ${low}${low === high ? '' : `–${high}`}`;
    };
    const series = labels.map((label, index) => ({
        id: `${product}-${index}`,
        label,
        color: index === 0 ? palette.primary.dark : palette.secondary.main,
    }));
    const renderTooltipPrice = (range: Pick<TradeInterval, 'low' | 'high'>) => (
        <>
            <Box component="span" sx={{ fontSize: '0.8em', mr: '0.2em' }}>
                USD
            </Box>{' '}
            {formatRange(range)} / {id ? 'kredit' : 'credit'}
        </>
    );

    const renderTradeTooltip = (point: Point) => {
        const intervals = point.intervals
            .flatMap((records, categoryIndex) =>
                records.map((interval) => ({ interval, categoryIndex })),
            )
            .sort(
                (a, b) =>
                    a.interval.start.localeCompare(b.interval.start) ||
                    a.categoryIndex - b.categoryIndex,
            );

        return (
            <Box
                data-chart-tooltip
                data-testid={
                    volume ? 'volume-date-tooltip' : 'price-date-tooltip'
                }
                sx={{
                    minWidth: 240,
                    maxWidth: 360,
                    maxHeight: 'min(50vh, 320px)',
                    overflowY: 'auto',
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    boxShadow: 3,
                }}
            >
                <Typography
                    component="p"
                    variant="subtitle2"
                    data-testid="price-tooltip-date"
                    sx={{ fontWeight: 700 }}
                >
                    {fullDateFormat.format(new Date(point.date))}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.75} data-testid="trade-day-summary">
                    <Typography variant="caption" color="text.secondary">
                        {id ? 'Ringkasan harian' : 'Daily summary'}
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 1.5,
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {labels.map((label, index) => {
                            const quantity = point.dailyVolumes[index];
                            const prices = point.intervals[index].flatMap(
                                ({ low, high }) => [low, high],
                            );
                            const closingPrice = point.values[index];
                            if (!volume && closingPrice !== null) {
                                prices.push(closingPrice);
                            }

                            return (
                                <Box key={label} sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            color: series[index].color,
                                        }}
                                    >
                                        {index === 0 ? 'Non-IS' : 'IS'}
                                    </Typography>
                                    {!volume && quantity !== 0 && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight:
                                                    prices.length > 0
                                                        ? 700
                                                        : 400,
                                            }}
                                        >
                                            {prices.length === 0
                                                ? id
                                                    ? 'Harga tidak tersedia'
                                                    : 'Price unavailable'
                                                : renderTooltipPrice({
                                                      low: Math.min(...prices),
                                                      high: Math.max(...prices),
                                                  })}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant={volume ? 'body2' : 'caption'}
                                        data-testid={
                                            quantity === 0
                                                ? 'price-tooltip-empty'
                                                : undefined
                                        }
                                        sx={{
                                            color:
                                                quantity === 0
                                                    ? 'text.disabled'
                                                    : volume
                                                      ? 'text.primary'
                                                      : 'text.secondary',
                                            fontWeight:
                                                volume && quantity
                                                    ? 700
                                                    : undefined,
                                        }}
                                    >
                                        {quantity === 0
                                            ? id
                                                ? 'Tidak ada transaksi'
                                                : 'No trades'
                                            : quantity === null
                                              ? id
                                                  ? 'Volume tidak tersedia'
                                                  : 'Volume unavailable'
                                              : `${formatDisplayNumber(quantity, lang)} ${id ? 'kredit diperdagangkan' : 'credits traded'}`}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Stack>
                {intervals.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                            {id
                                ? 'Rincian per waktu (UTC)'
                                : 'Interval details (UTC)'}
                        </Typography>
                    </>
                )}
                {intervals.length > 0 ? (
                    <Stack
                        component="ul"
                        spacing={1}
                        sx={{ listStyle: 'none', m: 0, p: 0 }}
                    >
                        {intervals.map(({ interval, categoryIndex }) => (
                            <Box
                                component="li"
                                key={`${categoryIndex}/${interval.start}/${interval.end}`}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                                    alignItems: 'center',
                                    columnGap: 1.5,
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            aria-hidden="true"
                                            sx={{
                                                bgcolor:
                                                    series[categoryIndex].color,
                                                borderRadius: volume
                                                    ? 0
                                                    : '50%',
                                                flex: '0 0 auto',
                                                width: 7,
                                                height: 7,
                                            }}
                                        />
                                        {labels[categoryIndex]}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {renderTime(interval.start)}
                                        {interval.end !== interval.start && (
                                            <>–{renderTime(interval.end)}</>
                                        )}
                                    </Typography>
                                </Box>
                                <Stack
                                    sx={{
                                        textAlign: 'right',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {volume
                                            ? `${formatDisplayNumber(interval.quantity, lang)} ${id ? 'kredit' : 'credits'}`
                                            : renderTooltipPrice(interval)}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {volume
                                            ? renderTooltipPrice(interval)
                                            : `${formatDisplayNumber(interval.quantity, lang)} ${id ? 'kredit' : 'credits'}`}
                                    </Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                ) : null}
            </Box>
        );
    };
    const unit = volume
        ? id
            ? 'Kredit diperdagangkan'
            : 'Credits traded'
        : 'USD / credit';

    return (
        <Paper
            ref={scrollHoveredChartTooltip}
            component="section"
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}
        >
            <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                {product}
            </Typography>
            {volume ? (
                <>
                    <Typography color="text.secondary" variant="caption">
                        {id
                            ? 'Total kredit yang diperdagangkan pada rentang tanggal yang dipilih'
                            : 'Total credits traded in selected date range'}
                    </Typography>
                    <Box
                        component="dl"
                        sx={{
                            display: 'grid',
                            gap: 0.5,
                            m: 0,
                            mt: 0.5,
                            mb: hasPartialVolume ? 0.5 : 1,
                        }}
                    >
                        {labels.map((label, index) => {
                            const { total, partial } = volumeTotals[index];

                            return (
                                <Box
                                    component="div"
                                    key={label}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'minmax(0, 1fr) auto',
                                        alignItems: 'start',
                                        columnGap: 1,
                                    }}
                                >
                                    <Typography
                                        component="dt"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            aria-hidden="true"
                                            sx={{
                                                bgcolor: series[index].color,
                                                flex: '0 0 auto',
                                                width: 8,
                                                height: 8,
                                            }}
                                        />
                                        {label}
                                    </Typography>
                                    <Typography
                                        component="dd"
                                        sx={{
                                            m: 0,
                                            textAlign: 'right',
                                            fontSize:
                                                'clamp(1rem, 0.94rem + 0.35vw, 1.25rem)',
                                            fontWeight: 700,
                                            fontVariantNumeric: 'tabular-nums',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {total === null ? (
                                            id ? (
                                                'Volume belum tersedia'
                                            ) : (
                                                'Volume unavailable'
                                            )
                                        ) : (
                                            <>
                                                {formatDisplayNumber(
                                                    total,
                                                    lang,
                                                )}
                                                {partial && (
                                                    <Box
                                                        component="sup"
                                                        sx={{
                                                            color: 'text.disabled',
                                                        }}
                                                    >
                                                        *
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                    {hasPartialVolume && (
                        <Typography
                            component="p"
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            {id
                                ? '* Total bertanda * tidak mencakup tanggal yang volumenya belum tersedia.'
                                : '* Totals marked * exclude dates without available volume.'}
                        </Typography>
                    )}
                </>
            ) : (
                <>
                    <Typography color="text.secondary" variant="caption">
                        {id
                            ? 'Harga terpantau pada rentang tanggal yang dipilih · USD / kredit'
                            : 'Observed price in selected date range · USD / credit'}
                    </Typography>
                    <Box
                        component="dl"
                        sx={{
                            display: 'grid',
                            gap: 0.5,
                            m: 0,
                            mt: 0.5,
                            mb: 1,
                        }}
                    >
                        {labels.map((label, index) => (
                            <Box
                                component="div"
                                key={label}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                                    alignItems: 'start',
                                    columnGap: 1,
                                }}
                            >
                                <Typography
                                    component="dt"
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    <Box
                                        component="span"
                                        aria-hidden="true"
                                        sx={{
                                            bgcolor: series[index].color,
                                            borderRadius: '50%',
                                            flex: '0 0 auto',
                                            width: 8,
                                            height: 8,
                                        }}
                                    />
                                    {label}
                                </Typography>
                                <Typography
                                    component="dd"
                                    variant="subtitle2"
                                    sx={{
                                        m: 0,
                                        textAlign: 'right',
                                        fontVariantNumeric: 'tabular-nums',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatObservedPriceRange(
                                        observedPriceRanges[index],
                                        index,
                                    )}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
            {visiblePoints.length === 0 ? (
                <Typography sx={{ mt: 2 }}>
                    {id
                        ? 'Tidak ada tanggal dengan transaksi pada rentang ini.'
                        : 'No dates with trades in this range.'}
                </Typography>
            ) : values.length === 0 && !showEmptyPriceTimeline ? (
                <Typography sx={{ mt: 2 }}>
                    {noTrades
                        ? id
                            ? 'Tidak ada transaksi pada tanggal yang dipilih.'
                            : 'No trades on the selected dates.'
                        : id
                          ? 'Belum ada data untuk periode ini.'
                          : 'No data for this period yet.'}
                </Typography>
            ) : volume ? (
                <BarChart
                    height={240}
                    skipAnimation
                    hideLegend
                    title={`${product} · ${unit}`}
                    slots={{ tooltip: NoChartTooltip }}
                    xAxis={[
                        {
                            scaleType: 'band',
                            data: visiblePoints.map(({ date }) => date),
                            valueFormatter: formatDate,
                        },
                    ]}
                    series={series.map((item, index) => ({
                        ...item,
                        data: visiblePoints.map(({ values }) => values[index]),
                        valueFormatter: (value: number | null) =>
                            value === null
                                ? null
                                : formatDisplayNumber(value, lang),
                    }))}
                >
                    <TradeChartTooltip
                        points={visiblePoints}
                        volume={volume}
                        hoveredDateIndex={hoveredDateIndex}
                        renderDetails={renderTradeTooltip}
                    />
                </BarChart>
            ) : (
                <priceMarkerOffsetsContext.Provider value={priceMarkerOffsets}>
                    <ScatterChart
                        height={240}
                        skipAnimation
                        hideLegend
                        disableHitArea
                        title={`${product} · USD`}
                        axisHighlight={{ x: 'line' }}
                        sx={{
                            '& .MuiChartsAxisHighlight-root': {
                                stroke: 'primary.main',
                                strokeDasharray: '2 3',
                                opacity: 0.65,
                            },
                        }}
                        slots={{
                            tooltip: NoChartTooltip,
                            marker: OffsetPriceMarker,
                            ...(showEmptyPriceTimeline && {
                                noDataOverlay: () => null,
                            }),
                        }}
                        tooltipAxis={
                            hoveredDateIndex === null
                                ? []
                                : [
                                      {
                                          axisId: 'date',
                                          dataIndex: hoveredDateIndex,
                                      },
                                  ]
                        }
                        {...(showEmptyPriceTimeline && {
                            yAxis: [{ position: 'none', min: 0, max: 1 }],
                        })}
                        xAxis={[
                            {
                                id: 'date',
                                scaleType: 'point',
                                data: visiblePoints.map((_, index) => index),
                                tickNumber: visiblePoints.length,
                                valueFormatter: (value: number) =>
                                    formatDate(
                                        visiblePoints[Math.round(value)]
                                            ?.date ?? visiblePoints[0].date,
                                    ),
                            },
                        ]}
                        series={series.map((item, index) => ({
                            ...item,
                            markerSize: 5,
                            data: pricePoints[index],
                            valueFormatter: (
                                value: {
                                    x: number;
                                    y: number;
                                    id?: string | number;
                                } | null,
                            ) => {
                                if (value === null) {
                                    return null;
                                }

                                const pointId = String(value.id ?? '');
                                const range = priceRanges.get(
                                    pointId.slice(0, pointId.lastIndexOf('/')),
                                );
                                if (range) {
                                    return `${formatWindow(range)} · ${formatRange(range)} USD`;
                                }

                                const point = visiblePoints[value.x];
                                const price = `${formatDate(point.date)} · ${formatDisplayNumber(value.y, lang)} USD`;
                                const otherIndex = index === 0 ? 1 : 0;

                                return point.values[otherIndex] === value.y
                                    ? `${price} (${labels.join(' + ')})`
                                    : price;
                            },
                        }))}
                    >
                        <PriceDateHoverListener
                            count={visiblePoints.length}
                            onDateHover={setHoveredDateIndex}
                        />
                        <TradeChartTooltip
                            points={visiblePoints}
                            volume={volume}
                            hoveredDateIndex={hoveredDateIndex}
                            renderDetails={renderTradeTooltip}
                        />
                    </ScatterChart>
                </priceMarkerOffsetsContext.Provider>
            )}
            {showEmptyPriceTimeline && (
                <Typography color="text.secondary">
                    {id
                        ? 'Tidak ada transaksi pada tanggal yang dipilih.'
                        : 'No trades on the selected dates.'}
                </Typography>
            )}
            {(visiblePoints.some(({ observed }) => observed.includes(true)) ||
                hasStatusCells) && (
                <Box component="details" sx={{ mt: 2 }}>
                    <Box
                        component="summary"
                        sx={{ cursor: 'pointer', py: 1.5 }}
                    >
                        {id ? 'Lihat tabel data' : 'View data table'}
                    </Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeNoTradeDates}
                                onChange={(event) =>
                                    setIncludeNoTradeDates(event.target.checked)
                                }
                            />
                        }
                        label={
                            id
                                ? 'Tampilkan tanggal tanpa transaksi di tabel'
                                : 'Show dates without trades in table'
                        }
                        sx={{ minHeight: 44, m: 0 }}
                    />
                    <Box
                        role="region"
                        aria-label={`${product} · ${unit}`}
                        tabIndex={0}
                        sx={{ overflow: 'auto', maxHeight: 320 }}
                    >
                        <Box
                            component="table"
                            sx={{
                                width: '100%',
                                textAlign: 'right',
                                '& th, & td': { p: 1 },
                                '& thead': {
                                    position: 'sticky',
                                    top: 0,
                                    bgcolor: 'background.paper',
                                },
                            }}
                        >
                            <thead>
                                <tr>
                                    <th scope="col">
                                        {id ? 'Waktu (UTC)' : 'Time (UTC)'}
                                    </th>
                                    {labels.map((label, index) => (
                                        <Box
                                            component="th"
                                            key={label}
                                            scope="col"
                                            sx={{ color: seriesColors[index] }}
                                        >
                                            {label}
                                        </Box>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map(({ point, window, records }) => {
                                    const { date, observed, noTrades } = point;
                                    const interval = records.find(
                                        (row) => row !== null,
                                    );
                                    return (
                                        <tr key={window}>
                                            <Box
                                                component="th"
                                                scope="row"
                                                sx={{ textAlign: 'start' }}
                                            >
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    sx={{
                                                        display: 'block',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {fullDateFormat.format(
                                                        new Date(date),
                                                    )}
                                                </Typography>
                                                {interval && (
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: 'block',
                                                            fontWeight: 400,
                                                            fontVariantNumeric:
                                                                'tabular-nums',
                                                        }}
                                                    >
                                                        {renderTime(
                                                            interval.start,
                                                        )}
                                                        {interval.end !==
                                                            interval.start && (
                                                            <>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        color: 'text.disabled',
                                                                    }}
                                                                >
                                                                    –
                                                                </Box>
                                                                {renderTime(
                                                                    interval.end,
                                                                )}
                                                            </>
                                                        )}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {records.map((record, index) => {
                                                const value = record
                                                    ? volume
                                                        ? formatDisplayNumber(
                                                              record.quantity,
                                                              lang,
                                                          )
                                                        : formatRange(record)
                                                    : null;
                                                const creditType =
                                                    index === 0
                                                        ? product
                                                        : `IS_${product}`;
                                                const isInProgress =
                                                    excludedDates.inProgress.some(
                                                        ({
                                                            date: excludedDate,
                                                            creditTypes,
                                                        }) =>
                                                            excludedDate ===
                                                                date &&
                                                            creditTypes.includes(
                                                                creditType,
                                                            ),
                                                    );
                                                const isAwaiting =
                                                    excludedDates.awaiting.some(
                                                        (entry) =>
                                                            entry.date ===
                                                                date &&
                                                            entry.creditTypes.includes(
                                                                creditType,
                                                            ),
                                                    );
                                                const notChecked =
                                                    excludedDates.notChecked.some(
                                                        (entry) =>
                                                            entry.date ===
                                                                date &&
                                                            entry.creditTypes.includes(
                                                                creditType,
                                                            ),
                                                    );
                                                const couldNotVerify =
                                                    excludedDates.couldNotVerify.some(
                                                        ({
                                                            date: excludedDate,
                                                            creditTypes,
                                                        }) =>
                                                            excludedDate ===
                                                                date &&
                                                            creditTypes.includes(
                                                                creditType,
                                                            ),
                                                    );
                                                const statusLabel = noTrades[
                                                    index
                                                ]
                                                    ? id
                                                        ? 'Tidak ada transaksi'
                                                        : 'No trades'
                                                    : isInProgress
                                                      ? id
                                                          ? 'Pengecekan PRISMA tertunda atau sedang berlangsung'
                                                          : 'PRISMA check pending or in progress'
                                                      : isAwaiting
                                                        ? id
                                                            ? 'Menunggu jadwal pengecekan'
                                                            : 'Waiting for scheduled check'
                                                        : notChecked
                                                          ? id
                                                              ? 'Belum ada catatan pengecekan'
                                                              : 'No check recorded yet'
                                                          : couldNotVerify
                                                            ? id
                                                                ? 'Belum dapat dipastikan'
                                                                : 'Could not verify'
                                                            : observed[index]
                                                              ? id
                                                                  ? 'Data belum lengkap'
                                                                  : 'Incomplete data'
                                                              : id
                                                                ? 'Data belum tersedia'
                                                                : 'No data yet';

                                                return (
                                                    <Box
                                                        component="td"
                                                        key={labels[index]}
                                                        sx={{
                                                            color:
                                                                noTrades[
                                                                    index
                                                                ] ||
                                                                isInProgress ||
                                                                isAwaiting ||
                                                                notChecked ||
                                                                couldNotVerify ||
                                                                (volume &&
                                                                    record?.quantity ===
                                                                        0)
                                                                    ? 'text.disabled'
                                                                    : undefined,
                                                        }}
                                                    >
                                                        {value !== null ? (
                                                            value
                                                        ) : interval &&
                                                          observed[index] &&
                                                          !noTrades[index] ? (
                                                            '—'
                                                        ) : isInProgress ||
                                                          isAwaiting ? (
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    display:
                                                                        'inline-flex',
                                                                    alignItems:
                                                                        'center',
                                                                    justifyContent:
                                                                        'flex-end',
                                                                    gap: 0.5,
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                }}
                                                            >
                                                                <ScheduleOutlined
                                                                    aria-hidden="true"
                                                                    sx={{
                                                                        fontSize:
                                                                            '1rem',
                                                                    }}
                                                                />
                                                                {statusLabel}
                                                            </Box>
                                                        ) : (
                                                            statusLabel
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Box>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

export default function Trends({
    lang,
    period,
    startDate,
    endDate,
    firstDate,
    latestDate,
    scheduledCheckAt,
    scheduledCheckPending,
    excludedDates,
    partialSpending,
    tradeIntervals,
    trades,
}: {
    lang: Language;
    period: Period;
    startDate: string;
    endDate: string;
    firstDate: string;
    latestDate: string;
    scheduledCheckAt: string;
    scheduledCheckPending: boolean;
    excludedDates: ExcludedDates;
    partialSpending: PartialSpending[];
    tradeIntervals: TradeIntervals;
    trades: Trades;
}) {
    const [tab, setTab] = useState<'summary' | Metric>('summary');
    const [editingCustomRange, setEditingCustomRange] = useState(false);
    const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null);
    const id = lang === 'id';
    const title = id ? 'Tren Kredit RSPO' : 'RSPO Credit Trends';
    const description = id
        ? 'Bandingkan harga dan volume perdagangan kredit RSPO non-IS dan kredit RSPO petani swadaya di PRISMA.'
        : 'Compare PRISMA prices and trading volumes for Non-IS RSPO Credits and IS RSPO Credits.';
    const start = Date.parse(startDate);
    const dates = Array.from(
        { length: (Date.parse(endDate) - start) / dayMs + 1 },
        (_, index) =>
            new Date(start + index * dayMs).toISOString().slice(0, 10),
    );
    const rangeOptions = {
        'last-7-days': id ? '7 hari terakhir' : 'Last 7 days',
        'last-30-days': id ? '30 hari terakhir' : 'Last 30 days',
        '90-days': id ? '90 hari terakhir' : 'Last 90 days',
        '180-days': id ? '180 hari terakhir' : 'Last 180 days',
        'last-365-days': id ? '365 hari terakhir' : 'Last 365 days',
        week: id ? 'Minggu lalu' : 'Last week',
        month: id ? 'Bulan lalu' : 'Last month',
        'three-months': id ? '3 bulan terakhir' : 'Last 3 months',
        'six-months': id ? '6 bulan terakhir' : 'Last 6 months',
        year: id ? 'Tahun lalu' : 'Last year',
        custom: id ? 'Rentang khusus' : 'Custom range',
    } satisfies Record<Period, string>;
    const excludedKeys = new Set(
        [...excludedDates.inProgress, ...excludedDates.couldNotVerify].flatMap(
            ({ date, creditTypes }) =>
                creditTypes.map((creditType) => `${date}/${creditType}`),
        ),
    );
    const creditTypes = products.flatMap((product) => [
        product,
        `IS_${product}`,
    ]);
    const missingDates: ExcludedDate[] = dates
        .slice()
        .reverse()
        .flatMap((date) => {
            const missingTypes = creditTypes.filter(
                (creditType) =>
                    !trades[creditType]?.[date] &&
                    !excludedKeys.has(`${date}/${creditType}`),
            );

            return missingTypes.length
                ? [{ date, creditTypes: missingTypes }]
                : [];
        });
    const latestMissing = missingDates.filter(
        ({ date }) => date === latestDate,
    );
    const historicalGaps = missingDates.filter(
        ({ date }) => date !== latestDate,
    );
    const collectionDates = {
        ...excludedDates,
        awaiting: scheduledCheckPending ? latestMissing : [],
        notChecked: scheduledCheckPending ? [] : latestMissing,
    };
    const selectedRange = editingCustomRange ? 'custom' : period;

    return (
        <Layout
            title={title}
            description={description}
            language={lang}
            path={trendsIndex.url({ language: lang })}
            onLanguageChange={(language) =>
                router.visit(
                    trendsIndex.url(
                        { language },
                        {
                            query:
                                period === 'custom'
                                    ? { from: startDate, to: endDate }
                                    : { period },
                        },
                    ),
                )
            }
        >
            <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography
                            component="h1"
                            variant="h3"
                            sx={{
                                mb: 1,
                                color: 'primary.dark',
                                fontSize: 'clamp(2rem, 5vw, 3rem)',
                                fontWeight: 700,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography>{description}</Typography>
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'action.hover' }}
                    >
                        <Stack spacing={2}>
                            <Button
                                id="trends-period"
                                variant="outlined"
                                endIcon={<ArrowDropDown />}
                                aria-haspopup="menu"
                                aria-expanded={rangeAnchor !== null}
                                aria-controls={
                                    rangeAnchor
                                        ? 'trends-period-menu'
                                        : undefined
                                }
                                onClick={(event) =>
                                    setRangeAnchor(event.currentTarget)
                                }
                                sx={{
                                    width: { xs: '100%', sm: 240 },
                                    minHeight: 44,
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{ textAlign: 'left' }}
                                >
                                    <Typography
                                        component="span"
                                        variant="caption"
                                        sx={{ display: 'block' }}
                                    >
                                        {id ? 'Rentang tanggal' : 'Date range'}
                                    </Typography>
                                    {rangeOptions[selectedRange]}
                                </Box>
                            </Button>
                            <Menu
                                anchorEl={rangeAnchor}
                                open={rangeAnchor !== null}
                                onClose={() => setRangeAnchor(null)}
                                slotProps={{
                                    list: {
                                        id: 'trends-period-menu',
                                        'aria-labelledby': 'trends-period',
                                    },
                                    paper: {
                                        sx: {
                                            maxHeight:
                                                'min(20rem, calc(100dvh - 32px))',
                                        },
                                    },
                                }}
                            >
                                {Object.entries(rangeOptions).map(
                                    ([value, label]) => (
                                        <MenuItem
                                            key={value}
                                            role="menuitemradio"
                                            selected={value === selectedRange}
                                            onClick={() => {
                                                setRangeAnchor(null);
                                                setEditingCustomRange(
                                                    value === 'custom',
                                                );
                                                if (value !== 'custom') {
                                                    router.get(
                                                        trendsIndex.url({
                                                            language: lang,
                                                        }),
                                                        { period: value },
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            {label}
                                        </MenuItem>
                                    ),
                                )}
                            </Menu>
                            {(editingCustomRange || period === 'custom') && (
                                <Form
                                    key={`${lang}-${startDate}-${endDate}`}
                                    action={trendsIndex.url({ language: lang })}
                                    method="get"
                                    onSuccess={() =>
                                        setEditingCustomRange(false)
                                    }
                                    options={{
                                        preserveState: true,
                                        preserveScroll: true,
                                    }}
                                >
                                    {({ errors, processing }) => (
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            sx={{ alignItems: 'flex-start' }}
                                        >
                                            <input
                                                type="hidden"
                                                name="period"
                                                value="custom"
                                            />
                                            <DateRangeFields
                                                start={{
                                                    id: 'trends-from',
                                                    name: 'from',
                                                    label: id
                                                        ? 'Dari tanggal'
                                                        : 'From date',
                                                    value:
                                                        endDate < firstDate
                                                            ? latestDate
                                                            : startDate <
                                                                firstDate
                                                              ? firstDate
                                                              : startDate,
                                                    error: errors.from,
                                                }}
                                                end={{
                                                    id: 'trends-to',
                                                    name: 'to',
                                                    label: id
                                                        ? 'Sampai tanggal'
                                                        : 'To date',
                                                    value:
                                                        endDate < firstDate
                                                            ? latestDate
                                                            : endDate,
                                                    error: errors.to,
                                                }}
                                                min={firstDate}
                                                max={latestDate}
                                            />
                                            <Button
                                                type="submit"
                                                variant="outlined"
                                                disabled={processing}
                                                sx={{ minHeight: 44 }}
                                            >
                                                {id
                                                    ? 'Terapkan'
                                                    : 'Apply dates'}
                                            </Button>
                                        </Stack>
                                    )}
                                </Form>
                            )}
                            <Button
                                component="a"
                                variant="outlined"
                                href={`data:text/csv;charset=utf-8,${encodeURIComponent(timestampCsv(dates, trades, tradeIntervals, collectionDates))}`}
                                download={`rspo-credit-trends-${startDate}-${endDate}.csv`}
                                sx={{
                                    alignSelf: {
                                        xs: 'stretch',
                                        sm: 'flex-start',
                                    },
                                    minHeight: 44,
                                }}
                            >
                                {id
                                    ? 'Unduh data dengan waktu UTC (CSV)'
                                    : 'Download data with UTC times (CSV)'}
                            </Button>
                        </Stack>
                    </Paper>
                    <Tabs
                        value={tab}
                        onChange={(_, value: 'summary' | Metric) =>
                            setTab(value)
                        }
                        aria-label={id ? 'Tampilan tren' : 'Trends views'}
                        variant="fullWidth"
                    >
                        <Tab
                            value="summary"
                            id="trends-summary-tab"
                            aria-controls="trends-summary-panel"
                            label={id ? 'Ringkasan' : 'Summary'}
                        />
                        <Tab
                            value="price"
                            id="trends-price-tab"
                            aria-controls="trends-price-panel"
                            label={id ? 'Harga' : 'Price'}
                        />
                        <Tab
                            value="volume"
                            id="trends-volume-tab"
                            aria-controls="trends-volume-panel"
                            label="Volume"
                        />
                    </Tabs>
                    <Box
                        id="trends-summary-panel"
                        role="tabpanel"
                        aria-labelledby="trends-summary-tab"
                        hidden={tab !== 'summary'}
                        tabIndex={0}
                    >
                        {tab === 'summary' && (
                            <TradingSummary
                                dates={dates}
                                partialSpending={partialSpending}
                                collectionDates={collectionDates}
                                historicalGaps={historicalGaps}
                                scheduledCheckAt={scheduledCheckAt}
                                trades={trades}
                                lang={lang}
                            />
                        )}
                    </Box>
                    {(['price', 'volume'] as const).map((metric) => (
                        <Box
                            key={metric}
                            id={`trends-${metric}-panel`}
                            role="tabpanel"
                            aria-labelledby={`trends-${metric}-tab`}
                            hidden={tab !== metric}
                            tabIndex={0}
                        >
                            {tab === metric && (
                                <Stack spacing={3}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: { xs: 2, sm: 2.5 } }}
                                    >
                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                sm: 'row',
                                            }}
                                            spacing={2}
                                            sx={{
                                                alignItems: {
                                                    sm: 'flex-start',
                                                },
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box>
                                                <Typography>
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color: seriesColors[0],
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {metric === 'price'
                                                            ? '●'
                                                            : '■'}{' '}
                                                    </Box>
                                                    {id
                                                        ? 'Kredit RSPO non-IS'
                                                        : 'Non-IS RSPO Credits'}
                                                    {' · '}
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            color: seriesColors[1],
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {metric === 'price'
                                                            ? '●'
                                                            : '■'}{' '}
                                                    </Box>
                                                    {id
                                                        ? 'Kredit RSPO petani swadaya (IS)'
                                                        : 'IS RSPO Credits'}
                                                </Typography>
                                                <Typography
                                                    color="text.secondary"
                                                    variant="body2"
                                                >
                                                    {metric === 'price'
                                                        ? id
                                                            ? 'Harga transaksi terakhir per hari (UTC). Jika satu interval memuat beberapa harga, titik menunjukkan harga terendah dan tertinggi.'
                                                            : 'Last traded price by UTC day. Mixed-price intervals show their lowest and highest prices.'
                                                        : id
                                                          ? 'Jumlah kredit yang diperdagangkan per hari (UTC) sesuai laporan PRISMA, termasuk kredit dengan beberapa harga.'
                                                          : 'Credits traded per UTC day as reported by PRISMA, including credits traded at mixed prices.'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                    {products.map((product) => (
                                        <ProductChart
                                            key={product}
                                            product={product}
                                            points={chartPoints(
                                                product,
                                                dates,
                                                trades,
                                                tradeIntervals,
                                                metric,
                                            )}
                                            metric={metric}
                                            lang={lang}
                                            excludedDates={collectionDates}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    ))}
                </Stack>
            </Container>
        </Layout>
    );
}
