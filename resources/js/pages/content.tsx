import { Head, router } from '@inertiajs/react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Layout, { canonicalPageUrl } from '@/components/layout';
import GlossaryText from '@/components/glossary-text';
import { glossaryEntries } from '@/glossary';
import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
    type Language,
} from '@/calculator-assumptions';
import { localizedContent } from '@/routes';

type Section = [heading: string, text: string, showRateSource?: boolean];
type ContentPage = { title: string; sections: Section[] };
type ContentSlug = 'faq' | 'terms' | 'privacy';
const conversionExplanation = (language: Language) =>
    `RSPO’s default kernel extraction rate (KER) is ${formatPercent(extractionAssumptions.kernel, language)} of FFB. Kernels yield ${formatPercent(extractionAssumptions.kernelOilRecovery, language)} oil and ${formatPercent(extractionAssumptions.kernelExpellerRecovery, language)} expeller, giving FFB conversion rates of ${formatPercent(defaultExtractionRates.cspko, language)} for CSPKO and ${formatPercent(defaultExtractionRates.cspke, language)} for CSPKE.`;
const indonesianConversionExplanation = () =>
    `Default Kernel Extraction Rate (KER) RSPO adalah ${formatPercent(extractionAssumptions.kernel, 'id')} dari TBS. Inti sawit menghasilkan ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} minyak dan ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} bungkil, sehingga rendemen konversi TBS menjadi CSPKO ${formatPercent(defaultExtractionRates.cspko, 'id')} dan CSPKE ${formatPercent(defaultExtractionRates.cspke, 'id')}.`;

