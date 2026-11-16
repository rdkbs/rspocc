import { Head, router } from '@inertiajs/react';
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
import { localizedContent } from '@/routes';
import { language as calculatorLanguage } from '@/routes/calculator';

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
            calculatorLanguage.url(
                { language: inputs.language },
                { query: { payload: encode(inputs) } },
            ),
            window.location.origin,
        ).href;

    return (
        <Layout
            title="RSPO Credit Calculator"
            path={`/${inputs.language}`}
            language={inputs.language}
            onLanguageChange={(language) => {
                update('language', language);
                router.get(
                    calculatorLanguage.url(
                        { language },
                        {
                            query: {
                                payload:
                                    new URLSearchParams(
                                        window.location.search,
                                    ).get('payload') ?? undefined,
                            },
                        },
                    ),
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }}
        >
            <Head>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'RSPO Credit Calculator',
                        url: `https://rspocc.belayansejahtera.org/${inputs.language}`,
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
                                href={localizedContent.url({
                                    language: inputs.language,
                                    page: 'faq',
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
