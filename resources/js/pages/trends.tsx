import { Form, router } from '@inertiajs/react';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import { alpha, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { useState } from 'react';
import {
    formatCurrencyParts,
    formatDisplayNumber,
} from '@/calculator-assumptions';
import Layout from '@/components/layout';
import DateRangeFields from '@/components/date-range-fields';
import { index as trendsIndex } from '@/routes/trends';

const products = ['CSPO', 'CSPKO', 'CSPKE'] as const;
const seriesColors = ['primary.dark', 'secondary.main'] as const;
const dayMs = 86_400_000;

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
    tradeValue: number | null;
};
type Trades = Record<string, Record<string, Trade>>;
type ExcludedDate = { date: string; creditTypes: string[] };
type ExcludedDates = {
    inProgress: ExcludedDate[];
    couldNotVerify: ExcludedDate[];
};
type Point = {
    date: string;
    values: (number | null)[];
    observed: boolean[];
    noTrades: boolean[];
};

function TradingSummary({
    dates,
    trades,
    lang,
}: {
    dates: string[];
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

    const shareChart = (standard: number, smallholder: number) => {
        const standardShare = standard / (standard + smallholder);
        const smallholderShare = smallholder / (standard + smallholder);

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
                        {id ? 'Standar' : 'Standard'}{' '}
                        {formatPercent(standardShare)}
                    </span>
                    <span>IS {formatPercent(smallholderShare)}</span>
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
                    ? 'Total menjumlahkan penjualan Standar dan IS yang tercatat untuk tiap jenis kredit. Persentase menunjukkan bagiannya dari jumlah kredit terjual dan nilai transaksi.'
                    : 'Totals combine recorded Standard and IS sales for each credit type. Percentages show shares of credits sold and buyer spending.'}
            </Typography>
            <Box
                role="region"
                aria-labelledby="trading-summary"
                tabIndex={0}
                sx={{ overflowX: 'auto' }}
            >
                <Box
                    component="table"
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
                            width: { xs: '22%', sm: '25%' },
                        },
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
                            <th scope="col">{id ? 'Standar' : 'Standard'}</th>
                            <th scope="col">
                                {id
                                    ? 'Petani swadaya (IS)'
                                    : 'Independent Smallholder (IS)'}
                            </th>
                            <th scope="col">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => {
                            const [standard, smallholder] = ['', 'IS_'].map(
                                (prefix) => {
                                    let volume = 0;
                                    let tradeValue = 0;
                                    let daysWithVolume = 0;
                                    let daysWithTradeValue = 0;
                                    for (const date of dates) {
                                        const trade =
                                            trades[prefix + product]?.[date];
                                        if (trade?.volume != null) {
                                            volume += trade.volume;
                                            daysWithVolume += 1;
                                        }
                                        if (trade?.tradeValue != null) {
                                            tradeValue += trade.tradeValue;
                                            daysWithTradeValue += 1;
                                        }
                                    }
                                    return {
                                        prefix,
                                        volume,
                                        tradeValue,
                                        hasVolume: daysWithVolume > 0,
                                        completeVolume:
                                            daysWithVolume === dates.length,
                                        hasTradeValue: daysWithTradeValue > 0,
                                        completeTradeValue:
                                            daysWithTradeValue === dates.length,
                                    };
                                },
                            );
                            const total = {
                                prefix: 'total',
                                volume: standard.volume + smallholder.volume,
                                tradeValue:
                                    standard.tradeValue +
                                    smallholder.tradeValue,
                                completeVolume:
                                    standard.completeVolume &&
                                    smallholder.completeVolume,
                                hasVolume:
                                    standard.hasVolume || smallholder.hasVolume,
                                completeTradeValue:
                                    standard.completeTradeValue &&
                                    smallholder.completeTradeValue,
                                hasTradeValue:
                                    standard.hasTradeValue ||
                                    smallholder.hasTradeValue,
                            };

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
                                            completeVolume,
                                            completeTradeValue,
                                        }) => {
                                            return (
                                                <td key={prefix}>
                                                    <Typography
                                                        component="p"
                                                        variant="inherit"
                                                        sx={{
                                                            whiteSpace:
                                                                hasVolume
                                                                    ? 'nowrap'
                                                                    : 'normal',
                                                            fontSize:
                                                                'clamp(1rem, 0.92rem + 0.35vw, 1.3rem)',
                                                            fontWeight: 600,
                                                            lineHeight: 1.3,
                                                            fontVariantNumeric:
                                                                'tabular-nums',
                                                        }}
                                                    >
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
                                                                </Box>{' '}
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        color: 'text.secondary',
                                                                        fontSize:
                                                                            '0.8em',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {id
                                                                        ? 'kredit terjual'
                                                                        : 'credits sold'}
                                                                </Box>
                                                            </>
                                                        ) : id ? (
                                                            'Volume belum tersedia'
                                                        ) : (
                                                            'Volume unavailable'
                                                        )}
                                                    </Typography>
                                                    {hasVolume &&
                                                        !completeVolume && (
                                                            <Typography
                                                                component="p"
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {id
                                                                    ? 'Total sementara'
                                                                    : 'Partial total'}
                                                            </Typography>
                                                        )}
                                                    {prefix === total.prefix &&
                                                        completeVolume &&
                                                        total.volume > 0 &&
                                                        shareChart(
                                                            standard.volume,
                                                            smallholder.volume,
                                                        )}
                                                    <Typography
                                                        component="p"
                                                        variant="inherit"
                                                        sx={{
                                                            mt: 0.5,
                                                            mb: 0.5,
                                                            fontSize:
                                                                '0.875rem',
                                                            fontWeight: 600,
                                                            ...(hasTradeValue && {
                                                                fontSize:
                                                                    'clamp(1rem, 0.92rem + 0.35vw, 1.3rem)',
                                                                fontWeight: 700,
                                                                fontVariantNumeric:
                                                                    'tabular-nums',
                                                                lineHeight: 1.25,
                                                            }),
                                                        }}
                                                    >
                                                        {hasTradeValue
                                                            ? formatCurrencyParts(
                                                                  tradeValue,
                                                                  'USD',
                                                                  lang,
                                                              ).map(
                                                                  (
                                                                      part,
                                                                      index,
                                                                      parts,
                                                                  ) => {
                                                                      if (
                                                                          part.type ===
                                                                          'currency'
                                                                      ) {
                                                                          return (
                                                                              <Box
                                                                                  key={
                                                                                      index
                                                                                  }
                                                                                  component="span"
                                                                                  sx={{
                                                                                      fontSize:
                                                                                          '0.78em',
                                                                                      fontWeight: 500,
                                                                                      letterSpacing:
                                                                                          '0.01em',
                                                                                      ...(index <
                                                                                      parts.findIndex(
                                                                                          ({
                                                                                              type,
                                                                                          }) =>
                                                                                              type ===
                                                                                              'integer',
                                                                                      )
                                                                                          ? {
                                                                                                mr: '0.5em',
                                                                                            }
                                                                                          : {
                                                                                                ml: '0.5em',
                                                                                            }),
                                                                                  }}
                                                                              >
                                                                                  {
                                                                                      part.value
                                                                                  }
                                                                              </Box>
                                                                          );
                                                                      }

                                                                      return part.type ===
                                                                          'literal' &&
                                                                          !part.value.trim()
                                                                          ? null
                                                                          : part.value;
                                                                  },
                                                              )
                                                            : id
                                                              ? 'Nilai belum tersedia'
                                                              : 'Trade value unavailable'}
                                                    </Typography>
                                                    {hasTradeValue &&
                                                        !completeTradeValue && (
                                                            <Typography
                                                                component="p"
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {id
                                                                    ? 'Total sementara'
                                                                    : 'Partial total'}
                                                            </Typography>
                                                        )}
                                                    {prefix === total.prefix &&
                                                        completeTradeValue &&
                                                        total.tradeValue > 0 &&
                                                        shareChart(
                                                            standard.tradeValue,
                                                            smallholder.tradeValue,
                                                        )}
                                                </td>
                                            );
                                        },
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </Box>
            </Box>
        </Paper>
    );
}

