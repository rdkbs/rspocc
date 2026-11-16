import { Head, router } from '@inertiajs/react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Layout, { canonicalPageUrl } from '@/components/layout';
import GlossaryText from '@/components/glossary-text';
import { glossaryEntries } from '@/glossary';
import {
    defaultExtractionRates,
    defaultPriceReference,
    extractionAssumptions,
    formatPercent,
    type Language,
} from '@/calculator-assumptions';
import { about, faq, glossary, guide, privacy, terms } from '@/routes';

type Section = [heading: string, text: string];
type ContentPage = { title: string; sections: Section[] };
type ContentSlug = 'guide' | 'faq' | 'about' | 'terms' | 'privacy';
const contentRoutes = {
    guide,
    faq,
    about,
    terms,
    privacy,
    glossary,
} satisfies Record<ContentSlug | 'glossary', { url: typeof guide.url }>;

const priceList = (language: Language) => {
    const locale = language === 'id' ? 'id-ID' : 'en-US';
    const price = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (['is', 'standard'] as const)
        .map((kind) => {
            const label =
                kind === 'is'
                    ? 'IS'
                    : language === 'id'
                      ? 'Standar'
                      : 'Standard';
            const prices = (['cspo', 'cspko', 'cspke'] as const)
                .map(
                    (credit) =>
                        `${credit.toUpperCase()} USD ${price.format(defaultPriceReference.prices[kind][credit])}`,
                )
                .join(', ');

            return `${label}: ${prices}`;
        })
        .join('; ');
};
const checkedOn = (language: Language) =>
    new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'long',
        timeZone: 'UTC',
    }).format(new Date(`${defaultPriceReference.checkedOn}T00:00:00Z`));
const conversionRates = (language: Language) =>
    `CSPO ${formatPercent(defaultExtractionRates.cspo, language)}, CSPKO ${formatPercent(defaultExtractionRates.cspko, language)}, and CSPKE ${formatPercent(defaultExtractionRates.cspke, language)}`;
const conversionExplanation = (language: Language) =>
    `RSPO’s default kernel extraction rate (KER) is ${formatPercent(extractionAssumptions.kernel, language)} of FFB. Kernels yield ${formatPercent(extractionAssumptions.kernelOilRecovery, language)} oil and ${formatPercent(extractionAssumptions.kernelExpellerRecovery, language)} expeller, giving FFB conversion rates of ${formatPercent(defaultExtractionRates.cspko, language)} for CSPKO and ${formatPercent(defaultExtractionRates.cspke, language)} for CSPKE.`;
const indonesianConversionExplanation = () =>
    `Default Kernel Extraction Rate (KER) RSPO adalah ${formatPercent(extractionAssumptions.kernel, 'id')} dari TBS. Inti sawit menghasilkan ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} minyak dan ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} bungkil, sehingga rendemen konversi TBS menjadi CSPKO ${formatPercent(defaultExtractionRates.cspko, 'id')} dan CSPKE ${formatPercent(defaultExtractionRates.cspke, 'id')}.`;
const priceSnapshot = {
    en: `No. The optional preset cards show ${defaultPriceReference.source} last-traded prices for ${defaultPriceReference.period}, checked on ${checkedOn('en')}: ${priceList('en')}. Select a card to fill the fields, then adjust them to your agreed selling prices.`,
    id: `Tidak. Kartu preset menampilkan harga transaksi terakhir ${defaultPriceReference.source} untuk ${defaultPriceReference.period}, diperiksa ${checkedOn('id')}: ${priceList('id')}. Pilih kartu untuk mengisi kolom, lalu sesuaikan dengan harga jual yang disepakati.`,
};

