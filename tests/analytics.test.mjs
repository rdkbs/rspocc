import { describe, expect, test } from 'bun:test';
import { createAnalyticsPageView } from '../resources/js/analytics.ts';

describe('analytics URLs', () => {
    test('removes calculation payloads from initial and Inertia page views', () => {
        const initialPageView = createAnalyticsPageView({
            pageUrl:
                'https://rspocc.example/id?payload=private-calculation&source=shared',
            pageReferrer:
                'https://search.example/result?payload=private-referrer',
            pageTitle: 'Calculator',
            origin: 'https://rspocc.example',
        });
        const nextPageView = createAnalyticsPageView({
            pageUrl: '/id/faq?payload=another-calculation',
            pageReferrer: initialPageView.page_location,
            pageTitle: 'FAQ',
            origin: 'https://rspocc.example',
        });

        expect(initialPageView).toEqual({
            page_location: 'https://rspocc.example/id?source=shared',
            page_referrer: 'https://search.example/result',
            page_title: 'Calculator',
        });
        expect(nextPageView).toEqual({
            page_location: 'https://rspocc.example/id/faq',
            page_referrer: 'https://rspocc.example/id?source=shared',
            page_title: 'FAQ',
        });
    });
});
