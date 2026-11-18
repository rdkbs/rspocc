type AnalyticsPageView = {
    page_location: string;
    page_referrer: string;
    page_title: string;
};

function sanitizeAnalyticsUrl(url: string, origin: string): string {
    const sanitizedUrl = new URL(url, origin);
    sanitizedUrl.searchParams.delete('payload');

    return sanitizedUrl.href;
}

export function createAnalyticsPageView({
    pageUrl,
    pageReferrer,
    pageTitle,
    origin,
}: {
    pageUrl: string;
    pageReferrer: string;
    pageTitle: string;
    origin: string;
}): AnalyticsPageView {
    return {
        page_location: sanitizeAnalyticsUrl(pageUrl, origin),
        page_referrer: pageReferrer
            ? sanitizeAnalyticsUrl(pageReferrer, origin)
            : '',
        page_title: pageTitle,
    };
}