const englishPages: Record<ContentSlug, ContentPage> = {
    guide: {
        title: 'RSPO Credit Calculator guide',
        sections: [
            [
                '1. Enter FFB volume',
                'Enter FFB weight in kg or tonnes. One tonne equals 1,000\u00a0kg.',
            ],
            [
                '2. Enter credit prices',
                'Enter your USD price for each credit you sell. Leave other credit prices blank. You can select a dated PRISMA price card above the fields, then edit the prices.',
            ],
            [
                '3. Read the estimate',
                'The results show credit revenue in USD and your chosen currency, plus the extra revenue per kg of FFB. Product volumes remain visible when a price is blank. Costs and taxes are not included.',
            ],
            [
                '4. Change rates if needed',
                `Open Rates below the prices to change extraction rates or currency. The default FFB conversion rates are ${conversionRates('en')}. Use different rates only when supported by evidence and verified by your auditor.`,
            ],
            [
                'Calculator exchange-rate source',
                'New calculations use Frankfurter reference rates. You can enter a different rate. If the service is unavailable, the calculator uses the last successful rate. Shared links keep their saved rate. The source and rate date appear below the field.',
            ],
            [
                'Save or share a calculator result',
                'Use Share to open your device’s sharing options, such as WhatsApp. If your browser does not support sharing, the button copies the link. Anyone with the link can read your inputs, prices, currency, and language.',
            ],
            [
                'Before selling RSPO credits',
                'Check your certified volumes, eligible credits, prices, fees, and buyer terms. This calculator does not certify products or confirm how many credits you may sell.',
            ],
        ],
    },
    faq: {
        title: 'RSPO Credit Calculator FAQ',
        sections: [
            ['Are these credit prices current?', priceSnapshot.en],
            [
                'What exchange-rate source does the calculator use?',
                'Frankfurter provides reference rates from central banks and official sources. We reuse rates for one hour and keep the last successful result if the service is unavailable. You can enter a rate manually. Saved links keep their original rate.',
            ],
            [
                'Are fees and taxes for RSPO credits included?',
                'No. The estimate is revenue before fees, taxes, certification costs, and other deductions.',
            ],
            [
                'Why are RSPO’s CSPKO and CSPKE extraction rates different?',
                conversionExplanation('en'),
            ],
            [
                'Does this calculator certify products?',
                'No. It does not issue credits, verify certification, or confirm the number of credits you can sell.',
            ],
            [
                'Can I save a calculator result?',
                'Yes. Use Share to open your device’s sharing options or copy the link if sharing is not supported. The link contains your calculation data. Compression does not encrypt it.',
            ],
            [
                'Is this RSPO credit estimate a sales agreement?',
                'No. Confirm credit eligibility and commercial terms with your certification body and buyer. The result is an estimate, not a binding offer.',
            ],
        ],
    },
    about: {
        title: 'About Koperasi Belayan Sejahtera',
        sections: [
            [
                'Vision for the Belayan community',
                'To lead a sustainable community-based economy that improves well-being across the Belayan River region and strengthens the welfare of cooperative members.',
            ],
            [
                'Belayan Sejahtera’s mission',
                'Belayan Sejahtera works to improve member welfare and infrastructure, apply community-based economic principles, support sustainable certification and environmentally responsible farming, adopt technology, develop its businesses, and build closer partnerships with government and others.',
            ],
            [
                'The RSPO Credit Calculator',
                'This tool helps cooperative managers, farmers, and buyers estimate RSPO credit revenue from FFB volume. Confirm production data, certification eligibility, and buyer terms before making a decision. It is not affiliated with or endorsed by RSPO.',
            ],
        ],
    },
    terms: {
        title: 'Terms for the RSPO Credit Calculator',
        sections: [
            [
                'Estimates only',
                'Results are estimates for information and discussion. They are not contracts, quotations, purchase offers, guarantees of income, investment advice, or certification decisions.',
            ],
            [
                'Calculator input requirements',
                'You are responsible for your inputs. Verify extraction rates, exchange rates, prices, eligible credit volumes, certification requirements, and applicable legal and commercial obligations.',
            ],
            [
                'Costs and limitations',
                'The calculator includes only credits with prices entered and excludes fees, taxes, certification costs, and other deductions. Actual revenue may differ. We provide no warranty of accuracy, availability, or suitability, to the extent permitted by law.',
            ],
            [
                'Shared calculator links',
                'Anyone with a calculation link can read its inputs. Keep personal and confidential information out of shared links. Future changes to the calculator may affect how results are interpreted.',
            ],
        ],
    },
    privacy: {
        title: 'Privacy for the RSPO Credit Calculator',
        sections: [
            [
                'Your calculation data',
                'Your inputs are stored in the URL, not in an application database or browser local storage. Anyone with the link can read them. Compression is not encryption.',
            ],
            [
                'History and logs',
                'Calculation URLs may appear in browser history, shared messages, and hosting logs. Changing an input sends the URL to our server. Hosting systems may log the URL, your IP address, and the request time.',
            ],
            [
                'Exchange-rate requests',
                'Our server asks Frankfurter for public USD/IDR and USD/MYR rates. It does not send your harvest volume, credit prices, or other calculation inputs to Frankfurter. We keep public rates and their update time.',
            ],
            [
                'Sharing calculator links',
                'Share opens your device’s sharing options. If sharing is unavailable, the button copies the URL to your clipboard. The app you choose applies its own privacy terms.',
            ],
            [
                'Calculator preferences and cookies',
                'The theme setting stays in memory for the current page. Laravel may use session and security cookies. These cookies do not store your calculations.',
            ],
        ],
    },
};

