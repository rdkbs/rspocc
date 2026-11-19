# Keep PRISMA credit analytics separate from calculator price snapshots

**Status:** Accepted
**Date:** 2026-11-19

## Context

The calculator needs a small, current price reference for six credit types: standard and Independent Smallholder CSPO, CSPKO, and CSPKE. The existing `credit_price_snapshots` table serves that purpose. The scheduled `credits:refresh-prices` command requests year-to-date PRISMA data through the previous UTC day, carries forward prior prices when a type has no new trade, and saves the latest reference for the calculator.

The cooperative also wants historical market analytics: how much of each credit type was sold and at what price, by day. That needs query-level or trade-level records and a way to retrieve dates missed by a daily run. Mixing those records into the calculator snapshot would combine two different data needs and could change the calculator’s existing price-reference behavior.

## Decision

Keep `credit_price_snapshots` and its refresh workflow dedicated to calculator price presets. Add a separate PRISMA analytics store and retrieval workflow. Do not replace or derive the calculator’s price reference from analytics until the historical data is complete, validated, and has enough trade-date information to select the latest price reliably.

The analytics retrieval must preserve the requested credit type and exact UTC interval. Store the API’s `quantity` as `quantity_sold`: it means the amount of the selected credit sold in that interval. Keep the raw response and retrieval time with the normalized values so a later report can be traced back to what PRISMA returned.

Use scheduled retrieval for completed UTC days, not the still-open current day. If the endpoint returns different minimum and maximum prices for an interval, split the interval automatically and request its non-overlapping subintervals. Only final subintervals contribute to analytics totals; parent responses remain available for traceability and must not be counted again. If the smallest supported interval still has different minimum and maximum prices, record it as unresolved rather than claiming an exact price breakdown.

Run backfills with a command that accepts a UTC date range. The initial operating approach is a scheduled retrieval plus a command-line backfill; defer an admin page unless nontechnical operators need to manage retrievals themselves. Shared hosting can run the Laravel scheduler through cron. Record a successful no-trade response separately from a date that has not been retrieved.

## Why this is separate

- Calculator presets need the latest known price, including a prior price when a credit type has no recent trade.
- Analytics needs historical quantities, prices, intervals, and retrieval provenance.
- Keeping the workflows separate protects the calculator from analytics backfill failures and lets analytics retrieval be retried without changing its current price presets.
- An admin page would add a web-facing control and authorization requirements without being needed for cron or command-line backfills.

## Data shape

The exact columns must follow a verified PRISMA response contract. A retrieval record should be able to identify:

- the sync run and selected credit type, such as `IS_CSPO` or `CSPO`;
- the exact UTC start and end of the requested interval;
- retrieval time and outcome, including successful responses with no trades;
- `quantity_sold` and the available price summary, such as minimum, maximum, and last-traded price;
- the raw response, or a durable reference to it, and a response hash;
- the parent retrieval when a time interval was split.

For example, if the full-day query reports 70 credits sold and prices vary, its child queries might return 50 credits at USD 3.50 and 20 credits at USD 4.00. The daily analytics total is 70 credits. The parent’s 70 is retained as a reconciliation value but is not added to the two child quantities.

If the endpoint provides individual trades with stable trade IDs and timestamps, prefer storing one immutable row per trade instead of inferring trades from aggregates. If it only provides summaries, store the summaries as interval observations; do not describe them as individual trade records.

Represent a UTC day internally as a half-open range, such as `[2026-01-01T00:00:00Z, 2026-01-02T00:00:00Z)`. Adapt that range to PRISMA's request format only after confirming whether its end boundary is inclusive or exclusive. This avoids gaps and duplicate trades at midnight when adjacent intervals are queried.

## Completeness checks

For each credit type, daily quantities across a fully covered UTC year are expected to equal PRISMA’s quantity for the same yearly interval. Likewise, the quantities of a day’s final subintervals are expected to equal the full-day quantity. Compare like-for-like ranges and flag mismatches as incomplete for investigation; boundary semantics, missing intervals, overlapping intervals, or source corrections can cause differences.

For example, if daily records sum to 1,240 credits while PRISMA reports 1,250 for the same yearly range, do not silently accept the dataset as complete. Check the missing or overlapping date ranges and repeat the comparison after resolving the difference.

## Evidence and audit limits

Save the exact request range, credit type, retrieval time, HTTP outcome, and raw response. A SHA-256 hash can help detect later changes only when the trusted hash is preserved separately from the response; storing both in the same editable database does not by itself prove that PRISMA originated the data. Stronger audit requirements may need append-only or independently backed-up evidence storage.

## Examples

### A normal daily retrieval

After a UTC day is complete, retrieve that day for each credit type. For example, query `[2026-01-01T00:00:00Z, 2026-01-02T00:00:00Z)` for January 1, adapting the end boundary to the API contract. If the query for `IS_CSPO` reports 12.5 credits sold and a single price of USD 3.80, record that interval, quantity, price summary, response, and retrieval time. If it reports zero trades, record the successful empty result so it is distinguishable from a missed query.

### A date missed by cron

If the daily run for 2026-01-04 failed, a command-line backfill can request that date or a larger range, for example `credits:backfill-analytics --from=2026-01-04 --to=2026-01-10`. This command name is illustrative; implementation may choose a different name. Rerunning the range must not double-count already accepted intervals.

### A quantity reconciliation

Suppose the daily quantities for one credit type are 12, 0, and 8 credits. The corresponding PRISMA query for the same three-day UTC range should report 20 credits. A discrepancy is a data-quality issue to resolve, not a reason to alter the calculator snapshot.

## Not decided here

- The final analytics table name and whether sync-run metadata needs its own table.
- The exact PRISMA response fields, decimal precision, quantity units, and price semantics beyond the confirmed meaning of `quantity`.
- Whether PRISMA exposes stable individual trade records, timestamps, or min/max values for each range.
- The smallest useful time interval and the endpoint’s exact inclusive/exclusive boundary behavior.
- How long to retain raw responses and whether stronger append-only evidence storage is required.
- Whether an admin interface is warranted later for nontechnical operators or review of unresolved intervals.

## Existing implementation references

- `app/Console/Commands/RefreshCreditPrices.php` retrieves year-to-date prices through the previous UTC day and updates the calculator snapshot.
- `app/Services/PrismaCreditPriceProvider.php` calls PRISMA for each of the six standard and Independent Smallholder credit types.
- `app/Models/CreditPriceSnapshot.php` represents the existing calculator price reference.
- `app/Http/Controllers/CalculatorController.php` passes the latest price snapshot to the calculator page.
