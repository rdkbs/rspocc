import { Head, router } from '@inertiajs/react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Layout, { useCanonicalPageUrl } from '@/components/layout';
import GlossaryText from '@/components/glossary-text';
import { glossaryEntries } from '@/glossary';
import {
    defaultExtractionRates,
    extractionAssumptions,
    formatPercent,
    type Language,
} from '@/calculator-assumptions';
import { localizedContent } from '@/routes';

type Section = [
    heading: string,
    text: string,
    showRateSource?: boolean,
    sourceUrl?: string,
];
type ContentPage = { title: string; sections: Section[] };
type ContentSlug = 'faq' | 'terms' | 'privacy';
const conversionExplanation = (language: Language) =>
    `RSPO’s default kernel extraction rate (KER) is ${formatPercent(extractionAssumptions.kernel, language)} of FFB. Kernels yield ${formatPercent(extractionAssumptions.kernelOilRecovery, language)} oil and ${formatPercent(extractionAssumptions.kernelExpellerRecovery, language)} expeller, giving FFB conversion rates of ${formatPercent(defaultExtractionRates.cspko, language)} for CSPKO and ${formatPercent(defaultExtractionRates.cspke, language)} for CSPKE.`;
const indonesianConversionExplanation = () =>
    `RSPO menetapkan rendemen inti sawit (Kernel Extraction Rate atau KER) sebesar ${formatPercent(extractionAssumptions.kernel, 'id')} dari TBS. Inti sawit menghasilkan ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} minyak dan ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} bungkil. Dengan demikian, rendemen dari TBS adalah CSPKO ${formatPercent(defaultExtractionRates.cspko, 'id')} dan CSPKE ${formatPercent(defaultExtractionRates.cspke, 'id')}.`;

const englishPages: Record<ContentSlug, ContentPage> = {
    faq: {
        title: 'Frequently Asked Questions',
        sections: [
            [
                'What is the RSPO Credit Calculator?',
                'This calculator estimates RSPO credit revenue and added value per kilogram of fresh fruit bunches from the volume and credit prices you enter. It is developed by the Research and Development Team at Koperasi Perkebunan Belayan Sejahtera, an RSPO member. It is not an official RSPO calculator, and membership does not imply RSPO endorsement.',
            ],
            [
                'Why was this tool created?',
                'We want to help farmers, cooperatives, buyers, and Internal Control System (ICS) teams understand the potential additional revenue from RSPO credits. ICS teams can compare this estimate with certification costs to assess whether the benefits are worth the expense.',
            ],
            [
                'Are the credit prices up to date?',
                'We check PRISMA daily for the latest selling price of each credit type. The price stays the same until a newer sale is recorded. The date shown tells you when we checked the data, not when the sale took place.',
            ],
            [
                'Are the exchange rates up to date?',
                'We use exchange rates from Frankfurter. Check the date beside the rate in Settings to see how recent it is. You can also enter your own rate. A shared calculation keeps the rate used when it was shared.',
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
                'Error monitoring',
                'We use Sentry to detect and diagnose application errors. Sentry processes error reports and diagnostic logs on our behalf. These may include error messages, technical details, request URLs, and request times. If an error involves a shared calculation link, its compressed inputs may appear in the report. Avoid sharing links containing information you consider confidential.',
                false,
                'https://sentry.io/privacy/',
            ],
            [
                'Exchange-rate requests',
                'Our server asks Frankfurter for public USD/IDR, USD/MYR, USD/CNY, USD/EUR, and USD/SGD rates. It does not send your harvest volume, credit prices, or other calculation inputs to Frankfurter. We keep public rates and their update time.',
            ],
            [
                'Sharing calculator links',
                'Share opens your device’s sharing options. If sharing is unavailable, the button copies the URL to your clipboard. The app you choose applies its own privacy terms.',
            ],
            [
                'Calculator preferences and cookies',
                'Your browser saves your light or dark theme choice for future visits. It keeps the choice in local storage until you clear site data and in a first-party cookie named rspocc_color_scheme, which is set to expire after one year. These settings store your theme choice, not your calculation inputs.',
            ],
        ],
    },
};

