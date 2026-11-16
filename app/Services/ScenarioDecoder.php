<?php

declare(strict_types=1);

namespace App\Services;

final class ScenarioDecoder
{
    public function decode(string $payload): ?string
    {
        if ($payload === '' || \strlen($payload) > 4096) {
            return null;
        }

        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
        $values = [];
        foreach (str_split(str_replace(' ', '+', $payload)) as $character) {
            $value = strpos($alphabet, $character);
            if ($value === false) {
                return null;
            }
            $values[] = $value;
        }

        $value = $values[0];
        $position = 32;
        $index = 1;
        $readBits = static function (int $count) use (&$value, &$position, &$index, $values): int {
            $result = 0;
            for ($bit = 0; $bit < $count; $bit++) {
                if (($value & $position) > 0) {
                    $result |= 1 << $bit;
                }
                $position >>= 1;
                if ($position === 0) {
                    $position = 32;
                    $value = $values[$index++] ?? 0;
                }
            }

            return $result;
        };
        $initial = $readBits(2);
        // Calculator JSON contains only ASCII keys, enums, and numbers.
        if ($initial !== 0) {
            return null;
        }
        $character = \chr($readBits(8) & 255);
        $dictionary = [0 => '', 1 => '', 2 => '', 3 => $character];
        $result = $character;
        $previous = $character;
        $enlargeIn = 4;
        $size = 4;
        $width = 3;

        while ($index <= \count($values)) {
            $code = $readBits($width);
            if ($code === 0 || $code === 1) {
                $characterCode = $readBits($code === 0 ? 8 : 16);
                if ($characterCode < 0 || $characterCode > 127) {
                    return null;
                }
                $dictionary[$size++] = \chr($characterCode);
                $code = $size - 1;
                $enlargeIn--;
            } elseif ($code === 2) {
                return $result;
            }

            if ($enlargeIn === 0) {
                $enlargeIn = 2 ** $width++;
            }
            $next = $dictionary[$code] ?? ($code === $size ? $previous.$previous[0] : null);
            if ($next === null || \strlen($result) + \strlen($next) > 65536) {
                return null;
            }
            $result .= $next;
            $dictionary[$size++] = $previous.$next[0];
            $enlargeIn--;
            $previous = $next;
            if ($enlargeIn === 0) {
                $enlargeIn = 2 ** $width++;
            }
        }

        return null;
    }
}