const indonesianPages: Record<ContentSlug, ContentPage> = {
    guide: {
        title: 'Panduan Kalkulator Kredit RSPO',
        sections: [
            [
                '1. Masukkan volume TBS',
                'Masukkan berat TBS dalam kg atau ton. Satu ton sama dengan 1.000\u00a0kg.',
            ],
            [
                '2. Masukkan harga kredit',
                'Masukkan harga USD untuk setiap kredit yang dijual. Kosongkan harga kredit lainnya. Pilih kartu referensi harga PRISMA bertanggal di atas kolom, lalu sesuaikan harganya.',
            ],
            [
                '3. Baca perkiraan',
                'Hasil menampilkan pendapatan kredit dalam USD dan mata uang pilihan, serta tambahan pendapatan per kg TBS. Volume produk tetap terlihat jika harga dikosongkan. Biaya dan pajak belum termasuk.',
            ],
            [
                '4. Ubah rendemen bila perlu',
                `Buka Kurs & rendemen di bawah harga untuk mengubah rendemen atau mata uang. Rendemen konversi default TBS adalah CSPO ${formatPercent(defaultExtractionRates.cspo, 'id')}, CSPKO ${formatPercent(defaultExtractionRates.cspko, 'id')}, dan CSPKE ${formatPercent(defaultExtractionRates.cspke, 'id')}. Gunakan nilai lain jika ada bukti dan telah diverifikasi auditor.`,
            ],
            [
                'Sumber kurs kalkulator',
                'Perhitungan baru menggunakan kurs referensi Frankfurter. Anda dapat memasukkan kurs lain. Jika layanan tidak tersedia, kalkulator memakai kurs terakhir yang berhasil diambil. Tautan yang dibagikan menyimpan kurs saat tautan dibuat. Sumber dan tanggal kurs tampil di bawah kolom.',
            ],
            [
                'Simpan atau bagikan hasil kalkulator',
                'Gunakan Bagikan untuk membuka pilihan berbagi di perangkat, seperti WhatsApp. Jika browser tidak mendukung fitur berbagi, tombol akan menyalin tautan. Siapa pun yang memiliki tautan dapat membaca input, harga, mata uang, dan bahasa Anda.',
            ],
            [
                'Sebelum menjual kredit RSPO',
                'Periksa volume bersertifikat, kredit yang memenuhi syarat, harga, biaya, dan ketentuan pembeli. Kalkulator ini tidak mensertifikasi produk atau memastikan jumlah kredit yang dapat dijual.',
            ],
        ],
    },
    faq: {
        title: 'FAQ Kalkulator Kredit RSPO',
        sections: [
            ['Apakah harga kredit ini terkini?', priceSnapshot.id],
            [
                'Sumber kurs apa yang digunakan kalkulator?',
                'Frankfurter menyediakan kurs referensi dari bank sentral dan sumber resmi. Kalkulator memakai kembali kurs selama satu jam dan menyimpan hasil terakhir yang berhasil jika layanan tidak tersedia. Anda dapat memasukkan kurs sendiri. Tautan yang disimpan mempertahankan kursnya.',
            ],
            [
                'Apakah biaya dan pajak kredit RSPO sudah termasuk?',
                'Belum. Perkiraan ini adalah pendapatan sebelum biaya, pajak, biaya sertifikasi, dan potongan lainnya.',
            ],
            [
                'Mengapa RSPO memakai rendemen konversi CSPKO dan CSPKE ini?',
                indonesianConversionExplanation(),
            ],
            [
                'Apakah kalkulator ini mensertifikasi produk?',
                'Tidak. Kalkulator tidak menerbitkan kredit, memverifikasi sertifikasi, atau memastikan jumlah kredit yang dapat dijual.',
            ],
            [
                'Bagaimana cara menyimpan hasil kalkulator?',
                'Gunakan Bagikan untuk membuka pilihan berbagi di perangkat atau menyalin tautan jika fitur berbagi tidak tersedia. Tautan memuat data perhitungan. Kompresi bukan enkripsi.',
            ],
            [
                'Apakah perkiraan kredit RSPO ini merupakan perjanjian jual beli?',
                'Bukan. Pastikan kelayakan kredit dan ketentuan komersial kepada lembaga sertifikasi dan pembeli. Hasil ini hanya perkiraan, bukan penawaran yang mengikat.',
            ],
        ],
    },
    about: {
        title: 'Tentang Koperasi Belayan Sejahtera',
        sections: [
            [
                'Visi untuk masyarakat Belayan',
                'Menjadi penggerak ekonomi kerakyatan yang berkelanjutan untuk meningkatkan kesejahteraan masyarakat di dataran Sungai Belayan dan anggota koperasi.',
            ],
            [
                'Misi Koperasi Belayan Sejahtera',
                'Belayan Sejahtera berupaya meningkatkan kesejahteraan anggota dan infrastruktur, menerapkan prinsip ekonomi kerakyatan, mendukung sertifikasi berkelanjutan dan pertanian ramah lingkungan, mengadopsi teknologi dan digitalisasi, mengembangkan unit usaha, serta mempererat kerja sama dengan pemerintah dan pihak lain.',
            ],
            [
                'Kalkulator Kredit RSPO',
                'Alat ini membantu pengurus koperasi, petani, dan pembeli memperkirakan pendapatan kredit RSPO dari volume TBS. Pastikan data produksi, kelayakan sertifikasi, dan ketentuan pembeli sebelum mengambil keputusan. Alat ini tidak berafiliasi dengan atau didukung oleh RSPO.',
            ],
        ],
    },
    terms: {
        title: 'Ketentuan Kalkulator Kredit RSPO',
        sections: [
            [
                'Hanya perkiraan',
                'Hasil kalkulator adalah perkiraan untuk informasi dan diskusi. Hasil bukan kontrak, penawaran harga, tawaran pembelian, jaminan pendapatan, saran investasi, atau keputusan sertifikasi.',
            ],
            [
                'Tanggung jawab input kalkulator',
                'Anda bertanggung jawab atas input yang dimasukkan. Periksa rendemen, kurs, harga, volume kredit yang memenuhi syarat, persyaratan sertifikasi, serta kewajiban hukum dan komersial yang berlaku.',
            ],
            [
                'Biaya dan batasan',
                'Kalkulator hanya menghitung kredit yang memiliki harga dan tidak memasukkan biaya, pajak, biaya sertifikasi, atau potongan lainnya. Pendapatan sebenarnya dapat berbeda. Sejauh diizinkan oleh hukum, kami tidak menjamin akurasi, ketersediaan, atau kesesuaian hasil.',
            ],
            [
                'Tautan kalkulator yang dibagikan',
                'Siapa pun yang memiliki tautan perhitungan dapat membaca inputnya. Jangan masukkan informasi pribadi atau rahasia ke tautan yang dibagikan. Perubahan kalkulator di masa mendatang dapat memengaruhi penafsiran hasil.',
            ],
        ],
    },
    privacy: {
        title: 'Privasi Kalkulator Kredit RSPO',
        sections: [
            [
                'Data perhitungan Anda',
                'Input disimpan di URL, bukan di basis data aplikasi atau penyimpanan lokal browser. Siapa pun yang memiliki tautan dapat membacanya. Kompresi bukan enkripsi.',
            ],
            [
                'Riwayat dan log',
                'URL perhitungan dapat muncul di riwayat browser, pesan yang dibagikan, dan log hosting. Perubahan input mengirim URL ke server kami. Sistem hosting dapat mencatat URL, alamat IP, dan waktu permintaan.',
            ],
            [
                'Permintaan kurs valuta',
                'Server kami meminta kurs publik USD/IDR dan USD/MYR dari Frankfurter. Server tidak mengirim volume panen, harga kredit, atau input perhitungan lainnya ke Frankfurter. Kami menyimpan kurs publik dan waktu pembaruannya.',
            ],
            [
                'Membagikan tautan kalkulator',
                'Bagikan membuka pilihan berbagi di perangkat. Jika fitur berbagi tidak tersedia, tombol akan menyalin URL ke clipboard. Aplikasi yang Anda pilih memiliki ketentuan privasinya sendiri.',
            ],
            [
                'Preferensi kalkulator dan cookie',
                'Pengaturan tema hanya tersimpan selama halaman dibuka. Laravel dapat menggunakan cookie sesi dan keamanan. Cookie tersebut tidak menyimpan data perhitungan.',
            ],
        ],
    },
};

