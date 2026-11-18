import { createInertiaApp, router } from '@inertiajs/react';
import { createAnalyticsPageView } from './analytics';

const appName = 'RSPO Credit Calculator';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

if (typeof window !== 'undefined') {
    let previousPageUrl = document.referrer;

    router.on('navigate', (event) => {
        const pageView = createAnalyticsPageView({
            pageUrl: event.detail.page.url,
            pageReferrer: previousPageUrl,
            pageTitle: document.title,
            origin: window.location.origin,
        });

        window.gtag?.('event', 'page_view', pageView);

        previousPageUrl = pageView.page_location;
    });
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#a34408',
    },
});
