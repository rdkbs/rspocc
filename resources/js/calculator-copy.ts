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
        inputs: 'Volume dan harga kredit',
        results: 'Perkiraan pendapatan Anda',
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
            'Kalkulator ini dikembangkan oleh Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Kalkulator ini bukan kalkulator resmi RSPO, dan status keanggotaan ini tidak berarti kalkulator mendapat dukungan resmi dari RSPO. Hasilnya hanya ',
        disclaimerEmphasis: 'perkiraan',
        disclaimerAfterEmphasis:
            ', bukan penawaran atau kontrak yang mengikat.',
        termsLink: 'Baca ketentuan lengkap',
        copied: 'Tautan berhasil disalin.',
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
                'The cards use PRISMA’s last-traded price for each credit type. If no trade is reported during the current period, we keep the last available price. We check PRISMA daily; the date on each card is the retrieval date, not the trade date. Actual selling prices may differ.',
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
                'Masukkan perkiraan harga jual setiap jenis kredit dalam USD.',
            ],
            [
                'Lihat hasil perhitungan',
                'Lihat perkiraan pendapatan dan nilai tambah per kg TBS. Jika perlu, ubah rendemen atau kurs di pengaturan.',
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
                'Kartu menampilkan harga transaksi terakhir di PRISMA untuk setiap jenis kredit. Jika tidak ada transaksi pada periode berjalan, harga terakhir yang tersedia tetap digunakan. Kami memeriksa data setiap hari; tanggal pada kartu adalah tanggal pengambilan data, bukan tanggal transaksi. Harga jual sebenarnya bisa berbeda.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Kurs acuan berasal dari Frankfurter dan disimpan hingga satu jam sebelum diambil kembali. Jika layanan tidak tersedia, kalkulator memakai data terakhir yang berhasil diambil. Lihat tanggal kurs di pengaturan. Hasil yang dibuka dari tautan tetap memakai kurs saat dibagikan. Anda juga dapat mengisi kurs sendiri.',
            ],
        ],
        faqLink: 'FAQ',
    },
} as const;

export type CalculatorCopy = {
    [Key in keyof (typeof calculatorCopy)['en']]: string;
};
