# Keep PRISMA credit analytics separate from calculator price snapshots

**Status:** Accepted
**Date:** 2026-11-19

## Context

The calculator needs a small, current price reference for six credit types: standard and Independent Smallholder CSPO, CSPKO, and CSPKE. The existing `credit_price_snapshots` table serves that purpose. The scheduled `credits:refresh-prices` command requests year-to-date PRISMA data through the previous UTC day, carries forward prior prices when a type has no new trade, and saves the latest reference for the calculator.

The cooperative also wants historical market analytics: how much of each credit type was sold and at what price, by day. That needs query-level or trade-level records and a way to retrieve dates missed by a daily run. Mixing those records into the calculator snapshot would combine two different data needs and could change the calculator’s existing price-reference behavior.

## Decision

Keep `credit_price_snapshots` and its refresh workflow dedicated to calculator price presets. Add a separate PRISMA analytics store and retrieval workflow. Do not replace or derive the calculator’s price reference from analytics until the historical data is complete, validated, and has enough trade-date information to select the latest price reliably.

The analytics retrieval must preserve the requested credit type and exact UTC interval. Store the API’s `quantity` as `quantity_sold`: it means the amount of the selected credit sold in that interval. Keep the raw response and retrieval time with the normalized values so a later report can be traced back to what PRISMA returned.

Store timestamps and analytics intervals in UTC. Display PRISMA check timestamps using the viewer's local time. Frankfurter's rate date is a date-only value from its source, so display it unchanged without timezone conversion.

Laravel runs `credits:collect-analytics` daily at 00:15 UTC to create missing daily tasks for each credit type from January 1, 2023 through yesterday. Each run queues up to 96 unfinished days, newest first, with one minute between their initial start times. Later runs pick up the remaining backlog.

If the endpoint returns different minimum and maximum prices for an interval, split it into subintervals that share the split timestamp and resume those splits on later runs. Keep every parent response for traceability. A mixed-price interval that cannot be split below one millisecond has a known quantity but no verified single price. Keep that quantity in volume, show its price range, and exclude its spending from totals. When both adjacent branches return the same quantity and price range for the same mixed-price interval at their shared timestamp, Trends counts that interval once. This matching-boundary adjustment preserves quantity but does not resolve price. If the child responses do not match this pattern, keep the interval breakdown unresolved and use the daily source total rather than inferring an adjustment.

The database queue processes a bounded batch per job and releases unfinished work for another attempt after three minutes. The Laravel scheduler starts a short-lived worker for the analytics queue every minute, so shared hosting only needs the existing `schedule:run` cron entry. Record a successful no-trade response separately from a date that has not been retrieved.

On an existing deployment, pause the scheduler for the rollout. The Envoy backend story runs `php artisan migrate --force` after installing dependencies and before optimizing the application. Resume the scheduler once the migration succeeds.

## Why this is separate

- Calculator presets need the latest known price, including a prior price when a credit type has no recent trade.
- Analytics needs historical quantities, prices, intervals, and retrieval provenance.
- Keeping the workflows separate protects the calculator from analytics backfill failures and lets analytics retrieval be retried without changing its current price presets.
- An admin page would add a web-facing control and authorization requirements without being needed for cron or command-line backfills.

## Data shape

The exact columns must follow a verified PRISMA response contract. A retrieval record should identify:

- the daily task and selected credit type, such as `IS_CSPO` or `CSPO`;
- the exact UTC start and end of the requested interval;
- retrieval time and outcome, including successful responses with no trades;
- `quantity_sold` and the available price summary, such as minimum, maximum, and last-traded price;
- the raw response, or a durable reference to it, and a response hash;
- the parent retrieval when a time interval was split.

For example, if the full-day query reports 70 credits sold and prices vary, its child queries might return 50 credits at USD 3.50 and 20 credits at USD 4.00. The daily analytics total is 70 credits. The parent’s 70 is retained as a reconciliation value but is not added to the two child quantities.

If the endpoint provides individual trades with stable trade IDs and timestamps, prefer storing one immutable row per trade instead of inferring trades from aggregates. If it only provides summaries, store the summaries as interval observations; do not describe them as individual trade records.

Represent each UTC day at millisecond precision from `00:00:00.000` through `23:59:59.999`, matching the observed PRISMA request format. Send the same split timestamp as the left interval's end and the right interval's start. In the December 31, 2025 CSPO replay, introducing a one-millisecond gap omitted 1,000 credits. Verify each split against its parent quantity before publishing the result.

