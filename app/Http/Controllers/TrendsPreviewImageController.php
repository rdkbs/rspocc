<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use GdImage;
use Symfony\Component\HttpFoundation\Response;

final class TrendsPreviewImageController extends Controller
{
    public function __invoke(string $language): Response
    {
        abort_unless(function_exists('imagecreatetruecolor') && function_exists('imagettftext'), 503);

        $image = imagecreatetruecolor(1200, 630);
        if ($image === false) {
            abort(503);
        }

        $orange = 0xE17E00;
        $darkOrange = 0x9C5000;
        $green = 0x24593E;
        $ink = 0x252C25;
        $muted = 0x62685E;
        $cream = 0xF6F6EF;
        $white = 0xFFFFFF;
        $paleOrange = 0xFBEAD4;
        $paleGreen = 0xE8F1E9;

        imagefilledrectangle($image, 0, 0, 1199, 629, $cream);
        imagefilledrectangle($image, 0, 0, 1199, 112, $orange);
        $this->text($image, 'RSPO Credit Calculator', 56, 72, 32, 0xF2F1EB);

        $this->text($image, $language === 'id' ? 'Tren Kredit RSPO' : 'RSPO Credit Trends', 56, 205, 52, $ink, 570);
        if ($language === 'id') {
            $this->text($image, 'Jelajahi data PRISMA menurut', 56, 270, 27, $muted, 570);
            $this->text($image, 'jenis kredit dan produk', 56, 309, 27, $muted, 570);
        } else {
            $this->text($image, 'Explore PRISMA data by credit', 56, 270, 27, $muted, 570);
            $this->text($image, 'type and product', 56, 309, 27, $muted, 570);
        }

        $this->roundedRectangle($image, 56, 383, 612, 548, 20, $white, 0xE1E3D9);
        $this->text($image, $language === 'id' ? 'Untuk setiap produk' : 'For each product', 84, 431, 22, $muted, 500);
        foreach (['CSPO', 'CSPKO', 'CSPKE'] as $index => $product) {
            $x = 84 + ($index * 170);
            $this->roundedRectangle($image, $x, 457, $x + 145, 514, 14, $cream, 0xE1E3D9);
            $this->text($image, $product, $x + 20, 495, 22, $ink, 105);
        }

        $this->roundedRectangle($image, 704, 152, 1144, 548, 24, $white, 0xE1E3D9);
        $this->text($image, $language === 'id' ? 'Bandingkan jenis kredit' : 'Compare credit types', 740, 201, 23, $muted, 368);

        $this->roundedRectangle($image, 740, 235, 920, 382, 18, $paleOrange, 0xEED2AE);
        imagefilledrectangle($image, 740, 235, 920, 247, $orange);
        $this->text($image, 'Non-IS', 758, 328, 29, $darkOrange, 145);

        $this->roundedRectangle($image, 944, 235, 1108, 382, 18, $paleGreen, 0xC9DCCB);
        imagefilledrectangle($image, 944, 235, 1108, 247, $green);
        $this->text($image, $language === 'id' ? 'Petani swadaya' : 'Independent', 962, 303, 18, $green, 128);
        $this->text($image, $language === 'id' ? '(IS)' : 'smallholder (IS)', 962, 332, 18, $green, 128);

        imageline($image, 740, 413, 1108, 413, 0xE1E3D9);
        $this->text($image, $language === 'id' ? 'Rentang harga' : 'Price ranges', 740, 464, 19, $muted, 170);
        $this->text($image, $language === 'id' ? 'Volume perdagangan' : 'Trading volumes', 926, 464, 19, $muted, 182);

        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);
        if ($png === false) {
            abort(503);
        }

        return response($png, 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'public, max-age=86400']);
    }

    private function roundedRectangle(GdImage $image, int $x1, int $y1, int $x2, int $y2, int $radius, int $fill, int $border): void
    {
        imagefilledrectangle($image, $x1 + $radius, $y1, $x2 - $radius, $y2, $fill);
        imagefilledrectangle($image, $x1, $y1 + $radius, $x2, $y2 - $radius, $fill);
        imagefilledellipse($image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, $fill);
        imagefilledellipse($image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, $fill);
        imagefilledellipse($image, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, $fill);
        imagefilledellipse($image, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, $fill);
        imageline($image, $x1 + $radius, $y1, $x2 - $radius, $y1, $border);
        imageline($image, $x1 + $radius, $y2, $x2 - $radius, $y2, $border);
        imageline($image, $x1, $y1 + $radius, $x1, $y2 - $radius, $border);
        imageline($image, $x2, $y1 + $radius, $x2, $y2 - $radius, $border);
        imagearc($image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, 180, 270, $border);
        imagearc($image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, 270, 360, $border);
        imagearc($image, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, 0, 90, $border);
        imagearc($image, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, 90, 180, $border);
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
