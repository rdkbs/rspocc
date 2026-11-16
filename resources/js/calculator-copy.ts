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
            'This calculator is developed by Koperasi Perkebunan Belayan Sejahtera, an RSPO member. It is not an official RSPO calculator, and membership does not mean RSPO has endorsed it. Results are ',
        disclaimerEmphasis: 'estimates',
        disclaimerAfterEmphasis: ', not binding offers or contracts.',
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
            'Kalkulator ini dikembangkan oleh Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Kalkulator ini bukan kalkulator resmi RSPO, dan keanggotaan tersebut tidak berarti RSPO mendukungnya. Hasilnya hanya ',
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
        guideSteps: [
            ['Enter FFB volume', 'Enter the volume in kilograms or tonnes.'],
            [
                'Set credit prices',
                'Enter an estimated USD price for each credit you plan to sell.',
            ],
            [
                'Review the estimate',
                'Check revenue and added value per kg. If needed, adjust extraction rates or the exchange rate in Settings.',
            ],
        ],
        faqTitle: 'Common questions',
        faqItems: [
            [
                'What is the RSPO Credit Calculator?',
                'This tool estimates RSPO credit revenue and added value per kilogram of fresh fruit bunches from your volume and credit prices. It is developed by Koperasi Perkebunan Belayan Sejahtera and is not an official RSPO calculator.',
            ],
            [
                'Are the prices up to date?',
                'The price cards show a dated PRISMA reference, not live market prices. Check the date on each card and enter your estimated selling price.',
            ],
            [
                'Are the exchange rates up to date?',
                'Frankfurter provides reference rates, not live trading rates. We reuse them for up to one hour and use the last successful result if the service is unavailable. Check the rate date in Settings. Shared links keep their saved rate, and you can enter a rate manually.',
            ],
        ],
        faqLink: 'FAQ',
    },
    id: {
        guideTitle: 'Cara menggunakan kalkulator',
        guideSteps: [
            ['Masukkan volume TBS', 'Masukkan volume dalam kilogram atau ton.'],
            [
                'Atur harga kredit',
                'Masukkan perkiraan harga dalam USD untuk setiap kredit yang akan dijual.',
            ],
            [
                'Periksa hasil perkiraan',
                'Periksa pendapatan dan tambahan per kg. Jika perlu, sesuaikan rendemen atau kurs di pengaturan.',
            ],
        ],
        faqTitle: 'Pertanyaan umum',
        faqItems: [
            [
                'Apa itu Kalkulator Kredit RSPO?',
                'Alat ini memperkirakan pendapatan kredit RSPO dan nilai tambah per kilogram TBS berdasarkan volume dan harga kredit yang Anda masukkan. Alat ini dikembangkan oleh Koperasi Perkebunan Belayan Sejahtera dan bukan kalkulator resmi RSPO.',
            ],
            [
                'Apakah harganya terbaru?',
                'Kartu harga menampilkan referensi PRISMA pada tanggal yang tercantum, bukan harga pasar langsung. Periksa tanggal pada kartu dan masukkan perkiraan harga jual Anda.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Frankfurter menyediakan kurs referensi, bukan kurs transaksi langsung. Kurs digunakan kembali hingga satu jam. Jika layanan tidak tersedia, kalkulator memakai hasil terakhir yang berhasil diperoleh. Periksa tanggal kurs di pengaturan. Tautan yang dibagikan mempertahankan kurs tersimpan, dan Anda dapat memasukkan kurs sendiri.',
            ],
        ],
        faqLink: 'FAQ',
    },
} as const;

export type CalculatorCopy = {
    [Key in keyof (typeof calculatorCopy)['en']]: string;
};
