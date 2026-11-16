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
};

export const glossaryEntries: GlossaryEntry[] = [
    {
        term: 'URL / calculation link',
        termId: 'URL / tautan perhitungan',
        matches: ['URL', 'URLs', 'calculation link', 'tautan perhitungan'],
        en: 'URL stands for Uniform Resource Locator. It is the web address of a calculation. It contains the inputs, so anyone with the link can read them.',
        id: 'URL adalah singkatan dari Uniform Resource Locator, yaitu alamat web untuk suatu perhitungan. Tautan ini memuat input, sehingga siapa pun yang memilikinya bisa membacanya.',
    },
    {
        term: 'Frankfurter',
        termId: 'Frankfurter',
        matches: ['Frankfurter'],
        en: 'Provides the calculator’s reference exchange rates. These are not live trading quotes.',
        id: 'Sumber kurs referensi kalkulator ini. Kurs ini merupakan acuan, bukan kurs jual atau beli yang ditawarkan bank.',
    },

    {
        term: 'RSPO',
        termId: 'RSPO',
        matches: ['RSPO'],
        en: 'RSPO stands for Roundtable on Sustainable Palm Oil, the organization that sets the certification standards used here.',
        id: 'RSPO adalah singkatan dari Roundtable on Sustainable Palm Oil, organisasi yang menetapkan standar sertifikasi yang digunakan di kalkulator ini.',
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
        id: 'Kredit Independent Smallholder (IS) berasal dari petani swadaya bersertifikat. Harganya berbeda dari kredit biasa. Kalkulator menyediakan referensi harga untuk kredit IS.',
    },
    {
        term: 'CSPO',
        termId: 'CSPO',
        matches: ['CSPO'],
        en: 'CSPO stands for Certified Sustainable Palm Oil. It is certified palm oil extracted from the fruit.',
        id: 'CSPO adalah singkatan dari Certified Sustainable Palm Oil, yaitu minyak sawit berkelanjutan bersertifikat dari daging buah.',
    },
    {
        term: 'CSPKO',
        termId: 'CSPKO',
        matches: ['CSPKO'],
        en: 'CSPKO stands for Certified Sustainable Palm Kernel Oil. It is certified oil extracted from palm kernels.',
        id: 'CSPKO adalah singkatan dari Certified Sustainable Palm Kernel Oil, yaitu minyak inti sawit berkelanjutan bersertifikat.',
    },
    {
        term: 'CSPKE',
        termId: 'CSPKE',
        matches: ['CSPKE'],
        en: 'CSPKE stands for Certified Sustainable Palm Kernel Expeller. It is the certified material left after oil is extracted from palm kernels. It is often used in animal feed.',
        id: 'CSPKE adalah singkatan dari Certified Sustainable Palm Kernel Expeller, yaitu bungkil inti sawit berkelanjutan bersertifikat yang tersisa setelah minyak diambil. Bahan ini sering digunakan untuk pakan ternak.',
    },
    {
        term: 'OER',
        termId: 'OER',
        matches: ['OER'],
        en: `OER stands for Oil Extraction Rate, the share of FFB weight converted into palm oil. The RSPO default is ${formatPercent(defaultExtractionRates.cspo, 'en')}, or ${(defaultExtractionRates.cspo * 1000) / 100} kg of CSPO per 1,000 kg of FFB.`,
        id: `OER adalah singkatan dari Oil Extraction Rate, yaitu persentase berat TBS yang menjadi minyak sawit. Nilai acuan RSPO adalah ${formatPercent(defaultExtractionRates.cspo, 'id')}, atau ${(defaultExtractionRates.cspo * 1000) / 100} kg CSPO dari 1.000 kg TBS.`,
    },
    {
        term: 'KER',
        termId: 'KER',
        matches: ['KER'],
        en: `KER stands for Kernel Extraction Rate, the share of FFB weight recovered as kernels. RSPO's default is ${formatPercent(extractionAssumptions.kernel, 'en')}. Separate recovery factors determine the CSPKO and CSPKE percentages.`,
        id: `KER adalah singkatan dari Kernel Extraction Rate, yaitu persentase berat TBS yang menjadi inti sawit. Nilai acuan KER dari RSPO adalah ${formatPercent(extractionAssumptions.kernel, 'id')}. Persentase minyak dan bungkil yang dihasilkan dari inti sawit menentukan rendemen CSPKO dan CSPKE.`,
    },
    {
        term: 'CSPKO extraction rate',
        termId: 'Rendemen CSPKO',
        matches: ['rendemen CSPKO'],
        en: `The FFB-to-kernel-oil factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelOilRecovery, 'en')} oil recovery = ${formatPercent(defaultExtractionRates.cspko, 'en')} of FFB by default.`,
        id: `Rendemen minyak inti dari TBS dihitung sebagai berikut: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × minyak yang dihasilkan ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspko, 'id')} dari berat TBS.`,
    },
    {
        term: 'CSPKE extraction rate',
        termId: 'Rendemen CSPKE',
        matches: ['rendemen CSPKE'],
        en: `The FFB-to-kernel-expeller factor: ${formatPercent(extractionAssumptions.kernel, 'en')} KER × ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'en')} expeller recovery = ${formatPercent(defaultExtractionRates.cspke, 'en')} of FFB by default.`,
        id: `Rendemen bungkil inti dari TBS dihitung sebagai berikut: KER ${formatPercent(extractionAssumptions.kernel, 'id')} × bungkil yang dihasilkan ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} = ${formatPercent(defaultExtractionRates.cspke, 'id')} dari berat TBS.`,
    },
    {
        term: 'Credit price',
        termId: 'Harga kredit',
        matches: ['harga kredit'],
        en: 'The USD amount per credit. Each credit type has its own price. Placeholders show dated PRISMA reference prices as examples.',
        id: 'Harga dalam USD untuk satu kredit. Setiap jenis kredit memiliki harga sendiri. Kartu harga menampilkan data acuan PRISMA beserta tanggalnya.',
    },
    {
        term: 'Premium revenue',
        termId: 'Pendapatan kredit',
        matches: ['pendapatan kredit'],
        en: 'Credit quantity multiplied by its selling price. Only credits with a price entered contribute to the total.',
        id: 'Jumlah kredit dikalikan harga jualnya. Total pendapatan hanya mencakup jenis kredit yang harganya diisi.',
    },
    {
        term: 'Added value per kg FFB',
        termId: 'Tambahan pendapatan per kg TBS',
        matches: ['tambahan pendapatan per kg TBS'],
        en: 'Credit revenue divided by FFB weight in kg. It shows extra revenue before costs and taxes.',
        id: 'Pendapatan kredit dibagi berat TBS dalam kg. Angka ini menunjukkan tambahan pendapatan sebelum biaya dan pajak.',
    },
    {
        term: 'Exchange rate',
        termId: 'Kurs mata uang',
        matches: ['exchange rate', 'exchange rates', 'kurs valuta', 'kurs'],
        en: 'The amount of the chosen currency equal to 1 USD. For IDR, enter rupiah per US dollar.',
        id: 'Nilai 1 USD dalam mata uang yang Anda pilih. Untuk IDR, masukkan rupiah per USD.',
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
