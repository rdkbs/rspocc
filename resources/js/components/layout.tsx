import { Head, Link } from '@inertiajs/react';
import {
    forwardRef,
    useEffect,
    useMemo,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import {
    ThemeProvider,
    createTheme,
    responsiveFontSizes,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import MuiLink from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
    calculator,
    guide,
    faq,
    about,
    terms,
    privacy,
    glossary,
} from '@/routes';

const NavigationLink = forwardRef<
    HTMLAnchorElement,
    Omit<ComponentProps<typeof Link>, 'component'>
>(function NavigationLink({ href = '/', ...props }, ref) {
    return <Link {...props} href={href} ref={ref} />;
});
const navigation = [
    { title: 'Guide', titleId: 'Panduan', route: guide },
    { title: 'FAQ', titleId: 'FAQ', route: faq },
    { title: 'Glossary', titleId: 'Istilah', route: glossary },
    { title: 'About', titleId: 'Tentang', route: about },
    { title: 'Terms', titleId: 'Ketentuan', route: terms },
    { title: 'Privacy', titleId: 'Privasi', route: privacy },
];
function calculatorHomeUrl(language: 'id' | 'en'): string {
    const url = calculator.url(undefined, { query: { lang: language } });
    return url.startsWith('?') ? `/${url}` : url || '/';
}
export function canonicalPageUrl(path: string, language: 'id' | 'en'): string {
    return `https://rspocc.belayansejahtera.org${path}${language === 'en' ? '?lang=en' : ''}`;
}
export default function Layout({
    children,
    title,
    path = '/',
    description = 'Estimate RSPO credit premium revenue and added value per kilogram of fresh fruit bunches.',
    language = 'en',
    onLanguageChange,
}: {
    children: ReactNode;
    title: string;
    path?: string;
    description?: string;
    language?: 'id' | 'en';
    onLanguageChange?: (language: 'id' | 'en') => void;
}) {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);
    const theme = useMemo(
        () =>
            responsiveFontSizes(
                createTheme({
                    palette: {
                        mode: dark ? 'dark' : 'light',
                        primary: { main: dark ? '#ffb77a' : '#aa450d' },
                        secondary: { main: dark ? '#abd6b4' : '#24593e' },
                        text: {
                            primary: dark ? '#f2f1eb' : '#252c25',
                            secondary: dark ? '#bebfb6' : '#62685e',
                        },
                        divider: dark ? '#393d36' : '#e1e3d9',
                        background: {
                            default: dark ? '#121212' : '#f6f6ef',
                            paper: dark ? '#1d201c' : '#ffffff',
                        },
                    },
                    typography: {
                        fontFamily: '"Instrument Sans", Arial, sans-serif',
                        fontSize: 18,
                        h1: {
                            fontWeight: 500,
                            letterSpacing: '-0.045em',
                            lineHeight: 1.08,
                        },
                        h2: { fontWeight: 500, letterSpacing: '-0.035em' },
                        h5: { fontWeight: 500, letterSpacing: '-0.025em' },
                        button: { textTransform: 'none', fontWeight: 600 },
                    },
                    shape: { borderRadius: 8 },
                    components: {
                        MuiCssBaseline: {
                            styleOverrides: {
                                html: {
                                    scrollBehavior: 'smooth',
                                    colorScheme: dark ? 'dark' : 'light',
                                },
                                body: { WebkitFontSmoothing: 'antialiased' },
                                a: { color: 'inherit' },
                                '*:focus-visible': {
                                    outline: '3px solid #cf722b',
                                    outlineOffset: 4,
                                },
                                '[data-enter]': {
                                    animation:
                                        'page-enter 600ms cubic-bezier(.2,.8,.2,1) both',
                                },
                                '@keyframes page-enter': {
                                    from: {
                                        opacity: 0,
                                        transform: 'translateY(10px)',
                                    },
                                    to: {
                                        opacity: 1,
                                        transform: 'translateY(0)',
                                    },
                                },
                                '@media (prefers-reduced-motion: reduce)': {
                                    '*, *::before, *::after': {
                                        animation: 'none !important',
                                        transition: 'none !important',
                                        scrollBehavior: 'auto !important',
                                    },
                                },
                            },
                        },
                        MuiButton: {
                            defaultProps: { disableElevation: true },
                            styleOverrides: {
                                root: {
                                    minHeight: 46,
                                    paddingInline: 18,
                                    transition:
                                        'transform 150ms ease, background-color 150ms ease',
                                    '@media (hover: hover) and (pointer: fine)':
                                        {
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                            },
                                            '&:active': {
                                                transform: 'translateY(1px)',
                                            },
                                        },
                                },
                            },
                        },
                        MuiOutlinedInput: {
                            styleOverrides: {
                                root: {
                                    minHeight: 58,
                                    fontSize: '1.125rem',
                                    backgroundColor: dark
                                        ? '#23261f'
                                        : '#fcfcf8',
                                    '& fieldset': {
                                        borderColor: dark
                                            ? '#707865'
                                            : '#898f80',
                                    },
                                },
                                input: { fontVariantNumeric: 'tabular-nums' },
                            },
                        },
                        MuiInputLabel: {
                            styleOverrides: {
                                root: {
                                    fontSize: '1rem',
                                    color: dark ? '#c4c8bd' : '#52594d',
                                },
                            },
                        },
                        MuiFormHelperText: {
                            styleOverrides: {
                                root: {
                                    fontSize: '.875rem',
                                    lineHeight: 1.6,
                                    marginInline: 0,
                                },
                            },
                        },
                        MuiTooltip: {
                            styleOverrides: {
                                tooltip: {
                                    fontSize: 16,
                                    lineHeight: 1.6,
                                    padding: 16,
                                    maxWidth: 360,
                                },
                            },
                        },
                        MuiPaper: {
                            styleOverrides: {
                                root: {
                                    backgroundImage: 'none',
                                    boxShadow: 'none',
                                },
                            },
                        },
                    },
                }),
            ),
        [dark],
    );
    const pageUrl = canonicalPageUrl(path, language);
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Head title={title}>
                <meta name="description" content={description} />
                <meta name="page-type" content="software" />
                <meta name="site-kind" content="software" />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={pageUrl} />
                <link rel="canonical" href={pageUrl} />
            </Head>
            <Box
                component="a"
                href="#main"
                sx={{
                    position: 'absolute',
                    left: -9999,
                    '&:focus': {
                        left: 16,
                        top: 16,
                        zIndex: 10,
                        bgcolor: 'background.paper',
                        p: 2,
                    },
                }}
            >
                {language === 'id' ? 'Lewati ke konten' : 'Skip to content'}
            </Box>
            <Box
                component="header"
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Container
                    maxWidth="lg"
                    disableGutters
                    sx={{ px: { xs: 2, lg: 0 } }}
                >
                    <Stack
                        className="wrap"
                        direction="row"
                        sx={{
                            minHeight: 94,
                            py: 2,
                            gap: 2,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                        }}
                    >
                        <Link
                            href={calculatorHomeUrl(language)}
                            style={{
                                color: 'inherit',
                                textDecoration: 'none',
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                component="img"
                                src="/logo-white-green.svg"
                                alt=""
                                sx={{
                                    width: 44,
                                    height: 44,
                                    objectFit: 'contain',
                                    borderRadius: '12%',
                                }}
                            />
                            <Box>
                                <Typography
                                    component="span"
                                    sx={{
                                        display: 'block',
                                        fontSize: 13,
                                        color: 'text.secondary',
                                        mt: 0.5,
                                    }}
                                >
                                    RSPO Credit Calculator
                                </Typography>
                            </Box>
                        </Link>
                        <Stack
                            component="nav"
                            className="wrap"
                            aria-label={
                                language === 'id'
                                    ? 'Navigasi utama'
                                    : 'Main navigation'
                            }
                            direction="row"
                            sx={{
                                gap: { xs: 0.5, sm: 1 },
                                order: { xs: 2, md: 1 },
                                width: { xs: '100%', md: 'auto' },
                                ml: { md: 'auto' },
                                justifyContent: {
                                    xs: 'center',
                                    md: 'flex-start',
                                },
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            }}
                        >
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                href={calculatorHomeUrl(language)}
                                color={path === '/' ? 'primary' : 'inherit'}
                                aria-current={path === '/' ? 'page' : undefined}
                            >
                                {language === 'id'
                                    ? 'Kalkulator'
                                    : 'Calculator'}
                            </Button>
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                href={guide.url({ query: { lang: language } })}
                                color="inherit"
                            >
                                {language === 'id' ? 'Panduan' : 'Guide'}
                            </Button>
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                href={faq.url({ query: { lang: language } })}
                                color="inherit"
                            >
                                FAQ
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
            <Container
                component="main"
                id="main"
                maxWidth="lg"
                disableGutters
                sx={{
                    px: { xs: 2, lg: 0 },
                    pt: { xs: 3, md: 0 },
                    pb: { xs: 4, md: 6 },
                    minHeight: '75vh',
                }}
            >
                {children}
            </Container>
            <Box
                component="footer"
                sx={{
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                    py: { xs: 4, md: 5 },
                }}
            >
                <Container
                    maxWidth="lg"
                    disableGutters
                    sx={{ px: { xs: 2, lg: 0 } }}
                >
                    <Stack className="wrap" sx={{ gap: 3 }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            sx={{
                                gap: 3,
                                alignItems: { xs: 'stretch', sm: 'center' },
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Stack
                                component="nav"
                                aria-label={
                                    language === 'id'
                                        ? 'Tautan halaman'
                                        : 'Page links'
                                }
                                direction="row"
                                sx={{
                                    gap: 0.5,
                                    flexWrap: 'wrap',
                                    alignContent: 'start',
                                    alignItems: 'center',
                                }}
                            >
                                <Box
                                    component="img"
                                    src="/logo-white-green.svg"
                                    alt=""
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        objectFit: 'contain',
                                        borderRadius: '12%',
                                        mr: 1,
                                    }}
                                />
                                {navigation.map((item) => (
                                    <Button
                                        key={item.title}
                                        component={NavigationLink}
                                        nativeButton={false}
                                        href={item.route.url({
                                            query: { lang: language },
                                        })}
                                        color="inherit"
                                        sx={{ fontSize: 14 }}
                                    >
                                        {language === 'id'
                                            ? item.titleId
                                            : item.title}
                                    </Button>
                                ))}
                            </Stack>

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                sx={{
                                    gap: 1.5,
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                }}
                            >
                                {onLanguageChange && (
                                    <TextField
                                        select
                                        label="Language / Bahasa"
                                        size="small"
                                        value={language}
                                        onChange={(event) =>
                                            onLanguageChange(
                                                event.target.value as
                                                    | 'id'
                                                    | 'en',
                                            )
                                        }
                                        sx={{ minWidth: 180 }}
                                    >
                                        <MenuItem value="id">
                                            Indonesia
                                        </MenuItem>
                                        <MenuItem value="en">English</MenuItem>
                                    </TextField>
                                )}
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => setDark(!dark)}
                                    aria-pressed={dark}
                                    sx={{ fontSize: 14 }}
                                >
                                    {language === 'id'
                                        ? dark
                                            ? 'Mode terang'
                                            : 'Mode gelap'
                                        : dark
                                          ? 'Light mode'
                                          : 'Dark mode'}
                                </Button>
                            </Stack>
                        </Stack>

                        <Stack sx={{ gap: 0.5 }}>
                            <Typography
                                color="text.secondary"
                                variant="caption"
                                sx={{
                                    pt: 2,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                {language === 'id'
                                    ? 'Dikembangkan oleh Tim Litbang KPBS.'
                                    : 'Developed by the KPBS Research & Development Team.'}
                            </Typography>
                            <MuiLink
                                href="https://belayansejahtera.org/"
                                target="_blank"
                                rel="noreferrer"
                                color="text.secondary"
                                underline="hover"
                                sx={{
                                    width: 'fit-content',
                                    fontSize: 13,
                                    lineHeight: 1.6,
                                }}
                            >
                                Koperasi Perkebunan Belayan Sejahtera
                            </MuiLink>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
