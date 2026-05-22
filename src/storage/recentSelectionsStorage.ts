/// <reference types="chrome" />

export interface RecentSelectionsState {
    recentParameters: string[];
    recentAuthorities: string[];
}

export type RecentSelectionStorageKey = keyof RecentSelectionsState;

export interface RecentSelectionsStorage {
    get(): Promise<RecentSelectionsState>;
    set(value: Partial<RecentSelectionsState>): Promise<void>;
}

export const RECENT_SELECTION_STORAGE_KEYS = [
    "recentParameters",
    "recentAuthorities",
] as const satisfies readonly RecentSelectionStorageKey[];

const createEmptyRecentSelectionsState = (): RecentSelectionsState => ({
    recentParameters: [],
    recentAuthorities: [],
});

const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is string => typeof item === "string");
};

const hasChromeLocalStorage = (): boolean =>
    typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

export const chromeLocalRecentSelectionsStorage: RecentSelectionsStorage = {
    get: async () => {
        if (!hasChromeLocalStorage()) return createEmptyRecentSelectionsState();

        return new Promise((resolve, reject) => {
            chrome.storage.local.get([...RECENT_SELECTION_STORAGE_KEYS], (items) => {
                const error = chrome.runtime.lastError;

                if (error) {
                    reject(new Error(error.message));
                    return;
                }

                const stored = items as Partial<Record<RecentSelectionStorageKey, unknown>>;

                resolve({
                    recentParameters: toStringArray(stored.recentParameters),
                    recentAuthorities: toStringArray(stored.recentAuthorities),
                });
            });
        });
    },
    set: async (value) => {
        if (!hasChromeLocalStorage()) return;

        return new Promise((resolve, reject) => {
            chrome.storage.local.set(value, () => {
                const error = chrome.runtime.lastError;

                if (error) {
                    reject(new Error(error.message));
                    return;
                }

                resolve();
            });
        });
    },
};