Workers mark unfinished trees with legacy split gaps unresolved and retain their responses. Run `php artisan credits:collect-analytics --clear-unresolved` to restart all unresolved daily retrievals. The command deletes their old child intervals and clears the stored response on each reset daily record.

## Completeness checks

An unresolved price does not by itself mean that quantity is missing or mismatched. For example, if a parent reports 562 credits and both child queries report the same 562-credit mixed-price interval at their shared timestamp, the raw child sum is 1,124. Trends counts the matching interval once, preserving the parent's 562-credit volume; it keeps the minimum and maximum prices but does not calculate spending without the quantity at each price. When child responses do not match exactly at the shared boundary, do not subtract a guessed duplicate. Keep the interval breakdown unresolved and report the daily source total.

For a separate completeness audit, daily quantities across a fully covered UTC year can be compared with PRISMA's quantity for the same yearly interval. Compare like-for-like ranges and flag mismatches for investigation; boundary semantics, missing intervals, overlapping intervals, or source corrections can cause differences.

For example, if daily records sum to 1,240 credits while PRISMA reports 1,250 for the same yearly range, do not silently accept the dataset as complete. Check the missing or overlapping date ranges and repeat the comparison after resolving the difference.

## Evidence and audit limits

Save the exact request range, credit type, retrieval time, HTTP outcome, and raw response. A SHA-256 hash can help detect later changes only when the trusted hash is preserved separately from the response; storing both in the same editable database does not by itself prove that PRISMA originated the data. Stronger audit requirements may need append-only or independently backed-up evidence storage.

## Examples

### A normal daily retrieval

After a UTC day is complete, retrieve that day for each credit type. For January 1, 2023, query `2023-01-01T00:00:00.000Z` through `2023-01-01T23:59:59.999Z`. If the query for `IS_CSPO` reports 12.5 credits sold and a single price of USD 3.80, record that interval, quantity, price summary, response, and retrieval time. If it reports zero trades, record the successful empty result so it is distinguishable from a missed query.

### A date missed by cron

The next daily run picks up missing days. Run `credits:collect-analytics` manually to queue them sooner. Existing queued jobs and completed results are reused.

### Email a collection summary

Run `php artisan credits:collect-analytics --email=ops@example.com` to receive counts by retrieval status after the jobs for that run's selected UTC dates finish, including their split jobs. Dates outside the run's 96-day batch are outside the summary. You can combine `--email` with `--clear-unresolved`.

Set `MAIL_MAILER` to a mailer that can deliver email. Log and array transports are rejected, including when configured as fallbacks. The queue worker must also have the named mailer configured because it sends with the same mailer selected by the command.

### A quantity reconciliation

Suppose the daily quantities for one credit type are 12, 0, and 8 credits. The corresponding PRISMA query for the same three-day UTC range should report 20 credits. A discrepancy is a data-quality issue to resolve, not a reason to alter the calculator snapshot.

## Not decided here

- Whether sync-run metadata needs its own table; the first version uses retrieval rows and does not add a run table.
- The exact PRISMA response fields, decimal precision, quantity units, and price semantics beyond the confirmed meaning of `quantity`.
- Whether PRISMA exposes stable individual trade records, timestamps, or min/max values for each range.
- Whether one-millisecond intervals are sufficiently precise for all PRISMA data.
- How long to retain raw responses and whether stronger append-only evidence storage is required.
- Whether an admin interface is warranted later for nontechnical operators or review of unresolved intervals.

## Existing implementation references

- `app/Console/Commands/RefreshCreditPrices.php` retrieves year-to-date prices through the previous UTC day and updates the calculator snapshot.
- `app/Console/Commands/CollectCreditPriceAnalytics.php` queues unfinished UTC days.
- `app/Jobs/BackfillCreditPriceAnalytics.php` collects bounded batches and releases unfinished work to the database queue.

- `app/Services/PrismaCreditPriceProvider.php` calls PRISMA for each of the six standard and Independent Smallholder credit types.
- `app/Models/CreditPriceRetrieval.php` stores daily tasks and their recursively split interval responses.
- `app/Models/CreditPriceSnapshot.php` represents the existing calculator price reference.
- `app/Http/Controllers/CalculatorController.php` passes the latest price snapshot to the calculator page.
