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
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { localizedContent } from '@/routes';
import { language as calculatorLanguage } from '@/routes/calculator';

export const NavigationLink = forwardRef<
    HTMLAnchorElement,
    Omit<ComponentProps<typeof Link>, 'component'>
>(function NavigationLink({ href = '/', ...props }, ref) {
    return <Link {...props} href={href} ref={ref} />;
});
const navigation = [
    { title: 'Guide', titleId: 'Panduan', page: 'guide' },
    { title: 'Read FAQ', titleId: 'Baca FAQ', page: 'faq' },
    { title: 'Glossary', titleId: 'Istilah', page: 'glossary' },
    { title: 'About', titleId: 'Tentang', page: 'about' },
    { title: 'Terms', titleId: 'Ketentuan', page: 'terms' },
    { title: 'Privacy', titleId: 'Privasi', page: 'privacy' },
];
function calculatorHomeUrl(language: 'id' | 'en'): string {
    return calculatorLanguage.url({ language });
}
export function canonicalPageUrl(path: string): string {
    return `https://rspocc.belayansejahtera.org${path}`;
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
    onLanguageChange: (language: 'id' | 'en') => void;
}) {
    const [dark, setDark] = useState(false);
    const primaryPalette = dark
        ? {
              main: '#e17e00',
              light: '#ffc27d',
              dark: '#e17e00',
              contrastText: '#f2f1eb',
          }
        : {
              main: '#e17e00',
              light: '#f3ae43',
              dark: '#9c5000',
              contrastText: '#f2f1eb',
          };
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);
    const theme = useMemo(
        () =>
            responsiveFontSizes(
                createTheme({
                    palette: {
                        mode: dark ? 'dark' : 'light',
                        primary: primaryPalette,
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
                                    outline: `3px solid ${primaryPalette.dark}`,
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
                                    '&.MuiButton-text.MuiButton-colorPrimary': {
                                        color: primaryPalette.main,
                                    },
                                    '&[aria-current="page"]': {
                                        textDecoration: 'underline',
                                        textDecorationThickness: 2,
                                        textUnderlineOffset: 4,
                                    },
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
                        MuiTab: {
                            styleOverrides: {
                                root: {
                                    '&.Mui-selected': {
                                        color: primaryPalette.dark,
                                    },
                                },
                            },
                        },
                        MuiTabs: {
                            styleOverrides: {
                                indicator: {
                                    backgroundColor: primaryPalette.dark,
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
                        MuiInputAdornment: {
                            styleOverrides: {
                                root: {
                                    color: dark ? '#bebfb6' : '#62685e',
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
    const pageUrl = canonicalPageUrl(path);
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Head title={title}>
                <meta name="description" content={description} />
                <meta name="color-scheme" content="light dark" />
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
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    clipPath: 'inset(50%)',
                    whiteSpace: 'nowrap',
                    '&:focus': {
                        clipPath: 'none',
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
                className="nav"
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
                                        fontWeight: 700,
                                        color: 'primary.main',
                                    }}
                                >
                                    {language === 'id'
                                        ? 'Kalkulator Kredit RSPO'
                                        : 'RSPO Credit Calculator'}
                                </Typography>
                                <Typography
                                    component="span"
                                    variant="caption"
                                    color="textSecondary"
                                    sx={{
                                        display: 'block',
                                        lineHeight: 1,
                                    }}
                                >
                                    {language === 'id'
                                        ? 'oleh Belayan Sejahtera'
                                        : 'by Belayan Sejahtera'}
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
                                color="primary"
                                aria-current={
                                    path === '/' || path === `/${language}`
                                        ? 'page'
                                        : undefined
                                }
                            >
                                {language === 'id'
                                    ? 'Kalkulator'
                                    : 'Calculator'}
                            </Button>
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                href={localizedContent.url({
                                    language,
                                    page: 'guide',
                                })}
                                color="primary"
                                aria-current={
                                    path === `/${language}/guide`
                                        ? 'page'
                                        : undefined
                                }
                            >
                                {language === 'id' ? 'Panduan' : 'Guide'}
                            </Button>
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                href={localizedContent.url({
                                    language,
                                    page: 'faq',
                                })}
                                color="primary"
                                aria-current={
                                    path === `/${language}/faq`
                                        ? 'page'
                                        : undefined
                                }
                            >
                                {language === 'id' ? 'Baca FAQ' : 'Read FAQ'}
                            </Button>
                        </Stack>
                        <TextField
                            select
                            variant="standard"
                            label={language === 'id' ? 'Bahasa' : 'Language'}
                            size="small"
                            value={language}
                            onChange={(event) =>
                                onLanguageChange(
                                    event.target.value as 'id' | 'en',
                                )
                            }
                            slotProps={{
                                select: {
                                    SelectDisplayProps: {
                                        style: {
                                            boxSizing: 'border-box',
                                        },
                                    },
                                },
                            }}
                            sx={{
                                minWidth: 120,
                                order: { xs: 1, md: 2 },
                                ml: { xs: 'auto', md: 0 },
                                '& .MuiInputLabel-root, & .MuiSelect-icon': {
                                    color: 'primary.main',
                                },
                                '& .MuiInput-root::before, & .MuiInput-root:hover:not(.Mui-disabled)::before, & .MuiInput-root::after':
                                    {
                                        borderBottomColor: 'primary.main',
                                    },
                            }}
                        >
                            <MenuItem value="id">Indonesia</MenuItem>
                            <MenuItem value="en">English</MenuItem>
                        </TextField>
                    </Stack>
                </Container>
            </Box>
            <Container
                component="main"
                id="main"
                tabIndex={-1}
                maxWidth="lg"
                disableGutters
                sx={{
                    px: { xs: 2, lg: 0 },
                    py: { xs: 4, md: 6 },
                    minHeight: '75vh',
                }}
            >
                {children}
            </Container>
            <Box
                component="footer"
                className="closing"
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
                    className="wrap"
                    sx={{ px: { xs: 2, lg: 0 } }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        sx={{
                            gap: 3,
                            mb: 3,
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
                                    href={localizedContent.url({
                                        language,
                                        page: item.page,
                                    })}
                                    color="primary"
                                    aria-current={
                                        path === `/${language}/${item.page}`
                                            ? 'page'
                                            : undefined
                                    }
                                    sx={{ fontSize: 14 }}
                                >
                                    {language === 'id'
                                        ? item.titleId
                                        : item.title}
                                </Button>
                            ))}
                        </Stack>

                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => setDark(!dark)}
                            aria-pressed={dark}
                            sx={{
                                fontSize: 14,
                                alignSelf: { xs: 'flex-end', sm: 'auto' },
                            }}
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
                    <Typography
                        component="p"
                        color="text.secondary"
                        variant="caption"
                        sx={{
                            pt: 3,
                            borderTop: 1,
                            borderColor: 'divider',
                        }}
                    >
                        RSPO Credit Calculator{' '}
                        {language === 'id'
                            ? 'oleh Tim R&D.'
                            : 'by the R&D Team.'}
                    </Typography>
                    <Typography
                        component="p"
                        color="text.secondary"
                        variant="caption"
                    >
                        {`© ${new Date().getFullYear()} Koperasi Perkebunan Belayan Sejahtera. ${language === 'id' ? 'Berlisensi MIT.' : 'MIT Licensed.'}`}
                    </Typography>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
