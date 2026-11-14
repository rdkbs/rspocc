import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
} from '@/calculator-assumptions';

export const calculatorCopy = {
    en: {
        title: 'RSPO Credit Calculator',
        intro: 'Enter FFB volume and credit prices to estimate your revenue.',
        inputs: 'Volume & credit prices',
        results: 'Your premium estimate',
        volume: 'FFB volume',
        unit: 'Volume unit',
        oer: 'CSPO · Oil Extraction Rate (OER)',
        ker: 'CSPKO · Extraction rate',
        yield: 'CSPKE · Extraction rate',
        total: 'Estimated credit revenue',
        added: 'Extra revenue per kg FFB',
        outputs: 'Estimated product volumes',
        copy: 'Copy link',
        whatsapp: 'Share to WhatsApp',
        disclaimer: 'Confirm certified volumes and prices with your buyer.',
        copied: 'Link copied.',
        invalid: 'This link could not be read. Default assumptions are shown.',
        error: 'Values must be zero or more. The exchange rate must be above zero. Total extraction rates cannot exceed 100%.',
        oerHelp:
            'Share of FFB weight that becomes palm oil. RSPO default: ' +
            formatPercent(defaultExtractionRates.cspo, 'en') +
            '.',
        kerHelp:
            'RSPO default: ' +
            formatPercent(extractionAssumptions.kernel, 'en') +
            ' kernels × ' +
            formatPercent(extractionAssumptions.kernelOilRecovery, 'en') +
            ' oil = ' +
            formatPercent(defaultExtractionRates.cspko, 'en') +
            ' of FFB. KER itself is ' +
            formatPercent(extractionAssumptions.kernel, 'en') +
            '.',
        yieldHelp:
            'RSPO default: ' +
            formatPercent(extractionAssumptions.kernel, 'en') +
            ' kernels × ' +
            formatPercent(extractionAssumptions.kernelExpellerRecovery, 'en') +
            ' expeller = ' +
            formatPercent(defaultExtractionRates.cspke, 'en') +
            ' of FFB.',
        basis: 'Uncheck credits you will not sell.',
    },
    id: {
        title: 'Kalkulator Kredit RSPO',
        intro: 'Masukkan volume TBS dan harga kredit untuk memperkirakan pendapatan.',
        inputs: 'Volume & harga kredit',
        results: 'Estimasi premi Anda',
        volume: 'Volume TBS',
        unit: 'Satuan volume',
        oer: 'CSPO · Oil Extraction Rate (OER)',
        ker: 'CSPKO · Rendemen',
        yield: 'CSPKE · Rendemen',
        total: 'Perkiraan pendapatan kredit',
        added: 'Tambahan pendapatan per kg TBS',
        outputs: 'Perkiraan volume produk',
        copy: 'Salin tautan',
        whatsapp: 'Bagikan ke WhatsApp',
        disclaimer:
            'Konfirmasikan volume bersertifikat dan harga kepada pembeli.',
        copied: 'Tautan disalin.',
        invalid: 'Tautan tidak dapat dibaca. Asumsi awal ditampilkan.',
        error: 'Nilai tidak boleh negatif. Kurs harus lebih dari nol. Total rendemen maksimal 100%.',
        oerHelp:
            'Bagian berat TBS yang menjadi minyak sawit. Default RSPO: ' +
            formatPercent(defaultExtractionRates.cspo, 'id') +
            '.',
        kerHelp:
            'Default RSPO: inti ' +
            formatPercent(extractionAssumptions.kernel, 'id') +
            ' × minyak ' +
            formatPercent(extractionAssumptions.kernelOilRecovery, 'id') +
            ' = ' +
            formatPercent(defaultExtractionRates.cspko, 'id') +
            ' dari TBS. KER sendiri adalah ' +
            formatPercent(extractionAssumptions.kernel, 'id') +
            '.',
        yieldHelp:
            'Default RSPO: inti ' +
            formatPercent(extractionAssumptions.kernel, 'id') +
            ' × bungkil ' +
            formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id') +
            ' = ' +
            formatPercent(defaultExtractionRates.cspke, 'id') +
            ' dari TBS.',
        basis: 'Hapus centang kredit yang tidak dijual.',
    },
} as const;

export type CalculatorCopy = {
    [Key in keyof (typeof calculatorCopy)['en']]: string;
};
