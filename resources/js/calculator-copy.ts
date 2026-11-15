import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
} from '@/calculator-assumptions';

export const calculatorCopy = {
    en: {
        inputs: 'Volume & credit prices',
        results: 'Your premium estimate',
        volume: 'FFB volume',
        unit: 'Volume unit',
        oer: 'CSPO · Oil Extraction Rate (OER)',
        ker: 'CSPKO · Extraction rate',
        yield: 'CSPKE · Extraction rate',
        total: 'Estimated credit revenue',
        estimatePrompt:
            'Enter FFB volume and prices for selected credits to see the estimate.',
        priceMissing: 'Enter a price',
        added: 'Extra revenue per kg FFB',
        outputs: 'Estimated product volumes',
        copy: 'Copy link',
        whatsapp: 'Share to WhatsApp',
        disclaimer: 'Confirm certified volumes and prices with your buyer.',
        copied: 'Link copied.',
        invalid:
            'This link could not be read. Enter volume and credit prices to start a new estimate.',
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
        inputs: 'Volume & harga kredit',
        results: 'Estimasi premi Anda',
        volume: 'Volume TBS',
        unit: 'Satuan volume',
        oer: 'CSPO · Oil Extraction Rate (OER)',
        ker: 'CSPKO · Rendemen',
        yield: 'CSPKE · Rendemen',
        total: 'Perkiraan pendapatan kredit',
        estimatePrompt:
            'Masukkan volume TBS dan harga kredit yang dipilih untuk melihat perkiraan.',
        priceMissing: 'Masukkan harga',
        added: 'Tambahan pendapatan per kg TBS',
        outputs: 'Perkiraan volume produk',
        copy: 'Salin tautan',
        whatsapp: 'Bagikan ke WhatsApp',
        disclaimer:
            'Konfirmasikan volume bersertifikat dan harga kepada pembeli.',
        copied: 'Tautan disalin.',
        invalid:
            'Tautan tidak dapat dibaca. Masukkan volume dan harga kredit untuk memulai perhitungan baru.',
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

export const homePageCopy = {
    en: {
        guideTitle: 'How to use the calculator',
        flowDescription:
            'Calculator flow: FFB volume, extraction rates, credit volumes and prices, estimated revenue.',
        flow: [
            'FFB volume',
            'Extraction rates',
            'Credit volumes and prices',
            'Estimated revenue',
        ],
        guideSteps: [
            ['Enter FFB volume', 'Enter the volume in kilograms or tonnes.'],
            [
                'Set credit prices',
                'Enter your agreed USD price for each credit. Uncheck credits you will not sell.',
            ],
            [
                'Review the estimate',
                'Check revenue and added value per kg. Adjust extraction rates or exchange rate under Rates.',
            ],
        ],
        guideLink: 'Guide',
        faqTitle: 'Common questions',
        faqItems: [
            [
                'Are the price placeholders fixed selling prices?',
                'No. They show dated PRISMA references. Enter the price agreed with your buyer.',
            ],
            [
                'Are calculator fees or taxes included?',
                'No. Estimates exclude fees, taxes, certification costs, and other deductions.',
            ],
            [
                'Does this estimate confirm which credits I can sell?',
                'No. Confirm eligible volumes and sale terms with your certification body and buyer.',
            ],
        ],
        faqLink: 'Read FAQ',
    },
    id: {
        guideTitle: 'Cara menggunakan kalkulator',
        flowDescription:
            'Alur kalkulator: volume TBS, rendemen, volume dan harga kredit, perkiraan pendapatan.',
        flow: [
            'Volume TBS',
            'Rendemen',
            'Volume dan harga kredit',
            'Perkiraan pendapatan',
        ],
        guideSteps: [
            ['Masukkan volume TBS', 'Masukkan volume dalam kilogram atau ton.'],
            [
                'Atur harga kredit',
                'Masukkan harga USD yang disepakati untuk setiap kredit. Hapus centang pada kredit yang tidak dijual.',
            ],
            [
                'Periksa hasil perkiraan',
                'Periksa pendapatan dan tambahan per kg. Ubah rendemen atau kurs di bagian Kurs.',
            ],
        ],
        guideLink: 'Panduan',
        faqTitle: 'Pertanyaan umum',
        faqItems: [
            [
                'Apakah harga placeholder merupakan harga jual tetap?',
                'Tidak. Nilainya adalah referensi PRISMA bertanggal. Masukkan harga yang disepakati dengan pembeli.',
            ],
            [
                'Apakah biaya atau pajak sudah termasuk?',
                'Tidak. Perkiraan belum memperhitungkan biaya, pajak, sertifikasi, dan potongan lain.',
            ],
            [
                'Apakah perkiraan ini memastikan kredit yang dapat dijual?',
                'Tidak. Pastikan volume yang memenuhi syarat dan ketentuan penjualan kepada lembaga sertifikasi dan pembeli.',
            ],
        ],
        faqLink: 'Baca FAQ',
    },
} as const;

export type CalculatorCopy = {
    [Key in keyof (typeof calculatorCopy)['en']]: string;
};