function chartPoints(
    product: string,
    dates: string[],
    trades: Trades,
    metric: Metric,
): Point[] {
    const types = [product, `IS_${product}`];
    return dates.map((date) => ({
        date,
        observed: types.map((type) => trades[type]?.[date] !== undefined),
        noTrades: types.map((type) => trades[type]?.[date]?.volume === 0),
        values: types.map((type) => trades[type]?.[date]?.[metric] ?? null),
    }));
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
    excludedDates: ExcludedDates;
}) {
    const [includeNoTradeDates, setIncludeNoTradeDates] = useState(false);
    const id = lang === 'id';
    const volume = metric === 'volume';
    const { palette } = useTheme();
    const dateFormat = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
    const formatDate = (date: string | number) =>
        dateFormat.format(new Date(date));
    const visiblePoints = points;
    const values = visiblePoints.flatMap((point) =>
        point.values.filter((value) => value !== null),
    );
    const noTrades =
        visiblePoints.length > 0 &&
        visiblePoints.every((point) => point.noTrades.every(Boolean));
    const showEmptyPriceTimeline = !volume && noTrades;
    const hasStatusCells = visiblePoints.some(({ date }) =>
        [product, `IS_${product}`].some((creditType) =>
            [excludedDates.inProgress, excludedDates.couldNotVerify].some(
                (statusDates) =>
                    statusDates.some(
                        (entry) =>
                            entry.date === date &&
                            entry.creditTypes.includes(creditType),
                    ),
            ),
        ),
    );
    const labels = id
        ? ['Standar', 'Petani swadaya (IS)']
        : ['Standard', 'Independent Smallholder (IS)'];
    const series = labels.map((label, index) => ({
        label,
        color: index === 0 ? palette.primary.dark : palette.secondary.main,
    }));
    const unit = volume
        ? id
            ? 'Kredit terjual'
            : 'Credits sold'
        : 'USD / credit';

    return (
        <Paper
            component="section"
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}
        >
            <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
                {product}
            </Typography>
            <Typography color="text.secondary">
                {volume || !id ? unit : 'USD / kredit'}
            </Typography>
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
                />
            ) : (
                <ScatterChart
                    height={240}
                    skipAnimation
                    hideLegend
                    disableHitArea
                    title={`${product} · USD`}
                    {...(showEmptyPriceTimeline && {
                        yAxis: [{ position: 'none', min: 0, max: 1 }],
                        slots: { noDataOverlay: () => null },
                    })}
                    xAxis={[
                        {
                            scaleType: 'point',
                            data: visiblePoints.map((_, index) => index),
                            tickNumber: visiblePoints.length,
                            valueFormatter: (value: number) =>
                                formatDate(
                                    visiblePoints[Math.round(value)]?.date ??
                                        visiblePoints[0].date,
                                ),
                        },
                    ]}
                    series={series.map((item, index) => ({
                        ...item,
                        markerSize: 5,
                        data: visiblePoints.flatMap(({ values }, dateIndex) => {
                            const value = values[index];
                            return value === null
                                ? []
                                : [
                                      {
                                          x: dateIndex,
                                          y: value,
                                          id: visiblePoints[dateIndex].date,
                                      },
                                  ];
                        }),
                        valueFormatter: (
                            value: { x: number; y: number } | null,
                        ) => {
                            if (value === null) {
                                return null;
                            }

                            const point = visiblePoints[value.x];
                            const price = `${formatDate(point.date)} · ${formatDisplayNumber(value.y, lang)} USD`;
                            const otherIndex = index === 0 ? 1 : 0;

                            return point.values[otherIndex] === value.y
                                ? `${price} (${labels.join(' + ')})`
                                : price;
                        },
                    }))}
                />
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
                                        {volume
                                            ? id
                                                ? 'Tanggal'
                                                : 'Date'
                                            : id
                                              ? 'Tanggal'
                                              : 'Date'}
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
                                {(includeNoTradeDates
                                    ? visiblePoints
                                    : visiblePoints.filter(
                                          ({ noTrades }) =>
                                              !noTrades.every(Boolean),
                                      )
                                )
                                    .slice()
                                    .reverse()
                                    .map(
                                        ({
                                            date,
                                            values,
                                            observed,
                                            noTrades,
                                        }) => (
                                            <tr key={date}>
                                                <th scope="row">
                                                    {formatDate(date)}
                                                </th>
                                                {values.map((value, index) => {
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
                                                    const statusLabel =
                                                        noTrades[index]
                                                            ? id
                                                                ? 'Tidak ada transaksi'
                                                                : 'No trades'
                                                            : isInProgress
                                                              ? id
                                                                  ? 'Sedang diproses'
                                                                  : 'In progress'
                                                              : couldNotVerify
                                                                ? id
                                                                    ? 'Belum dapat dipastikan'
                                                                    : 'Could not verify'
                                                                : observed[
                                                                        index
                                                                    ]
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
                                                                    couldNotVerify ||
                                                                    (volume &&
                                                                        value ===
                                                                            0)
                                                                        ? 'text.disabled'
                                                                        : undefined,
                                                            }}
                                                        >
                                                            {value !== null ? (
                                                                formatDisplayNumber(
                                                                    value,
                                                                    lang,
                                                                )
                                                            ) : isInProgress ? (
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
                                                                    {
                                                                        statusLabel
                                                                    }
                                                                </Box>
                                                            ) : (
                                                                statusLabel
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </tr>
                                        ),
                                    )}
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
    excludedDates,
    trades,
}: {
    lang: Language;
    period: Period;
    startDate: string;
    endDate: string;
    firstDate: string;
    latestDate: string;
    excludedDates: ExcludedDates;
    trades: Trades;
}) {
    const [tab, setTab] = useState<'summary' | Metric>('summary');
    const [editingCustomRange, setEditingCustomRange] = useState(false);
    const id = lang === 'id';
    const title = id ? 'Tren Kredit RSPO' : 'RSPO Credit Trends';
    const description = id
        ? 'Bandingkan harga dan volume perdagangan kredit standar dan petani swadaya di PRISMA.'
        : 'Compare PRISMA prices and trading volumes for Standard and Independent Smallholder credits.';
    const start = Date.parse(startDate);
    const dates = Array.from(
        { length: (Date.parse(endDate) - start) / dayMs + 1 },
        (_, index) =>
            new Date(start + index * dayMs).toISOString().slice(0, 10),
    );
    const pendingDateFormat = new Intl.DateTimeFormat(id ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });

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
                            <TextField
                                id="trends-period"
                                select
                                label={id ? 'Rentang tanggal' : 'Date range'}
                                value={editingCustomRange ? 'custom' : period}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setEditingCustomRange(value === 'custom');
                                    if (value !== 'custom') {
                                        router.get(
                                            trendsIndex.url({ language: lang }),
                                            { period: value },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }
                                }}
                                sx={{ width: { xs: '100%', sm: 240 } }}
                            >
                                <MenuItem value="last-7-days">
                                    {id ? '7 hari terakhir' : 'Last 7 days'}
                                </MenuItem>
                                <MenuItem value="last-30-days">
                                    {id ? '30 hari terakhir' : 'Last 30 days'}
                                </MenuItem>
                                <MenuItem value="90-days">
                                    {id ? '90 hari terakhir' : 'Last 90 days'}
                                </MenuItem>
                                <MenuItem value="180-days">
                                    {id ? '180 hari terakhir' : 'Last 180 days'}
                                </MenuItem>
                                <MenuItem value="last-365-days">
                                    {id ? '365 hari terakhir' : 'Last 365 days'}
                                </MenuItem>
                                <MenuItem value="week">
                                    {id ? 'Minggu lalu' : 'Last week'}
                                </MenuItem>
                                <MenuItem value="month">
                                    {id ? 'Bulan lalu' : 'Last month'}
                                </MenuItem>

                                <MenuItem value="three-months">
                                    {id ? '3 bulan terakhir' : 'Last 3 months'}
                                </MenuItem>

                                <MenuItem value="six-months">
                                    {id ? '6 bulan terakhir' : 'Last 6 months'}
                                </MenuItem>

                                <MenuItem value="year">
                                    {id ? 'Tahun lalu' : 'Last year'}
                                </MenuItem>

                                <MenuItem value="custom">
                                    {id ? 'Rentang khusus' : 'Custom range'}
                                </MenuItem>
                            </TextField>
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
                        </Stack>
                    </Paper>
                    {(excludedDates.inProgress.length > 0 ||
                        excludedDates.couldNotVerify.length > 0) && (
                        <Alert severity="info" role="status">
                            <Stack spacing={0.75}>
                                <Typography variant="subtitle2">
                                    {id
                                        ? 'Beberapa tanggal tidak masuk dalam hasil.'
                                        : 'Some dates are excluded from these results.'}
                                </Typography>
                                {[
                                    {
                                        label: id
                                            ? 'Sedang diproses'
                                            : 'In progress',
                                        dates: excludedDates.inProgress,
                                    },
                                    {
                                        label: id
                                            ? 'Belum dapat dipastikan'
                                            : 'Could not verify',
                                        dates: excludedDates.couldNotVerify,
                                    },
                                ].map(({ label, dates: excluded }) =>
                                    excluded.length > 0 ? (
                                        <Box component="details" key={label}>
                                            <Box
                                                component="summary"
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                {label} ({excluded.length})
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{ mt: 0.5 }}
                                            >
                                                {excluded
                                                    .map(
                                                        ({
                                                            date,
                                                            creditTypes,
                                                        }) =>
                                                            `${pendingDateFormat.format(new Date(date))} (${creditTypes.join(', ').replaceAll('_', ' ')})`,
                                                    )
                                                    .join(' · ')}
                                            </Typography>
                                        </Box>
                                    ) : null,
                                )}
                            </Stack>
                        </Alert>
                    )}
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
                                                        ? 'Standar'
                                                        : 'Standard'}
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
                                                        ? 'Petani swadaya (IS)'
                                                        : 'Independent Smallholder (IS)'}
                                                </Typography>
                                                <Typography
                                                    color="text.secondary"
                                                    variant="body2"
                                                >
                                                    {metric === 'price'
                                                        ? id
                                                            ? 'Harga transaksi terakhir per hari (UTC). Hari tanpa transaksi atau dengan data belum lengkap dibiarkan kosong.'
                                                            : 'Last traded price by UTC day. Days with no trade or incomplete data are blank.'
                                                        : id
                                                          ? 'Jumlah kredit terjual per hari (UTC) dalam rentang pilihan. Hari dengan data yang belum lengkap dibiarkan kosong.'
                                                          : 'Credits sold per UTC day within the selected dates. Days with incomplete data are blank.'}
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
                                                metric,
                                            )}
                                            metric={metric}
                                            lang={lang}
                                            excludedDates={excludedDates}
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
