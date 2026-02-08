export const PAGE_LAYOUT = {
    root: 'h-full flex flex-col bg-app-bg text-app-text overflow-hidden',
    header: 'bg-app-surface/80 backdrop-blur-sm border-b border-app-border p-6 flex-shrink-0',
    headerIcon: 'w-8 h-8 bg-app-primary rounded-lg flex items-center justify-center shadow-lg shadow-app-primary/20',
    body: 'flex-1 flex overflow-hidden p-6 gap-6',
    sidebar: 'w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto',
} as const;
