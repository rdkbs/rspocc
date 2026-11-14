import { createInertiaApp } from '@inertiajs/react';

const appName = 'RSPO Credit Calculator';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#a34408',
    },
});