const englishPages: Record<ContentSlug, ContentPage> = {
    faq: {
        title: 'Frequently Asked Questions',
        sections: [
            [
                'Are the prices up to date?',
                'The price cards show a dated PRISMA reference, not live market prices. Check the date on each card and enter your estimated selling price.',
            ],
            [
                'Are the exchange rates up to date?',
                'Frankfurter provides reference rates, not live trading rates. We reuse them for up to one hour and use the last successful result if the service is unavailable. Check the rate date in Settings. Shared links keep their saved rate, and you can enter a rate manually.',
            ],
            [
                'What is the RSPO Credit Calculator?',
                'This tool helps cooperative managers, farmers, and buyers estimate RSPO credit revenue and added value per kilogram of fresh fruit bunches. It is developed by the Research and Development Team at Koperasi Perkebunan Belayan Sejahtera, an RSPO member. It is not an official RSPO calculator, and membership does not imply RSPO endorsement. Results are estimates; check certified volumes, credit eligibility, and buyer terms before selling.',
            ],
            [
                'Why was this tool created?',
                'We created this tool to help farmers, cooperatives, and buyers understand potential RSPO credit revenue. It makes the calculation easier to use and share, so more people can assess the added value of certified production.',
            ],
            [
                'Why are RSPO’s CSPKO and CSPKE extraction rates different?',
                conversionExplanation('en'),
                true,
            ],
            [
                'Can I save a calculator result?',
                'Yes. Use Share to open your device’s sharing options or copy the link if sharing is not supported. The link contains your calculation data. Compression does not encrypt it.',
            ],
        ],
    },
    terms: {
        title: 'Terms of Service',
        sections: [
            [
                'Estimates only',
                'Results are estimates for information and discussion. They are not contracts, quotations, purchase offers, guarantees of income, investment advice, or certification decisions.',
            ],
            [
                'RSPO relationship',
                'This calculator is developed by Koperasi Perkebunan Belayan Sejahtera, an RSPO member. It is not an official RSPO calculator, and membership does not mean RSPO has endorsed it.',
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
        title: 'Privacy Policy',
        sections: [
            [
                'Your calculation data',
                'Your browser remembers calculator inputs in its history so they can be restored when you return to the page. Editing inputs does not send them to our server. Selecting Share creates a link containing compressed inputs. Anyone with that link can read them. Compression is not encryption.',
            ],
            [
                'History and logs',
                'Opening a shared link sends its URL, including the compressed calculation, to our server. Shared URLs may appear in browser history, shared messages, and hosting logs. Hosting systems may also log your IP address and the request time. Calculation inputs are not saved in an application database or browser local storage.',
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
    faq: {
        title: 'Pertanyaan Umum',
        sections: [
            [
                'Apakah harganya terbaru?',
                'Kartu harga menampilkan referensi PRISMA pada tanggal yang tercantum, bukan harga pasar langsung. Periksa tanggal pada kartu dan masukkan perkiraan harga jual Anda.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Frankfurter menyediakan kurs referensi, bukan kurs transaksi langsung. Kurs digunakan kembali hingga satu jam. Jika layanan tidak tersedia, kalkulator memakai hasil terakhir yang berhasil diperoleh. Periksa tanggal kurs di pengaturan. Tautan yang dibagikan mempertahankan kurs tersimpan, dan Anda dapat memasukkan kurs sendiri.',
            ],
            [
                'Apa itu Kalkulator Kredit RSPO?',
                'Alat ini membantu pengurus koperasi, petani, dan pembeli memperkirakan pendapatan kredit RSPO serta nilai tambah per kilogram TBS. Alat ini dikembangkan oleh Tim Riset dan Pengembangan Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Alat ini bukan kalkulator resmi RSPO, dan keanggotaan tersebut tidak berarti RSPO mendukungnya. Hasil hanya perkiraan; pastikan volume tersertifikasi, kelayakan kredit, dan ketentuan pembeli sebelum menjual.',
            ],
            [
                'Mengapa alat ini dibuat?',
                'Kami membuat alat ini untuk membantu petani, koperasi, dan pembeli memahami potensi pendapatan kredit RSPO. Perhitungannya lebih mudah digunakan dan dibagikan agar lebih banyak orang dapat menilai nilai tambah dari produksi bersertifikat.',
            ],
            [
                'Mengapa RSPO memakai rendemen konversi CSPKO dan CSPKE ini?',
                indonesianConversionExplanation(),
                true,
            ],
            [
                'Bagaimana cara menyimpan hasil kalkulator?',
                'Gunakan Bagikan untuk membuka pilihan berbagi di perangkat atau menyalin tautan jika fitur berbagi tidak tersedia. Tautan memuat data perhitungan. Kompresi bukan enkripsi.',
            ],
        ],
    },
    terms: {
        title: 'Ketentuan Penggunaan',
        sections: [
            [
                'Hanya perkiraan',
                'Hasil kalkulator adalah perkiraan untuk informasi dan diskusi. Hasil bukan kontrak, penawaran harga, tawaran pembelian, jaminan pendapatan, saran investasi, atau keputusan sertifikasi.',
            ],
            [
                'Hubungan dengan RSPO',
                'Kalkulator ini dikembangkan oleh Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Kalkulator ini bukan kalkulator resmi RSPO, dan keanggotaan tersebut tidak berarti RSPO mendukungnya.',
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
        title: 'Kebijakan Privasi',
        sections: [
            [
                'Data perhitungan Anda',
                'Browser mengingat input kalkulator di riwayatnya agar dapat dipulihkan saat Anda kembali ke halaman. Mengubah input tidak mengirimkannya ke server kami. Memilih Bagikan membuat tautan berisi input yang dikompresi. Siapa pun yang memiliki tautan tersebut dapat membacanya. Kompresi bukan enkripsi.',
            ],
            [
                'Riwayat dan log',
                'Membuka tautan yang dibagikan mengirim URL beserta perhitungan yang dikompresi ke server kami. URL tersebut dapat muncul di riwayat browser, pesan yang dibagikan, dan log hosting. Sistem hosting juga dapat mencatat alamat IP dan waktu permintaan. Input perhitungan tidak disimpan di basis data aplikasi atau local storage browser.',
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
                  title: lang === 'id' ? 'Glosarium' : 'Glossary',
                  sections: glossaryEntries
                      .slice()
                      .sort((a, b) =>
                          (lang === 'id' ? a.termId : a.term).localeCompare(
                              lang === 'id' ? b.termId : b.term,
                          ),
                      )
                      .map((entry) => [
                          lang === 'id' ? entry.termId : entry.term,
                          entry[lang],
                          [
                              'OER',
                              'KER',
                              'CSPKO extraction rate',
                              'CSPKE extraction rate',
                          ].includes(entry.term),
                      ]),
              }
            : (lang === 'id' ? indonesianPages : englishPages)[slug];
    const path = `/${lang}/${slug}`;
    const url = canonicalPageUrl(path);
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
            path={path}
            description={page.sections[0][1]}
            language={lang}
            onLanguageChange={(language) =>
                router.get(
                    localizedContent.url({ language, page: slug }),
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
                                            color: 'primary.main',
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
                                borderColor: 'primary.dark',
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
                                        color: 'primary.main',
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
                            {page.sections.map(
                                ([heading, text, showRateSource], index) => (
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
                                            sx={{
                                                mb: 2,
                                                lineHeight: 1.35,
                                                color: 'primary.main',
                                            }}
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
                                        {showRateSource && (
                                            <Typography
                                                sx={{ fontSize: 14, mt: 3 }}
                                            >
                                                <Box
                                                    component="a"
                                                    href="https://rspo.org/wp-content/uploads/RSPO-Group-Certification_2022_ENG.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        minHeight: 44,
                                                        color: 'primary.main',
                                                    }}
                                                >
                                                    {lang === 'id'
                                                        ? 'Sumber: standar sertifikasi RSPO'
                                                        : 'Source: RSPO certification standard'}
                                                </Box>
                                            </Typography>
                                        )}
                                    </Box>
                                ),
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
}
