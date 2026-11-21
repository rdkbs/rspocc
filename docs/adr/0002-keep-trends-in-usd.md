# Keep historical credit trends in USD

**Status:** Accepted
**Date:** 2026-11-21

## Context

Trends compares PRISMA credit prices and trade values across UTC trading days. Exchange rates vary by day. For example, two USD 100 trades on days with rates of IDR 15,000 and IDR 16,000 per USD total IDR 3.1 million when converted by trade date. Applying the second day's rate to the full USD 200 gives IDR 3.2 million.

## Decision

Display Trends prices and trade values in USD, the currency reported by PRISMA. Keep currency selection in the calculator, where the exchange rate applies to a single estimate.

Revisit currency selection for Trends if we have historical rates that cover the supported currencies and trading dates. Before adding it, define how to handle dates without a published rate and convert each day's trade value before adding it to the period total.

For the distinction between historical analytics and calculator reference data, see [ADR 0001](0001-separate-credit-price-analytics.md).