export default function Content({
    slug,
    lang,
}: {
    slug: ContentSlug | 'glossary';
    lang: 'id' | 'en';
}) {
    const page: ContentPage =
        slug === 'glossary'
            ? {
                  title:
                      lang === 'id'
                          ? 'Glosarium Kredit RSPO'
                          : 'RSPO credit glossary',
                  sections: glossaryEntries
                      .slice()
                      .sort((a, b) =>
                          (lang === 'id' ? a.termId : a.term).localeCompare(
                              lang === 'id' ? b.termId : b.term,
                          ),
                      )
                      .map((entry) => [
                          entry.heading?.[lang] ??
                              (lang === 'id' ? entry.termId : entry.term),
                          entry[lang],
                      ]),
              }
            : (lang === 'id' ? indonesianPages : englishPages)[slug];
    const url = canonicalPageUrl(`/${slug}`, lang);
    const structured =
        slug === 'faq'
            ? {
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  url,
                  mainEntity: page.sections.map(([question, answer]) => ({
                      '@type': 'Question',
                      name: question,
                      acceptedAnswer: { '@type': 'Answer', text: answer },
                  })),
              }
            : {
                  '@context': 'https://schema.org',
                  '@type': 'Article',
                  headline: page.title,
                  url,
                  author: {
                      '@type': 'Organization',
                      name: 'Koperasi Perkebunan Belayan Sejahtera',
                  },
              };
    return (
        <Layout
            title={page.title}
            path={`/${slug}`}
            description={page.sections[0][1]}
            language={lang}
            onLanguageChange={(language) =>
                router.get(
                    contentRoutes[slug].url({ query: { lang: language } }),
                    {},
                    { preserveScroll: true },
                )
            }
        >
            <Head>
                <script type="application/ld+json">
                    {JSON.stringify(structured)}
                </script>
            </Head>
            <Box component="section" aria-labelledby="content-title" data-enter>
                <Box component="article" className="wrap">
                    <Box
                        className="hero-text"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: { xs: 4, md: 6 },
                            mb: { xs: 4, md: 6 },
                        }}
                    >
                        <Typography
                            variant="h1"
                            id="content-title"
                            sx={{
                                fontSize: { xs: '2.5rem', md: '3.75rem' },
                                maxWidth: 820,
                                color: 'primary.main',
                            }}
                        >
                            {page.title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                md: '250px minmax(0, 1fr)',
                            },
                            gap: { xs: 2, md: 8 },
                            alignItems: 'start',
                        }}
                    >
                        <Box
                            component="details"
                            sx={{
                                display: { xs: 'block', md: 'none' },
                                borderBottom: 1,
                                borderColor: 'divider',
                                pb: 1,
                            }}
                        >
                            <Box
                                component="summary"
                                sx={{
                                    minHeight: 48,
                                    py: 1.5,
                                    cursor: 'pointer',
                                    color: 'text.secondary',
                                    fontSize: 16,
                                    fontWeight: 600,
                                }}
                            >
                                {lang === 'id'
                                    ? 'Di halaman ini'
                                    : 'On this page'}
                            </Box>
                            <Box
                                component="nav"
                                aria-label={
                                    lang === 'id'
                                        ? 'Isi halaman'
                                        : 'Page contents'
                                }
                            >
                                {page.sections.map(([heading], index) => (
                                    <Box
                                        component="a"
                                        key={heading}
                                        href={`#section-${index + 1}`}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            minHeight: 44,
                                            py: 1,
                                            color: 'text.primary',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {heading}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <Box
                            component="nav"
                            aria-label={
                                lang === 'id' ? 'Isi halaman' : 'Page contents'
                            }
                            sx={{
                                display: { xs: 'none', md: 'block' },
                                position: { md: 'sticky' },
                                top: 32,
                                borderLeft: 2,
                                borderColor: 'primary.main',
                                pl: 3,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    color: 'text.secondary',
                                    mb: 1.5,
                                }}
                            >
                                {lang === 'id'
                                    ? 'Di halaman ini'
                                    : 'On this page'}
                            </Typography>
                            {page.sections.map(([heading], index) => (
                                <Box
                                    component="a"
                                    key={heading}
                                    href={`#section-${index + 1}`}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        minHeight: 44,
                                        maxWidth: 280,
                                        fontSize: 15,
                                        lineHeight: 1.5,
                                        py: 1,
                                        textDecoration: 'none',
                                        color: 'text.primary',
                                        '&:hover': {
                                            color: 'primary.main',
                                            textDecoration: 'underline',
                                        },
                                    }}
                                >
                                    {heading}
                                </Box>
                            ))}
                        </Box>
                        <Box
                            sx={{
                                gridColumn: { xs: '1', md: '2' },
                                minWidth: 0,
                            }}
                        >
                            {page.sections.map(([heading, text], index) => (
                                <Box
                                    component="section"
                                    id={`section-${index + 1}`}
                                    key={heading}
                                    sx={{
                                        pb: 4,
                                        mb: 4,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        scrollMarginTop: 32,
                                    }}
                                >
                                    <Typography
                                        component="h2"
                                        variant="h5"
                                        sx={{ mb: 2, lineHeight: 1.35 }}
                                    >
                                        {heading}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{
                                            lineHeight: 1.85,
                                            fontSize: { xs: 17, md: 18 },
                                        }}
                                    >
                                        <GlossaryText language={lang}>
                                            {text}
                                        </GlossaryText>
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    {(slug === 'guide' ||
                        slug === 'faq' ||
                        slug === 'glossary') && (
                        <Typography sx={{ fontSize: 14, mt: 3 }}>
                            <Box
                                component="a"
                                href="https://rspo.org/wp-content/uploads/RSPO-Group-Certification_2022_ENG.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    minHeight: 44,
                                }}
                            >
                                {lang === 'id'
                                    ? 'Rendemen RSPO (bagian 1.3)'
                                    : 'RSPO extraction rates (section 1.3)'}
                            </Box>
                        </Typography>
                    )}
                </Box>
            </Box>
        </Layout>
    );
}
