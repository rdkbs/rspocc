import { Head } from '@inertiajs/react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CalculatorInputs from '@/components/calculator-inputs';
import CalculatorResults from '@/components/calculator-results';
import Layout from '@/components/layout';
import { calculatorCopy } from '@/calculator-copy';
import {
    credits,
    encode,
    useCalculator,
    type Inputs,
} from '@/hooks/use-calculator';
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
    const ready =
        inputs.volume !== null &&
        credits.every(
            (credit) =>
                !inputs.included[credit] || inputs.prices[credit] !== null,
        );
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
            <Box
                component="section"
                aria-labelledby="calculator-title"
                data-enter
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
        </Layout>
    );
}
