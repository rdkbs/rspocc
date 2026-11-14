import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
} from '@/calculator-assumptions';

export const glossaryEntries = [
    {
        term: 'URL / calculation link',
        termId: 'URL / tautan perhitungan',
        matches: ['URL', 'URLs', 'calculation link', 'tautan perhitungan'],
        en: 'The web address of a calculation. It contains the inputs, so anyone with the link can read them.',
        id: 'Alamat web untuk suatu perhitungan. Tautan ini memuat input, sehingga siapa pun yang memilikinya bisa membacanya.',
    },
    {
        term: 'Frankfurter',
        termId: 'Frankfurter',
        matches: ['Frankfurter'],
        en: 'The source of this calculator’s reference exchange rates. The rates are not live trading quotes.',
        id: 'Sumber kurs referensi kalkulator ini. Kurs tersebut bukan penawaran transaksi langsung.',
    },

    {
        term: 'RSPO',
        termId: 'RSPO',
        matches: ['RSPO'],
        en: 'Roundtable on Sustainable Palm Oil, the organisation that sets the certification standards used here.',
        id: 'Roundtable on Sustainable Palm Oil, organisasi yang menetapkan standar sertifikasi yang digunakan di sini.',
    },
    {
        term: 'FFB / TBS',
        termId: 'TBS / FFB',
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
        matches: ['IS-CSPO', 'IS-CSPKO', 'IS-CSPKE', 'kredit IS'],
        en: 'Independent Smallholder credits come from certified independent smallholders. Their market prices differ from standard credits. This calculator uses IS prices by default.',
        id: 'Kredit Independent Smallholder (IS) berasal dari petani swadaya bersertifikat. Harganya berbeda dari kredit biasa. Kalkulator ini memakai harga IS sebagai default.',
    },
    {
        term: 'CSPO',
        termId: 'CSPO',
        matches: ['CSPO'],
        en: 'Certified Sustainable Palm Oil: oil extracted from the fruit.',
        id: 'Certified Sustainable Palm Oil: minyak sawit bersertifikat yang dihasilkan dari daging buah.',
    },
    {
        term: 'CSPKO',
        termId: 'CSPKO',
        matches: ['CSPKO'],
        en: 'Certified Sustainable Palm Kernel Oil: oil extracted from the kernels inside the fruit.',
        id: 'Certified Sustainable Palm Kernel Oil: minyak inti sawit bersertifikat yang dihasilkan dari inti buah.',
    },
    {
        term: 'CSPKE',
        termId: 'CSPKE',
        matches: ['CSPKE'],
        en: 'Certified Sustainable Palm Kernel Expeller: material left after oil is extracted from the kernels, often used in animal feed.',
        id: 'Certified Sustainable Palm Kernel Expeller: bungkil inti sawit bersertifikat, yaitu sisa setelah minyak inti diambil. Umumnya digunakan untuk pakan ternak.',
    },
    {
        term: 'OER',
        termId: 'OER',
        matches: ['OER'],
        en: `Oil Extraction Rate: the share of FFB weight converted into palm oil. The RSPO default is ${formatPercent(defaultExtractionRates.cspo, 'en')}, or ${(defaultExtractionRates.cspo * 1000) / 100} kg of CSPO per 1,000 kg of FFB.`,
        id: `Oil Extraction Rate: bagian berat TBS yang menjadi minyak sawit. Default RSPO adalah ${formatPercent(defaultExtractionRates.cspo, 'id')}, atau ${(defaultExtractionRates.cspo * 1000) / 100} kg CSPO dari 1.000 kg TBS.`,
    },
    {
        term: 'KER',
        termId: 'KER',
        matches: ['KER'],
        en: `Kernel Extraction Rate: the share of FFB weight recovered as kernels. The RSPO default is ${formatPercent(extractionAssumptions.kernel, 'en')}, not the final CSPKO or CSPKE percentage.`,
        id: `Kernel Extraction Rate: bagian berat TBS yang menjadi inti sawit. Default RSPO adalah ${formatPercent(extractionAssumptions.kernel, 'id')}, bukan persentase akhir CSPKO atau CSPKE.`,
    },
    {
        term: 'CSPKO extraction rate',
        termId: 'Rendemen CSPKO',
        matches: ['rendemen CSPKO'],
        en: `The FFB-to-kernel-oil factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelOilRecovery, 'en')} oil recovery = ${formatPercent(defaultExtractionRates.cspko, 'en')} of FFB by default.`,
        id: `Faktor TBS menjadi minyak inti: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × hasil minyak ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspko, 'id')} dari TBS secara default.`,
    },
    {
        term: 'CSPKE extraction rate',
        termId: 'Rendemen CSPKE',
        matches: ['rendemen CSPKE'],
        en: `The FFB-to-kernel-expeller factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'en')} expeller recovery = ${formatPercent(defaultExtractionRates.cspke, 'en')} of FFB by default.`,
        id: `Faktor TBS menjadi bungkil inti: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × hasil bungkil ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspke, 'id')} dari TBS secara default.`,
    },
    {
        term: 'Credit price',
        termId: 'Harga kredit',
        matches: ['harga kredit'],
        en: 'The USD amount per credit. Each credit type has its own price. Defaults are a dated PRISMA snapshot, not live quotes.',
        id: 'Harga dalam USD untuk satu kredit. Setiap jenis kredit memiliki harga sendiri. Harga default berasal dari catatan PRISMA bertanggal, bukan harga langsung.',
    },
    {
        term: 'Premium revenue',
        termId: 'Pendapatan kredit',
        matches: ['pendapatan kredit'],
        en: 'Credit quantity multiplied by its selling price. Only selected credits contribute to the total.',
        id: 'Jumlah kredit dikalikan harga jualnya. Hanya kredit yang dicentang masuk ke total pendapatan.',
    },
    {
        term: 'Added value per kg FFB',
        termId: 'Tambahan pendapatan per kg TBS',
        matches: ['tambahan pendapatan per kg TBS'],
        en: 'Credit revenue divided by FFB weight in kg. This is extra revenue before costs and taxes, not net profit.',
        id: 'Pendapatan kredit dibagi berat TBS dalam kg. Ini tambahan pendapatan sebelum biaya dan pajak, bukan laba bersih.',
    },
    {
        term: 'Exchange rate',
        termId: 'Kurs valuta',
        matches: ['exchange rate', 'exchange rates', 'kurs valuta', 'kurs'],
        en: 'The amount of the chosen currency equal to 1 USD. For IDR, enter rupiah per US dollar.',
        id: 'Jumlah mata uang pilihan yang setara dengan 1 USD. Untuk IDR, masukkan rupiah per dolar AS.',
    },
    {
        term: 'Reference rate',
        termId: 'Kurs referensi',
        matches: ['kurs referensi'],
        en: 'An exchange rate supplied by a source such as Frankfurter. Your bank’s rate and fees may differ.',
        id: 'Kurs dari sumber informasi seperti Frankfurter. Kurs dan biaya dari bank Anda bisa berbeda.',
    },
    {
        term: 'PRISMA',
        termId: 'PRISMA',
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
