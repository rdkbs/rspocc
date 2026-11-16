<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\CalculatorPreview;
use GdImage;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class CalculatorPreviewImageController extends Controller
{
    public function __invoke(Request $request, string $language, CalculatorPreview $preview): Response
    {
        abort_unless(function_exists('imagecreatetruecolor') && function_exists('imagettftext'), 503);
        $payload = $request->query('payload');
        abort_unless($payload === null || \is_string($payload), 400);
        abort_if($payload !== null && \strlen($payload) > 4096, 414);
        $result = $payload === null ? null : $preview->calculate($payload);
        abort_if($payload !== null && $result === null, 404);

        $image = imagecreatetruecolor(1200, 630);
        if ($image === false) {
            abort(503);
        }
        $orange = 0xE17E00;
        $white = 0xF2F1EB;
        $ink = 0x252C25;
        $muted = 0x62685E;
        imagefilledrectangle($image, 0, 0, 1199, 629, 0xF6F6EF);
        imagefilledrectangle($image, 0, 0, 1199, 125, $orange);
        $this->text($image, 'RSPO Credit Calculator', 56, 80, 32, $white);
        if ($result === null) {
            imagefilledrectangle($image, 0, 125, 1199, 629, $orange);
            $this->text($image, $language === 'id' ? 'Berapa tambahan' : 'How much more could', 56, 240, 58, $white);
            $this->text($image, $language === 'id' ? 'pendapatan dari' : 'your FFB earn?', 56, 335, 58, $white);
            $this->text($image, $language === 'id' ? 'TBS Anda?' : 'Estimate your RSPO credit revenue.', 56, 430, $language === 'id' ? 58 : 28, $white);
            imagefilledrectangle($image, 56, 485, 620, 568, $white);
            $this->text($image, $language === 'id' ? 'Coba hitung kredit RSPO' : 'Try the RSPO credit calculator', 80, 540, 26, $ink, 516);
            $this->text($image, $language === 'id' ? 'Hasil berupa perkiraan.' : 'Results are estimates.', 720, 540, 18, $white, 420);
        } else {
            $this->text($image, $language === 'id' ? 'Perkiraan pendapatan kredit' : 'Estimated credit revenue', 56, 195, 25, $muted);
            $format = fn (float $value): string => $preview->formatNumber($value, $language);
            $this->text($image, $result['currency'].' '.$format($result['converted']), 56, 295, 64, $ink);
            imageline($image, 56, 390, 1144, 390, 0xD9DDD2);
            $this->text($image, $language === 'id' ? 'Nilai tambah per kg TBS' : 'Added value per kg FFB', 56, 440, 22, $muted);
            $this->text($image, $result['currency'].' '.$format($result['added']), 56, 495, 36, 0x24593E, 608);
            $this->text($image, $language === 'id' ? 'Volume TBS' : 'FFB volume', 720, 440, 22, $muted);
            $this->text($image, $format($result['kg'] / 1000).' t', 720, 495, 32, $ink, 420);
            $this->text($image, $language === 'id' ? 'Hanya perkiraan. Bukan penawaran jual.' : 'Estimates only. Not a sales offer.', 56, 580, 18, $muted);
        }
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        if ($png === false) {
            abort(503);
        }

        return response($png, 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'public, max-age=86400']);
    }

    private function text(GdImage $image, string $text, int $x, int $y, int $size, int $color, int $maxWidth = 1088): void
    {
        $font = resource_path('fonts/InstrumentSans.ttf');
        while ($size > 12) {
            $bounds = imagettfbbox($size, 0, $font, $text);
            if ($bounds !== false && is_int($bounds[2] ?? null) && is_int($bounds[0] ?? null) && $maxWidth >= $bounds[2] - $bounds[0]) {
                break;
            }
            $size--;
        }
        imagettftext($image, $size, 0, $x, $y, $color, $font, $text);
    }
}
