import { Head, Link } from '@inertiajs/react';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CalculatorInputs from '@/components/calculator-inputs';
import CalculatorResults from '@/components/calculator-results';
import Layout, { NavigationLink } from '@/components/layout';
import { calculatorCopy, homePageCopy } from '@/calculator-copy';
import {
    credits,
    encode,
    useCalculator,
    type Inputs,
} from '@/hooks/use-calculator';
import { useCalculatorScenario } from '@/hooks/use-calculator-scenario';
import { calculator, faq, guide } from '@/routes';

export default function Index({
    payload,
    lang,
}: {
    payload: string | null;
    lang: Inputs['language'];
}) {
    const scenario = useCalculatorScenario(payload, lang);
    const { inputs, update, invalid, valid } = scenario;
    const text = calculatorCopy[inputs.language];
    const homeText = homePageCopy[inputs.language];
    const result = useCalculator(inputs);
    const ready =
        inputs.volume !== null &&
        credits.some((credit) => inputs.prices[credit] !== null);
    const shareUrl = () =>
        new URL(
            calculator.url(
                { payload: encode(inputs) },
                { query: { lang: inputs.language } },
            ),
            window.location.origin,
        ).href;

    return (
        <Layout
            title="RSPO Credit Calculator"
            language={inputs.language}
            onLanguageChange={(language) => update('language', language)}
        >
            <Head>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'RSPO Credit Calculator',
                        url: 'https://rspocc.belayansejahtera.org',
                        applicationCategory: 'FinanceApplication',
                        operatingSystem: 'Web',
                    })}
                </script>
            </Head>
            <>
                <Box
                    component="section"
                    aria-labelledby="calculator-title"
                    data-enter
                    sx={{ mb: { xs: 6, md: 8 } }}
                >
                    <Box className="wrap">
                        {invalid && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {text.invalid}
                            </Alert>
                        )}
                        <Box
                            className="app-frame"
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'repeat(2, minmax(0, 1fr))',
                                },
                                gap: 3,
                                alignItems: 'start',
                                '@media (orientation: portrait)': {
                                    gridTemplateColumns: '1fr',
                                },
                            }}
                        >
                            <CalculatorInputs scenario={scenario} text={text} />
                            <CalculatorResults
                                inputs={inputs}
                                text={text}
                                result={result}
                                valid={valid}
                                ready={ready}
                                shareUrl={shareUrl}
                            />
                        </Box>
                    </Box>
                </Box>
                <Box
                    component="section"
                    aria-labelledby="guide-preview-title"
                    sx={{ mb: { xs: 6, md: 8 } }}
                >
                    <Box className="wrap">
                        <Typography
                            component="h2"
                            id="guide-preview-title"
                            variant="h6"
                            sx={{ mb: 3, color: 'primary.main' }}
                        >
                            {homeText.guideTitle}
                        </Typography>
                        <Box
                            component="figure"
                            role="img"
                            aria-label={homeText.flowDescription}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                gap: { xs: 1, sm: 1.5 },
                                m: 0,
                                mb: 4,
                                p: { xs: 2, sm: 2.5 },
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                            }}
                        >
                            {homeText.flow.map((label, index) => (
                                <Box
                                    key={label}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: {
                                            xs: 'column',
                                            sm: 'row',
                                        },
                                        alignItems: 'center',
                                        gap: { xs: 1, sm: 1.5 },
                                        width: { xs: '100%', sm: 'auto' },
                                        flex: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            placeItems: 'center',
                                            minHeight: { xs: 44, sm: 64 },
                                            width: '100%',
                                            px: 1.5,
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {label}
                                        </Typography>
                                    </Box>
                                    {index < homeText.flow.length - 1 && (
                                        <ArrowForward
                                            aria-hidden="true"
                                            sx={{
                                                color: 'primary.main',
                                                transform: {
                                                    xs: 'rotate(90deg)',
                                                    sm: 'none',
                                                },
                                            }}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                        <Box
                            component="ol"
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(3, minmax(0, 1fr))',
                                },
                                gap: { xs: 3, md: 4 },
                                p: 0,
                                m: 0,
                                listStyle: 'none',
                            }}
                        >
                            {homeText.guideSteps.map(
                                ([title, description], index) => (
                                    <Box component="li" key={title}>
                                        <Typography
                                            component="span"
                                            color="primary.main"
                                            sx={{
                                                display: 'block',
                                                mb: 1,
                                                fontSize: 14,
                                                fontWeight: 650,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            {String(index + 1).padStart(2, '0')}
                                        </Typography>
                                        <Typography
                                            component="h3"
                                            variant="body2"
                                            sx={{
                                                mb: 1,
                                                fontWeight: 650,
                                                color: 'primary.main',
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {description}
                                        </Typography>
                                    </Box>
                                ),
                            )}
                        </Box>
                        <Box sx={{ mt: 2, color: 'primary.main' }}>
                            <Link
                                href={guide.url({
                                    query: { lang: inputs.language },
                                })}
                                style={{
                                    color: 'inherit',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    minHeight: 44,
                                    fontWeight: 600,
                                    textUnderlineOffset: 4,
                                }}
                            >
                                {homeText.guideLink}
                            </Link>
                        </Box>
                    </Box>
                </Box>
                <Box component="section" aria-labelledby="faq-preview-title">
                    <Box className="wrap">
                        <Typography
                            component="h2"
                            id="faq-preview-title"
                            variant="h6"
                            sx={{ mb: 3, color: 'primary.main' }}
                        >
                            {homeText.faqTitle}
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'repeat(3, minmax(0, 1fr))',
                                },
                                gap: { xs: 3, md: 4 },
                            }}
                        >
                            {homeText.faqItems.map(([question, answer]) => (
                                <Box
                                    component="article"
                                    key={question}
                                    sx={{
                                        pt: 2,
                                        borderTop: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography
                                        component="h3"
                                        variant="body2"
                                        sx={{
                                            mb: 1,
                                            fontWeight: 650,
                                            color: 'primary.main',
                                        }}
                                    >
                                        {question}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        {answer}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                component={NavigationLink}
                                nativeButton={false}
                                variant="text"
                                href={faq.url({
                                    query: { lang: inputs.language },
                                })}
                                endIcon={<ArrowForward aria-hidden="true" />}
                                sx={{ px: 0 }}
                            >
                                {homeText.faqLink}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </>
        </Layout>
    );
}
