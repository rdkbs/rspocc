<?php

declare(strict_types=1);

namespace App\Services;

final class CalculatorPreview
{
    /** @return array{kg: float, usd: float, converted: float, added: float, currency: string}|null */
    public function calculate(string $payload): ?array
    {
        $json = (new ScenarioDecoder)->decode($payload);
        if ($json === null) {
            return null;
        }
        $data = json_decode($json, true, 32);
        if (! \is_array($data)) {
            return null;
        }
        if (! \array_key_exists('prices', $data) && $this->isNumber($data['premium'] ?? null)) {
            $data['prices'] = array_fill_keys(['cspo', 'cspko', 'cspke'], $data['premium']);
        }
        $numbers = [];
        foreach (['volume', 'oer', 'ker', 'yield', 'exchange'] as $key) {
            $value = $data[$key] ?? null;
            if (! $this->isNumber($value)) {
                return null;
            }
            $numbers[$key] = $value;
        }
        if (! \in_array($data['unit'] ?? null, ['kg', 't'], true)
            || ! \in_array($data['currency'] ?? null, ['IDR', 'MYR', 'CNY', 'EUR', 'USD'], true)
            || ! \in_array($data['language'] ?? null, ['id', 'en'], true)
            || $numbers['exchange'] <= 0
            || $numbers['oer'] + $numbers['ker'] + $numbers['yield'] > 100
            || ! \is_array($data['prices'] ?? null)) {
            return null;
        }
        $kg = (float) ($numbers['volume'] * ($data['unit'] === 't' ? 1000 : 1));
        $usd = 0.0;
        $hasPrice = false;
        foreach (['cspo' => 'oer', 'cspko' => 'ker', 'cspke' => 'yield'] as $credit => $rate) {
            if (! \array_key_exists($credit, $data['prices'])) {
                return null;
            }
            $price = $data['prices'][$credit];
            if ($price !== null && ! $this->isNumber($price)) {
                return null;
            }
            if (\array_key_exists('included', $data)) {
                if (! \is_array($data['included']) || ! \is_bool($data['included'][$credit] ?? null)) {
                    return null;
                }
                if (! $data['included'][$credit]) {
                    $price = null;
                }
            }
            if ($price !== null) {
                $hasPrice = true;
                $usd += (($kg * $numbers[$rate] / 100) / 1000) * $price;
            }
        }
        if (! $hasPrice || $kg <= 0) {
            return null;
        }
        $converted = $usd * ($data['currency'] === 'USD' ? 1 : $numbers['exchange']);

        return ['kg' => $kg, 'usd' => $usd, 'converted' => $converted, 'added' => $converted / $kg, 'currency' => $data['currency']];
    }

    /** @phpstan-assert-if-true int|float $value */
    private function isNumber(mixed $value): bool
    {
        return (\is_int($value) || \is_float($value)) && is_finite((float) $value) && $value >= 0 && $value <= 1e12;
    }

    public function formatNumber(float $value, string $language): string
    {
        $decimal = $language === 'id' ? ',' : '.';
        $formatted = number_format($value, 2, $decimal, $language === 'id' ? '.' : ',');

        return rtrim(rtrim($formatted, '0'), $decimal);
    }

    /** @return array{title: string, description: string}|null */
    public function metadata(string $payload, string $language): ?array
    {
        $result = $this->calculate($payload);
        if ($result === null) {
            return null;
        }
        $format = fn (float $value): string => $this->formatNumber($value, $language);
        $amount = $result['currency'].' '.$format($result['converted']);
        $volume = $format($result['kg'] / 1000);
        $added = $result['currency'].' '.$format($result['added']);

        return $language === 'id'
            ? ['title' => 'Perkiraan pendapatan kredit RSPO: '.$amount, 'description' => "Volume TBS: {$volume} t. Pendapatan premi: {$amount}. Nilai tambah: {$added}/kg TBS. Hasil ini hanya perkiraan."]
            : ['title' => 'Estimated RSPO credit revenue: '.$amount, 'description' => "FFB volume: {$volume} t. Premium revenue: {$amount}. Added value: {$added}/kg FFB. Results are estimates."];
    }
}
