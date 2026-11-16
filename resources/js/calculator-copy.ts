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
            'Enter FFB volume and a price for each credit you sell.',
        excluded: 'Excluded',
        added: 'Extra revenue per kg FFB',
        outputs: 'Estimated product volumes',
        share: 'Share the result',
        disclaimerBeforeEmphasis:
            'Results from the RSPO Credit Calculator are ',
        disclaimerEmphasis: 'estimates',
        disclaimerAfterEmphasis:
            ', not binding offers or contracts.',
        termsLink: 'Read the full terms',
        copied: 'Link copied.',
        shareFailed:
            'Sharing is unavailable. Copy the URL from your browser’s address bar.',
        invalid:
            'This link could not be read. Enter volume and credit prices to start a new estimate.',
        error: 'Values must be zero or more. The exchange rate must be above zero. Total extraction rates cannot exceed 100%.',
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
            'Masukkan volume TBS dan harga untuk setiap kredit yang dijual.',
        excluded: 'Tidak dihitung',
        added: 'Tambahan pendapatan per kg TBS',
        outputs: 'Perkiraan volume produk',
        share: 'Bagikan hasil',
        disclaimerBeforeEmphasis:
            'Hasil perhitungan Kalkulator Kredit RSPO hanya ',
        disclaimerEmphasis: 'perkiraan',
        disclaimerAfterEmphasis:
            ', bukan penawaran atau kontrak yang mengikat.',
        termsLink: 'Baca ketentuan lengkap',
        copied: 'Tautan disalin.',
        shareFailed:
            'Fitur berbagi tidak tersedia. Salin URL dari bilah alamat browser.',
        invalid:
            'Tautan tidak dapat dibaca. Masukkan volume dan harga kredit untuk memulai perhitungan baru.',
        error: 'Nilai tidak boleh negatif. Kurs harus lebih dari nol. Total rendemen maksimal 100%.',
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
                'Enter your agreed USD price for each credit you sell. Leave other prices blank.',
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
                'Are the preset prices fixed selling prices?',
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
                'Masukkan harga USD yang disepakati untuk setiap kredit yang dijual. Kosongkan harga lainnya.',
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
                'Apakah harga preset merupakan harga jual tetap?',
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