const indonesianPages: Record<ContentSlug, ContentPage> = {
    faq: {
        title: 'Pertanyaan Umum',
        sections: [
            [
                'Apa itu Kalkulator Kredit RSPO?',
                'Kalkulator ini memperkirakan pendapatan kredit RSPO dan nilai tambah per kilogram TBS dari volume serta harga kredit yang Anda masukkan. Pengembangnya adalah Tim Riset dan Pengembangan Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Kalkulator ini bukan alat resmi RSPO. Keanggotaan koperasi tidak berarti kalkulator ini mendapat dukungan resmi dari RSPO.',
            ],
            [
                'Mengapa alat ini dibuat?',
                'Kami ingin membantu petani, koperasi, pembeli, dan tim ICS memahami potensi tambahan pendapatan dari kredit RSPO. Tim ICS dapat membandingkan perkiraan ini dengan biaya sertifikasi untuk menilai apakah manfaatnya sepadan dengan biaya yang dikeluarkan.',
            ],
            [
                'Apakah harga kreditnya terbaru?',
                'Kami memeriksa PRISMA setiap hari untuk melihat harga jual terakhir setiap jenis kredit. Harga tetap sama sampai ada penjualan yang lebih baru. Tanggal yang tertera menunjukkan kapan kami memeriksa data, bukan kapan penjualan terjadi.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Kurs berasal dari Frankfurter. Lihat tanggal di samping kurs pada pengaturan untuk mengetahui kapan kurs tersebut diperbarui. Anda juga bisa mengisi kurs sendiri. Perhitungan yang dibagikan tetap memakai kurs saat tautan dibuat.',
            ],
            [
                'Bagaimana rendemen CSPKO dan CSPKE dihitung?',
                indonesianConversionExplanation(),
                true,
            ],
            [
                'Bagaimana cara menyimpan hasil kalkulator?',
                'Tekan Bagikan untuk membagikan hasil melalui aplikasi di perangkat Anda. Jika perangkat tidak mendukung fitur ini, kalkulator akan menyalin tautan hasilnya. Data perhitungan ada di dalam tautan dan dapat dibaca oleh siapa pun yang memilikinya.',
            ],
        ],
    },
    terms: {
        title: 'Ketentuan Penggunaan',
        sections: [
            [
                'Hanya perkiraan',
                'Hasil perhitungan hanya berupa perkiraan sebagai bahan informasi dan diskusi. Hasil ini bukan kontrak, penawaran jual atau beli, jaminan pendapatan, saran investasi, maupun keputusan sertifikasi.',
            ],
            [
                'Hubungan dengan RSPO',
                'Kalkulator ini dikembangkan oleh Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Kalkulator ini bukan kalkulator resmi RSPO, dan status keanggotaan ini tidak berarti kalkulator mendapat dukungan resmi dari RSPO.',
            ],
            [
                'Tanggung jawab atas data',
                'Anda bertanggung jawab atas data yang Anda masukkan. Periksa rendemen, kurs, harga, volume kredit yang boleh dijual, persyaratan sertifikasi, serta kewajiban hukum dan komersial yang berlaku.',
            ],
            [
                'Biaya dan batasan',
                'Kalkulator menghitung pendapatan dari jenis kredit yang harganya Anda isi. Perhitungan belum memperhitungkan biaya, pajak, biaya sertifikasi, dan potongan lainnya. Pendapatan sebenarnya dapat berbeda. Sejauh diizinkan oleh hukum, kami tidak menjamin akurasi, ketersediaan, atau kesesuaian hasil.',
            ],
            [
                'Tautan kalkulator yang dibagikan',
                'Siapa pun yang memiliki tautan perhitungan dapat membaca inputnya. Jangan masukkan informasi pribadi atau rahasia ke tautan yang dibagikan. Perubahan pada kalkulator dapat memengaruhi cara membaca hasil perhitungan lama.',
            ],
        ],
    },
    privacy: {
        title: 'Kebijakan Privasi',
        sections: [
            [
                'Data perhitungan Anda',
                'Browser menyimpan data perhitungan dalam riwayat halaman agar isian tetap ada saat Anda kembali. Data yang Anda ubah tidak dikirim ke server kami. Saat Anda menekan Bagikan, kalkulator membuat tautan yang memuat data tersebut dalam bentuk terkompresi. Siapa pun yang memiliki tautan tersebut dapat membacanya. Kompresi bukan enkripsi.',
            ],
            [
                'Riwayat dan log',
                'Membuka tautan yang dibagikan mengirim URL beserta perhitungan yang dikompresi ke server kami. URL tersebut dapat muncul di riwayat browser, pesan yang dibagikan, dan log hosting. Sistem hosting juga dapat mencatat alamat IP dan waktu permintaan. Data perhitungan tidak disimpan di basis data aplikasi maupun local storage browser.',
            ],
            [
                'Pemantauan kesalahan',
                'Kami menggunakan Sentry untuk mendeteksi dan menelusuri kesalahan aplikasi. Sentry memproses laporan kesalahan dan log diagnostik untuk kami. Data ini dapat mencakup pesan kesalahan, informasi teknis, URL permintaan, dan waktu permintaan. Jika kesalahan terjadi saat membuka tautan perhitungan yang dibagikan, data perhitungan yang dikompresi dapat tercantum dalam laporan. Hindari membagikan tautan yang berisi informasi rahasia.',
                false,
                'https://sentry.io/privacy/',
            ],
            [
                'Pengambilan data kurs',
                'Server kami mengambil kurs USD/IDR, USD/MYR, USD/CNY, USD/EUR, dan USD/SGD dari Frankfurter. Volume TBS, harga kredit, dan data perhitungan Anda tidak dikirim ke Frankfurter. Kami hanya menyimpan data kurs dan waktu pembaruannya.',
            ],
            [
                'Membagikan tautan kalkulator',
                'Tombol Bagikan menampilkan pilihan aplikasi untuk membagikan hasil. Jika fitur ini tidak tersedia, kalkulator menyalin tautan agar dapat Anda tempel dan kirim sendiri. Aplikasi yang Anda pilih memiliki ketentuan privasinya sendiri.',
            ],
            [
                'Preferensi kalkulator dan cookie',
                'Browser menyimpan pilihan tema terang atau gelap agar tetap digunakan saat Anda kembali. Pilihan ini tersimpan di penyimpanan lokal sampai Anda menghapus data situs dan di cookie dari situs ini bernama rspocc_color_scheme, yang diatur agar kedaluwarsa setelah satu tahun. Data tersebut hanya berisi pilihan tema, bukan data perhitungan.',
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
    const url = useCanonicalPageUrl(path);
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
                                (
                                    [heading, text, showRateSource, sourceUrl],
                                    index,
                                ) => (
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
                                        {sourceUrl && (
                                            <Box
                                                component="a"
                                                href={sourceUrl}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                {lang === 'id'
                                                    ? 'Kebijakan privasi Sentry'
                                                    : 'Sentry privacy policy'}
                                            </Box>
                                        )}
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
