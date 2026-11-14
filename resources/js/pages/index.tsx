import { Head } from '@inertiajs/react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CalculatorInputs from '@/components/calculator-inputs';
import CalculatorResults from '@/components/calculator-results';
import GlossaryText from '@/components/glossary-text';
import Layout from '@/components/layout';
import { calculatorCopy } from '@/calculator-copy';
import { encode, useCalculator, type Inputs } from '@/hooks/use-calculator';
import { useCalculatorScenario } from '@/hooks/use-calculator-scenario';
import { calculator } from '@/routes';

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
    const result = useCalculator(inputs);
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
            <Box data-enter>
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
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: '2.5rem', md: '3.75rem' },
                        maxWidth: 850,
                        mt: 3,
                        mb: 1,
                    }}
                >
                    {text.title}
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{
                        maxWidth: 680,
                        mt: 2,
                        mb: 5,
                        fontSize: '1.125rem',
                        lineHeight: 1.7,
                    }}
                >
                    <GlossaryText language={inputs.language}>
                        {text.intro}
                    </GlossaryText>
                </Typography>
                {invalid && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {text.invalid}
                    </Alert>
                )}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'minmax(0, 1.08fr) minmax(0, 1fr)',
                        },
                        gap: { xs: 3, lg: 4 },
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
                        shareUrl={shareUrl}
                    />
                </Box>
            </Box>
        </Layout>
    );
}
