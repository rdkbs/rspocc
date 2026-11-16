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
    `RSPO menetapkan rendemen inti sawit (Kernel Extraction Rate atau KER) sebesar ${formatPercent(extractionAssumptions.kernel, 'id')} dari TBS. Inti sawit menghasilkan ${formatPercent(extractionAssumptions.kernelOilRecovery, 'id')} minyak dan ${formatPercent(extractionAssumptions.kernelExpellerRecovery, 'id')} bungkil. Dengan demikian, rendemen dari TBS adalah CSPKO ${formatPercent(defaultExtractionRates.cspko, 'id')} dan CSPKE ${formatPercent(defaultExtractionRates.cspke, 'id')}.`;

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
                'Harga pada kartu mengacu pada data PRISMA sesuai tanggal yang tertera. Harga ini tidak diperbarui secara langsung. Periksa tanggalnya, lalu sesuaikan dengan perkiraan harga jual Anda.',
            ],
            [
                'Apakah kursnya terbaru?',
                'Kurs acuan berasal dari Frankfurter dan disimpan hingga satu jam sebelum diambil kembali. Jika layanan tidak tersedia, kalkulator memakai data terakhir yang berhasil diambil. Lihat tanggal kurs di pengaturan. Hasil yang dibuka dari tautan tetap memakai kurs saat dibagikan. Anda juga dapat mengisi kurs sendiri.',
            ],
            [
                'Apa itu Kalkulator Kredit RSPO?',
                'Alat ini membantu pengurus koperasi, petani, dan pembeli memperkirakan pendapatan kredit RSPO serta nilai tambah per kilogram TBS. Alat ini dikembangkan oleh Tim Riset dan Pengembangan Koperasi Perkebunan Belayan Sejahtera, anggota RSPO. Alat ini bukan kalkulator resmi RSPO, dan status keanggotaan ini tidak berarti kalkulator mendapat dukungan resmi dari RSPO. Hasilnya berupa perkiraan. Sebelum menjual kredit, periksa volume yang tersertifikasi, kredit yang boleh dijual, dan ketentuan pembeli.',
            ],
            [
                'Mengapa alat ini dibuat?',
                'Kami membuat alat ini untuk membantu petani, koperasi, dan pembeli memahami potensi pendapatan kredit RSPO. Melalui kalkulator ini, kami ingin memudahkan perhitungan dan berbagi hasil agar manfaat produksi bersertifikat lebih mudah dipahami.',
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
                'Pengambilan data kurs',
                'Server kami mengambil kurs USD/IDR dan USD/MYR dari Frankfurter. Volume TBS, harga kredit, dan data perhitungan Anda tidak dikirim ke Frankfurter. Kami hanya menyimpan data kurs dan waktu pembaruannya.',
            ],
            [
                'Membagikan tautan kalkulator',
                'Tombol Bagikan menampilkan pilihan aplikasi untuk membagikan hasil. Jika fitur ini tidak tersedia, kalkulator menyalin tautan agar dapat Anda tempel dan kirim sendiri. Aplikasi yang Anda pilih memiliki ketentuan privasinya sendiri.',
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
