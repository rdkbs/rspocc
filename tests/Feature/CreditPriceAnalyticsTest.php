<?php

declare(strict_types=1);

use App\Enums\CreditPriceRetrievalStatus;
use App\Jobs\BackfillCreditPriceAnalytics;
use App\Jobs\SendCreditAnalyticsSummary;
use App\Models\CreditPriceRetrieval;
use App\Services\PrismaCreditAnalyticsCollector;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Sleep;

it('collects all six credit types in one day-level job', function (): void {
    Sleep::fake();
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response([
            'low' => 2,
            'high' => 2,
            'lastTradedPrice' => 2,
            'quantity' => 500,
        ]),
    ]);

    $day = CarbonImmutable::parse('2026-01-01', 'UTC');
    $collector = resolve(PrismaCreditAnalyticsCollector::class);
    $collector->unfinishedDays($day, $day);
    $job = new BackfillCreditPriceAnalytics($day->toDateString());
    $job->handle($collector);
    $retrievals = CreditPriceRetrieval::query()->whereNull('parent_id')->get();

    expect($retrievals)->toHaveCount(6)
        ->and($retrievals->every(fn (CreditPriceRetrieval $retrieval): bool => $retrieval->status === CreditPriceRetrievalStatus::RESOLVED))->toBeTrue()
        ->and($job->uniqueId())->toBe('2026-01-01');
    Http::assertSentCount(6);
});

it('marks a task retryable when the shared request lock times out', function (): void {
    Http::preventStrayRequests();
    $lock = Mockery::mock(Lock::class);
    $lock->shouldReceive('block')->once()->with(45)->andThrow(new LockTimeoutException('Request slot is busy.'));
    Cache::shouldReceive('lock')->once()->with('prisma:request-slot', 50)->andReturn($lock);

    $task = CreditPriceRetrieval::factory()->create(['status' => CreditPriceRetrievalStatus::PENDING]);
    $needsRetry = resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($task->period_start_at, requestLimit: 6, timeLimit: 15);

    expect($task->refresh()->status)->toBe(CreditPriceRetrievalStatus::FAILED)
        ->and($task->error_message)->toBe('Request slot is busy.')
        ->and($needsRetry)->toBeTrue();
    Http::assertNothingSent();
});

it('seeds missing historical tasks between existing days', function (): void {
    foreach (['2026-01-01', '2026-01-03'] as $date) {
        $day = CarbonImmutable::parse($date, 'UTC');

        foreach (['CSPO', 'CSPKO', 'CSPKE', 'IS_CSPO', 'IS_CSPKO', 'IS_CSPKE'] as $creditType) {
            CreditPriceRetrieval::factory()->create([
                'credit_type' => $creditType,
                'period_start_at' => $day,
                'period_end_at' => $day->addDay()->subMillisecond(),
                'status' => CreditPriceRetrievalStatus::RESOLVED,
            ]);
        }
    }

    $from = CarbonImmutable::parse('2026-01-01', 'UTC');
    $days = resolve(PrismaCreditAnalyticsCollector::class)->unfinishedDays($from, $from->addDays(2));
    $missingDayCount = CreditPriceRetrieval::query()->whereDate('period_start_at', '2026-01-02')->count();

    expect($missingDayCount)->toBe(6)
        ->and($days)->toBe(['2026-01-02']);
});

it('queues unfinished days on the analytics queue with staggered delays', function (): void {
    $this->travelTo('2025-01-03 00:00:00 UTC');
    Queue::fake([BackfillCreditPriceAnalytics::class]);

    expect(Artisan::call('credits:collect-analytics'))->toBe(0);

    Queue::assertPushed(BackfillCreditPriceAnalytics::class, 2);
    Queue::assertPushed(
        BackfillCreditPriceAnalytics::class,
        static fn (BackfillCreditPriceAnalytics $job): bool => $job->day === '2025-01-02'
            && $job->connection === 'database'
            && $job->queue === 'credit-analytics'
            && $job->delay instanceof DateTimeInterface
            && $job->delay->getTimestamp() === CarbonImmutable::parse('2025-01-03 00:00:00', 'UTC')->getTimestamp(),
    );
    Queue::assertPushed(
        BackfillCreditPriceAnalytics::class,
        static fn (BackfillCreditPriceAnalytics $job): bool => $job->day === '2025-01-01'
            && $job->delay instanceof DateTimeInterface
            && $job->delay->getTimestamp() === CarbonImmutable::parse('2025-01-03 00:01:00', 'UTC')->getTimestamp(),
    );
});

