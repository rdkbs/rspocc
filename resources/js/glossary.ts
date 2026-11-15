import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
} from '@/calculator-assumptions';

type GlossaryEntry = {
    term: string;
    termId: string;
    matches: string[];
    en: string;
    id: string;
    heading?: { en: string; id: string };
};

export const glossaryEntries: GlossaryEntry[] = [
    {
        term: 'URL / calculation link',
        termId: 'URL / tautan perhitungan',
        heading: {
            en: 'Calculator link URL',
            id: 'URL tautan kalkulator',
        },
        matches: ['URL', 'URLs', 'calculation link', 'tautan perhitungan'],
        en: 'The web address of a calculation. It contains the inputs, so anyone with the link can read them.',
        id: 'Alamat web untuk suatu perhitungan. Tautan ini memuat input, sehingga siapa pun yang memilikinya bisa membacanya.',
    },
    {
        term: 'Frankfurter',
        termId: 'Frankfurter',
        heading: {
            en: 'Frankfurter exchange-rate source',
            id: 'Sumber kurs Frankfurter',
        },
        matches: ['Frankfurter'],
        en: 'Provides the calculator’s reference exchange rates. These are not live trading quotes.',
        id: 'Sumber kurs referensi kalkulator ini. Kurs tersebut bukan penawaran transaksi langsung.',
    },

    {
        term: 'RSPO',
        termId: 'RSPO',
        heading: {
            en: 'Roundtable on Sustainable Palm Oil (RSPO)',
            id: 'Roundtable on Sustainable Palm Oil (RSPO)',
        },
        matches: ['RSPO'],
        en: 'The organization that sets the certification standards used here.',
        id: 'Organisasi yang menetapkan standar sertifikasi yang digunakan di kalkulator ini.',
    },
    {
        term: 'FFB / TBS',
        termId: 'TBS / FFB',
        heading: {
            en: 'Fresh fruit bunches (FFB / TBS)',
            id: 'Tandan Buah Segar (TBS / FFB)',
        },
        matches: ['FFB', 'TBS'],
        en: 'Fresh Fruit Bunches, or Tandan Buah Segar in Indonesian. The harvested fruit weight entered in this calculator.',
        id: 'Tandan Buah Segar, atau Fresh Fruit Bunches dalam bahasa Inggris. Ini adalah berat buah hasil panen yang Anda masukkan.',
    },
    {
        term: 'RSPO credit',
        termId: 'Kredit RSPO',
        matches: ['kredit RSPO'],
        en: 'One credit represents one tonne of the corresponding certified palm product. Selling a credit is separate from selling the physical product.',
        id: 'Satu kredit mewakili satu ton produk sawit bersertifikat yang sesuai. Penjualan kredit terpisah dari penjualan produk fisiknya.',
    },
    {
        term: 'IS credits',
        termId: 'Kredit IS',
        heading: {
            en: 'Independent Smallholder (IS) credits',
            id: 'Kredit petani swadaya bersertifikat (IS)',
        },
        matches: ['IS-CSPO', 'IS-CSPKO', 'IS-CSPKE', 'kredit IS'],
        en: 'Independent Smallholder credits come from certified independent smallholders. Their market prices differ from standard credits. This calculator uses IS prices by default.',
        id: 'Kredit Independent Smallholder (IS) berasal dari petani swadaya bersertifikat. Harganya berbeda dari kredit biasa. Kalkulator ini memakai harga IS sebagai default.',
    },
    {
        term: 'CSPO',
        termId: 'CSPO',
        heading: {
            en: 'Certified Sustainable Palm Oil (CSPO)',
            id: 'Minyak sawit berkelanjutan bersertifikat (CSPO)',
        },
        matches: ['CSPO'],
        en: 'Palm oil extracted from the fruit and sold as a certified product.',
        id: 'Minyak sawit dari daging buah yang dijual sebagai produk bersertifikat.',
    },
    {
        term: 'CSPKO',
        termId: 'CSPKO',
        heading: {
            en: 'Certified Sustainable Palm Kernel Oil (CSPKO)',
            id: 'Minyak inti sawit berkelanjutan bersertifikat (CSPKO)',
        },
        matches: ['CSPKO'],
        en: 'Oil extracted from the kernels inside the fruit and sold as a certified product.',
        id: 'Minyak dari inti buah yang dijual sebagai produk bersertifikat.',
    },
    {
        term: 'CSPKE',
        termId: 'CSPKE',
        heading: {
            en: 'Certified Sustainable Palm Kernel Expeller (CSPKE)',
            id: 'Bungkil inti sawit berkelanjutan bersertifikat (CSPKE)',
        },
        matches: ['CSPKE'],
        en: 'The material left after oil is extracted from palm kernels. It is often used in animal feed.',
        id: 'Sisa bahan setelah minyak diambil dari inti sawit. Bahan ini sering digunakan untuk pakan ternak.',
    },
    {
        term: 'OER',
        termId: 'OER',
        heading: {
            en: 'Palm oil extraction rate (OER)',
            id: 'Rendemen minyak sawit (OER)',
        },
        matches: ['OER'],
        en: `The share of FFB weight converted into palm oil. The RSPO default is ${formatPercent(defaultExtractionRates.cspo, 'en')}, or ${(defaultExtractionRates.cspo * 1000) / 100} kg of CSPO per 1,000 kg of FFB.`,
        id: `Bagian berat TBS yang menjadi minyak sawit. Default RSPO adalah ${formatPercent(defaultExtractionRates.cspo, 'id')}, atau ${(defaultExtractionRates.cspo * 1000) / 100} kg CSPO dari 1.000 kg TBS.`,
    },
    {
        term: 'KER',
        termId: 'KER',
        heading: {
            en: 'Palm kernel extraction rate (KER)',
            id: 'Rendemen inti sawit (KER)',
        },
        matches: ['KER'],
        en: `The share of FFB weight recovered as kernels. RSPO's default is ${formatPercent(extractionAssumptions.kernel, 'en')}. Separate recovery factors determine the CSPKO and CSPKE percentages.`,
        id: `Bagian berat TBS yang menjadi inti sawit. KER default RSPO adalah ${formatPercent(extractionAssumptions.kernel, 'id')}. Faktor pemulihan yang berbeda menentukan persentase CSPKO dan CSPKE.`,
    },
    {
        term: 'CSPKO extraction rate',
        termId: 'Rendemen CSPKO',
        heading: {
            en: 'Conversion to certified palm kernel oil (CSPKO)',
            id: 'Hasil konversi TBS menjadi minyak inti (CSPKO)',
        },
        matches: ['rendemen CSPKO'],
        en: `The FFB-to-kernel-oil factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelOilRecovery, 'en')} oil recovery = ${formatPercent(defaultExtractionRates.cspko, 'en')} of FFB by default.`,
        id: `Faktor TBS menjadi minyak inti: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × hasil minyak ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspko, 'id')} dari TBS secara default.`,
    },
    {
        term: 'CSPKE extraction rate',
        termId: 'Rendemen CSPKE',
        heading: {
            en: 'Conversion to certified palm kernel expeller (CSPKE)',
            id: 'Hasil konversi TBS menjadi bungkil inti (CSPKE)',
        },
        matches: ['rendemen CSPKE'],
        en: `The FFB-to-kernel-expeller factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'en')} expeller recovery = ${formatPercent(defaultExtractionRates.cspke, 'en')} of FFB by default.`,
        id: `Faktor TBS menjadi bungkil inti: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × hasil bungkil ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspke, 'id')} dari TBS secara default.`,
    },
    {
        term: 'Credit price',
        termId: 'Harga kredit',
        heading: {
            en: 'RSPO credit price',
            id: 'Harga kredit RSPO',
        },
        matches: ['harga kredit'],
        en: 'The USD amount per credit. Each credit type has its own price. Placeholders show dated PRISMA reference prices as examples.',
        id: 'Harga dalam USD untuk satu kredit. Setiap jenis kredit memiliki harga sendiri. Placeholder menampilkan contoh harga referensi PRISMA bertanggal.',
    },
    {
        term: 'Premium revenue',
        termId: 'Pendapatan kredit',
        heading: {
            en: 'RSPO credit premium revenue',
            id: 'Pendapatan premium kredit RSPO',
        },
        matches: ['pendapatan kredit'],
        en: 'Credit quantity multiplied by its selling price. Only credits with a price entered contribute to the total.',
        id: 'Jumlah kredit dikalikan harga jualnya. Hanya kredit yang memiliki harga masuk ke total pendapatan.',
    },
    {
        term: 'Added value per kg FFB',
        termId: 'Tambahan pendapatan per kg TBS',
        heading: {
            en: 'Added value per kg of fresh fruit bunches',
            id: 'Tambahan pendapatan per kg Tandan Buah Segar',
        },
        matches: ['tambahan pendapatan per kg TBS'],
        en: 'Credit revenue divided by FFB weight in kg. It shows extra revenue before costs and taxes.',
        id: 'Pendapatan kredit dibagi berat TBS dalam kg. Angka ini menunjukkan tambahan pendapatan sebelum biaya dan pajak.',
    },
    {
        term: 'Exchange rate',
        termId: 'Kurs valuta',
        heading: {
            en: 'Exchange rate per USD',
            id: 'Kurs per USD',
        },
        matches: ['exchange rate', 'exchange rates', 'kurs valuta', 'kurs'],
        en: 'The amount of the chosen currency equal to 1 USD. For IDR, enter rupiah per US dollar.',
        id: 'Jumlah mata uang pilihan yang setara dengan 1 USD. Untuk IDR, masukkan rupiah per USD.',
    },
    {
        term: 'Reference rate',
        termId: 'Kurs referensi',
        heading: {
            en: 'Reference exchange rate',
            id: 'Kurs referensi mata uang',
        },
        matches: ['kurs referensi'],
        en: 'An exchange rate supplied by a source such as Frankfurter. Your bank’s rate and fees may differ.',
        id: 'Kurs dari sumber informasi seperti Frankfurter. Kurs dan biaya dari bank Anda bisa berbeda.',
    },
    {
        term: 'PRISMA',
        termId: 'PRISMA',
        heading: {
            en: 'PRISMA certification and credit-trading platform',
            id: 'Platform sertifikasi dan perdagangan kredit PRISMA',
        },
        matches: ['PRISMA'],
        en: 'RSPO’s platform for certification, traceability, and credit trading.',
        id: 'Platform RSPO untuk sertifikasi, penelusuran produk, dan perdagangan kredit.',
    },
];
const pattern = new RegExp(
    `\\b(${glossaryEntries
        .flatMap((entry) => entry.matches)
        .sort((a, b) => b.length - a.length)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')})\\b`,
    'gi',
);
export function glossaryParts(text: string) {
    const seen = new Set<string>();
    return text.split(pattern).map((part) => {
        const entry = glossaryEntries.find((item) =>
            item.matches.some(
                (alias) => alias.toLowerCase() === part.toLowerCase(),
            ),
        );
        if (!entry || seen.has(entry.term))
            return { text: part, entry: undefined };
        seen.add(entry.term);
        return { text: part, entry };
    });
}
