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
        missingRate:
            'Enter a rate above zero on the result card. If the field is not visible yet, enter FFB volume and a credit price first.',
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
        missingRate:
            'Isi kurs lebih dari nol pada kartu hasil. Jika kolomnya belum muncul, masukkan volume TBS dan satu harga kredit terlebih dahulu.',
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
        title: 'Estimate RSPO credit revenue',
        guideTitle: 'How to use the calculator',
        guideSteps: [
            ['Enter FFB volume', 'Enter the volume in kilograms or tonnes.'],
            [
                'Set credit prices',
                'Enter an estimated USD price for each credit you plan to sell.',
            ],
            [
                'Review the estimate',
                'Review revenue and added value per kg. After entering FFB volume, select a product’s percentage under Estimated product volumes to edit its extraction rate. Change the exchange rate in the result card.',
            ],
        ],
        faqTitle: 'Common questions',
        faqItems: [
            [
                'What is the RSPO Credit Calculator?',
                'This calculator estimates additional RSPO credit revenue from your FFB volume and credit prices. It helps you and your ICS team compare potential revenue with certification costs. It is not an official RSPO calculator.',
            ],
            [
                'Are the credit prices up to date?',
                'We check PRISMA daily for the latest traded price of each credit type. The price stays the same until PRISMA records another trade. The date shown tells you when we checked the data, not when the trade took place.',
            ],
            [
                'Are the exchange rates up to date?',
                'We check Frankfurter rates daily. To use the latest rate and see its update date, select the suggestion below the currency field. You can also enter your own rate. Shared calculations keep the rate used when they were created.',
            ],
        ],
        faqLink: 'FAQ',
    },
    id: {
        title: 'Perkirakan pendapatan kredit RSPO',
        guideTitle: 'Cara menggunakan kalkulator',
        guideSteps: [
            ['Masukkan volume TBS', 'Masukkan volume dalam kilogram atau ton.'],
            [
                'Atur harga kredit',
                'Masukkan perkiraan harga jual setiap jenis kredit dalam USD.',
            ],
            [
                'Lihat hasil perhitungan',
                'Periksa pendapatan dan nilai tambah per kg TBS. Setelah memasukkan volume TBS, pilih persentase produk di bagian Perkiraan volume produk untuk mengubah rendemennya. Ubah kurs pada kartu hasil.',
            ],
        ],
        faqTitle: 'Pertanyaan umum',
        faqItems: [
            [
                'Apa itu Kalkulator Kredit RSPO?',
                'Kalkulator ini memperkirakan tambahan pendapatan dari kredit RSPO berdasarkan volume TBS dan harga kredit yang Anda masukkan. Perkiraan ini membantu Anda dan tim ICS membandingkan potensi pendapatan dengan biaya sertifikasi. Alat ini bukan kalkulator resmi RSPO.',
            ],
            [
                'Apakah harga kreditnya terbaru?',
                'Kami memeriksa PRISMA setiap hari untuk melihat harga transaksi terakhir setiap jenis kredit. Harga tetap sama sampai PRISMA mencatat transaksi baru. Tanggal yang tertera menunjukkan kapan kami memeriksa data, bukan kapan transaksi terjadi.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Kurs Frankfurter diperiksa setiap hari. Untuk memakai kurs terbaru dan melihat tanggal pembaruannya, pilih saran di bawah kolom mata uang. Anda juga bisa mengisi kurs sendiri. Tautan yang dibagikan tetap memakai kurs saat dibuat.',
            ],
        ],
        faqLink: 'FAQ',
    },
} as const;

export type CalculatorCopy = {
    [Key in keyof (typeof calculatorCopy)['en']]: string;
};