it('queues the missing child of a saved split without duplicating the other child', function (): void {
    Http::preventStrayRequests();
    $day = CarbonImmutable::parse('2026-01-01', 'UTC');
    $parent = CreditPriceRetrieval::factory()->create(['status' => CreditPriceRetrievalStatus::MIXED]);
    $left = CreditPriceRetrieval::factory()->create([
        'parent_id' => $parent->id,
        'period_end_at' => $day->addHours(12),
        'status' => CreditPriceRetrievalStatus::PENDING,
    ]);
    $right = CreditPriceRetrieval::factory()->create([
        'parent_id' => $parent->id,
        'period_start_at' => $day->addHours(12),
        'status' => CreditPriceRetrievalStatus::PENDING,
    ]);

    dispatch(new BackfillCreditPriceAnalytics($day->toDateString(), $left->id))
        ->onConnection('database')
        ->onQueue('credit-analytics');

    $collector = resolve(PrismaCreditAnalyticsCollector::class);
    $collector->collect($day, requestLimit: 6, timeLimit: 15);
    $collector->collect($day, requestLimit: 6, timeLimit: 15);

    $queue = Queue::connection('database');
    expect($queue->size('credit-analytics'))->toBe(2);

    foreach ([$left, $right] as $child) {
        $data = $queue->pop('credit-analytics')?->payload()['data'] ?? null;
        $command = is_array($data) ? ($data['command'] ?? null) : null;
        expect($command)->toContain(
            serialize('intervalId').serialize($child->id),
        );
    }

    Http::assertNothingSent();
});

it('preserves the final HTTP error response and leaves the interval retryable', function (): void {
    Sleep::fake();
    Http::preventStrayRequests();
    $body = '{"error":"Still rate limited"}';
    Http::fake([
        '*/credit-trading/price-data*' => Http::sequence()
            ->push('{"error":"Rate limited"}', 429)
            ->push($body, 429),
    ]);

    $task = CreditPriceRetrieval::factory()->create([
        'status' => CreditPriceRetrievalStatus::PENDING,
        'attempts' => 0,
    ]);

    $needsRetry = resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($task->period_start_at, requestLimit: 6, timeLimit: 15);

    $task->refresh();
    expect($needsRetry)->toBeTrue()
        ->and($task->status)->toBe(CreditPriceRetrievalStatus::FAILED)
        ->and($task->http_status)->toBe(429)
        ->and($task->response_body)->toBe($body)
        ->and($task->response_sha256)->toBe(hash('sha256', $body));
    Http::assertSentCount(2);
});

it('retries an exhausted interval after its cooldown', function (): void {
    $this->travelTo('2026-11-20 12:00:00 UTC');
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response([
            'low' => 2,
            'high' => 2,
            'lastTradedPrice' => 2,
            'quantity' => 500,
        ]),
    ]);

    $task = CreditPriceRetrieval::factory()->create([
        'status' => CreditPriceRetrievalStatus::FAILED,
        'attempts' => 24,
        'retrieved_at' => now('UTC')->subHours(25),
    ]);

    $needsRetry = resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($task->period_start_at, requestLimit: 6, timeLimit: 15);

    expect($task->refresh()->status)->toBe(CreditPriceRetrievalStatus::RESOLVED)
        ->and($task->getRawOriginal('status'))->toBe('resolved')
        ->and($task->attempts)->toBe(1)
        ->and($needsRetry)->toBeFalse();
    Http::assertSentCount(1);
});

