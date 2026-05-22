import { ref, type Ref } from "vue";
import {
    chromeLocalRecentSelectionsStorage,
    type RecentSelectionsState,
} from "@/storage/recentSelectionsStorage";

export type RecentSelectionType = "parameter" | "authority";

const MAX_RECENT_ITEMS = 3;

const recentParameters = ref<string[]>([]);
const recentAuthorities = ref<string[]>([]);
const isRecentSelectionsLoaded = ref(false);

let loadPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const storageKeyByType: Record<RecentSelectionType, keyof RecentSelectionsState> = {
    parameter: "recentParameters",
    authority: "recentAuthorities",
};

const recentItemsByType: Record<RecentSelectionType, Ref<string[]>> = {
    parameter: recentParameters,
    authority: recentAuthorities,
};

const normalizeRecentValue = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

const normalizeRecentList = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [];

    const normalizedList: string[] = [];

    for (const item of list) {
        const normalized = normalizeRecentValue(item);

        if (!normalized || normalizedList.includes(normalized)) continue;

        normalizedList.push(normalized);

        if (normalizedList.length === MAX_RECENT_ITEMS) break;
    }

    return normalizedList;
};

export function addRecentItemToList(list: string[], value: string): string[] {
    const normalized = normalizeRecentValue(value);

    if (!normalized) return list;

    const filtered = list.filter((item) => item !== normalized);
    filtered.unshift(normalized);

    return filtered.slice(0, MAX_RECENT_ITEMS);
}

export function useRecentSelections() {
    const loadRecentItems = async (): Promise<void> => {
        if (loadPromise) return loadPromise;

        loadPromise = chromeLocalRecentSelectionsStorage
            .get()
            .then((stored) => {
                recentParameters.value = normalizeRecentList(stored.recentParameters);
                recentAuthorities.value = normalizeRecentList(stored.recentAuthorities);
            })
            .catch((error: unknown) => {
                console.warn("Recent selections could not be loaded:", error);
            })
            .finally(() => {
                isRecentSelectionsLoaded.value = true;
            });

        return loadPromise;
    };

    const getRecentItems = (type: RecentSelectionType): string[] => [
        ...recentItemsByType[type].value,
    ];

    const addRecentItem = async (
        type: RecentSelectionType,
        value: string | null | undefined,
    ): Promise<string[]> => {
        const normalized = normalizeRecentValue(value);

        if (!normalized) return getRecentItems(type);

        await loadRecentItems();

        const target = recentItemsByType[type];
        const storageKey = storageKeyByType[type];
        let updatedItems = getRecentItems(type);

        writeQueue = writeQueue
            .catch(() => undefined)
            .then(async () => {
                updatedItems = addRecentItemToList(target.value, normalized);
                target.value = updatedItems;

                await chromeLocalRecentSelectionsStorage.set({
                    [storageKey]: updatedItems,
                });
            });

        try {
            await writeQueue;
        } catch (error) {
            console.warn("Recent selections could not be saved:", error);
        }

        return updatedItems;
    };

    const clearRecentItems = async (type: RecentSelectionType): Promise<void> => {
        await loadRecentItems();

        const target = recentItemsByType[type];
        const storageKey = storageKeyByType[type];

        target.value = [];

        writeQueue = writeQueue
            .catch(() => undefined)
            .then(() =>
                chromeLocalRecentSelectionsStorage.set({
                    [storageKey]: [],
                }),
            );

        try {
            await writeQueue;
        } catch (error) {
            console.warn("Recent selections could not be cleared:", error);
        }
    };

    return {
        recentParameters,
        recentAuthorities,
        isRecentSelectionsLoaded,
        addRecentItem,
        getRecentItems,
        loadRecentItems,
        clearRecentItems,
    };
}