it('queues exhausted failures only after their cooldown', function (): void {
    $this->travelTo('2026-11-20 12:00:00 UTC');
    $today = CarbonImmutable::parse('2026-01-01', 'UTC');

    foreach (['2026-01-01' => 'CSPO', '2026-01-02' => 'CSPKO'] as $date => $failedCreditType) {
        $day = CarbonImmutable::parse($date, 'UTC');

        foreach (['CSPO', 'CSPKO', 'CSPKE', 'IS_CSPO', 'IS_CSPKO', 'IS_CSPKE'] as $creditType) {
            CreditPriceRetrieval::factory()->create([
                'credit_type' => $creditType,
                'period_start_at' => $day,
                'period_end_at' => $day->addDay()->subMillisecond(),
                'status' => $creditType === $failedCreditType ? CreditPriceRetrievalStatus::FAILED : CreditPriceRetrievalStatus::RESOLVED,
                'attempts' => $creditType === $failedCreditType ? 24 : 1,
                'retrieved_at' => $creditType === $failedCreditType && $date === '2026-01-01'
                    ? now('UTC')->subHours(25)
                    : now('UTC'),
            ]);
        }
    }

    $days = resolve(PrismaCreditAnalyticsCollector::class)->unfinishedDays($today, $today->addDay());

    expect($days)->toBe(['2026-01-01']);
});

it('preserves decimal precision from the PRISMA response', function (): void {
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response(
            '{"low":0.12345678,"high":0.12345678,"lastTradedPrice":0.12345678,"quantity":0.00000001}',
        ),
    ]);

    $task = CreditPriceRetrieval::factory()->create(['status' => CreditPriceRetrievalStatus::PENDING]);

    resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($task->period_start_at, requestLimit: 6, timeLimit: 15);

    expect($task->refresh()->quantity_sold)->toBe('0.00000001')
        ->and($task->low_price)->toBe('0.12345678')
        ->and($task->last_traded_price)->toBe('0.12345678');
});

it('rejects a last-traded price outside the reported range', function (): void {
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response([
            'low' => 2,
            'high' => 2,
            'lastTradedPrice' => 4,
            'quantity' => 500,
        ]),
    ]);

    $task = CreditPriceRetrieval::factory()->create(['status' => CreditPriceRetrievalStatus::PENDING]);

    resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($task->period_start_at, requestLimit: 6, timeLimit: 15);

    expect($task->refresh()->status)->toBe(CreditPriceRetrievalStatus::FAILED)
        ->and($task->last_traded_price)->toBeNull()
        ->and($task->error_message)->toBe('PRISMA returned missing or invalid price values.');
});

it('splits a mixed-price day into two adjacent intervals and queues both', function (): void {
    Queue::fake();
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response([
            'low' => 2,
            'high' => 4,
            'lastTradedPrice' => 4,
            'quantity' => 500,
        ]),
    ]);

    $parent = CreditPriceRetrieval::factory()->create([
        'status' => CreditPriceRetrievalStatus::PENDING,
    ]);
    $day = $parent->period_start_at;

    resolve(PrismaCreditAnalyticsCollector::class)->collect($day, requestLimit: 6, timeLimit: 15);

    $children = $parent->children()->oldest('period_start_at')->get();
    expect($parent->refresh()->status)->toBe(CreditPriceRetrievalStatus::MIXED)
        ->and($children)->toHaveCount(2);

    $left = $children->firstOrFail();
    $right = $children->last();
    expect($left->period_start_at)->toEqual($day)
        ->and($right?->period_start_at)->toEqual($left->period_end_at)
        ->and($right?->period_end_at)->toEqual($parent->period_end_at);

    Queue::assertPushed(BackfillCreditPriceAnalytics::class, 2);
    foreach ($children as $child) {
        Queue::assertPushedOn('credit-analytics', BackfillCreditPriceAnalytics::class,
            fn (BackfillCreditPriceAnalytics $job): bool => $job->intervalId === $child->id);
    }

    Http::assertSentCount(1);
});

it('marks the day unresolved when a nested split has unequal quantities', function (): void {
    Http::preventStrayRequests();
    $mixed = CreditPriceRetrievalStatus::MIXED;
    $root = CreditPriceRetrieval::factory()->create([
        'status' => $mixed,
        'quantity_sold' => '100000.00000000',
    ]);
    $day = $root->period_start_at;
    $noon = $day->addHours(12);
    $six = $day->addHours(6);

    $nested = CreditPriceRetrieval::factory()->for($root, 'parent')->create([
        'status' => $mixed,
        'period_end_at' => $noon,
        'quantity_sold' => '99999.00000000',
    ]);
    CreditPriceRetrieval::factory()->for($root, 'parent')->create([
        'period_start_at' => $noon,
        'quantity_sold' => '1.00000000',
    ]);
    CreditPriceRetrieval::factory()->for($nested, 'parent')->create([
        'period_end_at' => $six,
        'quantity_sold' => '99998.99999995',
    ]);
    CreditPriceRetrieval::factory()->for($nested, 'parent')->create([
        'status' => CreditPriceRetrievalStatus::NO_TRADES,
        'period_start_at' => $six,
        'period_end_at' => $noon,
        'quantity_sold' => '0.00000000',
    ]);

    $needsRetry = resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($day, requestLimit: 6, timeLimit: 15);

    expect($nested->refresh()->child_quantity_matches)->toBeFalse()
        ->and($nested->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
        ->and($root->refresh()->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
        ->and($needsRetry)->toBeFalse();
    Http::assertNothingSent();
});

it('resets unresolved trees before queuing their days', function (): void {
    $this->travelTo('2025-01-02 00:00:00 UTC');
    Queue::fake();
    $root = CreditPriceRetrieval::factory()->create([
        'period_start_at' => '2025-01-01 00:00:00.000',
        'period_end_at' => '2025-01-01 23:59:59.999',
        'status' => CreditPriceRetrievalStatus::UNRESOLVED,
        'child_quantity_matches' => false,
    ]);
    $child = CreditPriceRetrieval::factory()->for($root, 'parent')->create([
        'period_start_at' => '2025-01-01 00:00:00.000',
        'period_end_at' => '2025-01-01 12:00:00.000',
    ]);
    $other = CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPO',
        'period_start_at' => '2025-01-01 00:00:00.000',
        'period_end_at' => '2025-01-01 23:59:59.999',
    ]);

    expect(Artisan::call('credits:collect-analytics --clear-unresolved --email'))->toBe(2)
        ->and($root->refresh()->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
        ->and($child->fresh())->not->toBeNull();
    Queue::assertNothingPushed();

    foreach ([
        ['mail.default' => 'log'],
        ['mail.default' => 'failover'],
        ['mail.default' => 'smtp', 'mail.mailers.smtp.url' => 'array://localhost'],
        ['mail.default' => 'smtp', 'mail.mailers.smtp.url' => 'smt://localhost'],
    ] as $mailConfig) {
        config($mailConfig);
        expect(Artisan::call('credits:collect-analytics --clear-unresolved --email=ops@example.test'))->toBe(2)
            ->and(Artisan::output())->toContain('MAIL_MAILER')
            ->and($root->refresh()->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
            ->and($child->fresh())->not->toBeNull();
        Queue::assertNothingPushed();
    }

    expect(Artisan::call('credits:collect-analytics', ['--clear-unresolved' => true]))->toBe(0)
        ->and($root->refresh()->status)->toBe(CreditPriceRetrievalStatus::PENDING)
        ->and($root->response_body)->toBeNull()
        ->and($root->child_quantity_matches)->toBeNull()
        ->and($root->attempts)->toBe(0)
        ->and($child->fresh())->toBeNull()
        ->and($other->refresh()->status)->toBe(CreditPriceRetrievalStatus::RESOLVED);
    Queue::assertPushed(BackfillCreditPriceAnalytics::class,
        fn (BackfillCreditPriceAnalytics $job): bool => $job->day === '2025-01-01');
});

it('queues an optional summary and waits for delayed analytics jobs before sending it', function (): void {
    $this->travelTo('2025-01-02 00:00:00 UTC');
    Queue::fake();

    config(['mail.default' => 'smtp']);
    expect(Artisan::call('credits:collect-analytics', ['--email' => 'ops@example.test']))->toBe(0);
    Queue::assertPushedOn('credit-analytics', SendCreditAnalyticsSummary::class,
        static fn (SendCreditAnalyticsSummary $job): bool => $job->email === 'ops@example.test'
            && $job->days === ['2025-01-01']
            && $job->mailer === 'smtp');
    Queue::assertPushed(BackfillCreditPriceAnalytics::class, 1);

    $queueBackfill = static fn (BackfillCreditPriceAnalytics $job): int => DB::table('jobs')->insertGetId([
        'queue' => 'credit-analytics',
        'payload' => json_encode([
            'displayName' => BackfillCreditPriceAnalytics::class,
            'data' => ['command' => serialize($job)],
        ], JSON_THROW_ON_ERROR),
        'attempts' => 0,
        'available_at' => now()->addMinutes(3)->timestamp,
        'created_at' => now()->timestamp,
    ]);

    $queueBackfill(new BackfillCreditPriceAnalytics('2025-01-02'));
    $queued = $queueBackfill(new BackfillCreditPriceAnalytics('2025-01-01', 123));
    CreditPriceRetrieval::query()->where('credit_type', 'CSPO')->update([
        'status' => CreditPriceRetrievalStatus::MIXED->value,
        'child_quantity_matches' => true,
    ]);
    CreditPriceRetrieval::query()->where('credit_type', 'CSPKO')->update([
        'status' => CreditPriceRetrievalStatus::MIXED->value,
    ]);

    config(['mail.default' => 'log']);
    $mailer = Mockery::mock(Mailer::class);
    Mail::shouldReceive('mailer')->once()->with('smtp')->andReturn($mailer);
    $mailer->shouldReceive('raw')->once()->with("UTC dates selected: 1\npending: 4\nunfinished_split: 1\nverified_split: 1", Mockery::type(Closure::class));
    $summary = new SendCreditAnalyticsSummary('ops@example.test', ['2025-01-01'], 'smtp');
    $summary->withFakeQueueInteractions()->handle();
    $summary->assertReleased(180);

    DB::table('jobs')->where('id', $queued)->delete();
    $summary->handle();

    config(['mail.mailers.smtp.transport' => 'log']);
    expect(fn () => $summary->handle())->toThrow(RuntimeException::class, 'The analytics summary mailer must deliver email');
});

it('preserves unfinished legacy split responses until an explicit reset', function (): void {
    Queue::fake();
    Http::preventStrayRequests();
    $root = CreditPriceRetrieval::factory()->create(['status' => CreditPriceRetrievalStatus::MIXED]);
    $day = $root->period_start_at;
    $midpoint = $day->addHours(12);
    $left = CreditPriceRetrieval::factory()->for($root, 'parent')->create([
        'period_end_at' => $midpoint->subMillisecond(),
    ]);
    $right = CreditPriceRetrieval::factory()->for($root, 'parent')->create([
        'period_start_at' => $midpoint,
        'status' => CreditPriceRetrievalStatus::PENDING,
    ]);

    $needsRetry = resolve(PrismaCreditAnalyticsCollector::class)
        ->collect($day, requestLimit: 6, timeLimit: 15, intervalId: $right->id);

    expect($needsRetry)->toBeFalse()
        ->and($root->refresh()->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
        ->and($root->error_message)->toContain('--clear-unresolved')
        ->and($root->response_body)->not->toBeNull()
        ->and($left->refresh()->response_body)->not->toBeNull()
        ->and($right->refresh()->status)->toBe(CreditPriceRetrievalStatus::UNRESOLVED)
        ->and($right->response_body)->not->toBeNull();
    Queue::assertNothingPushed();
    Http::assertNothingSent();
});
