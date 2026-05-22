<template>
    <div class="app" :class="{ dark: isDark }">
        <div class="app-header">
            <h1>Comed Session Storage</h1>

            <button
                class="theme-toggle"
                @click="isDark = !isDark"
                :title="isDark ? 'Light mode' : 'Dark mode'"
            >
                {{ isDark ? "☀️" : "🌙" }}
            </button>
        </div>
        <div v-if="error" class="context-warning">
            {{ error }}
        </div>
        <div v-else>
            <ToggleSwitch v-model="showConfigurations" />
            <AutocompleteSimple
                :model-value="selected"
                :items="options"
                placeholder="Arama yap..."
                :show-configurations="showConfigurations"
                :recent-items="activeRecentItems"
                @update:model-value="handleSelection"
                @select-recent="handleRecentSelection"
            />
            <ConfigurationsPanel
                v-if="showConfigurations"
                @storage-fetched="handleData"
                @selection-change="(item) => handleSelection(item, 'parameter')"
                :selected="selected"
            />
            <ClaimsPanel
                v-else
                :selected="selected"
                @storage-fetched="handleData"
                @selection-change="(item) => handleSelection(item, 'authority')"
            />
            <div class="app-version">Versiyon: {{ version }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import ConfigurationsPanel from "./components/ConfigurationsPanel.vue";
import ClaimsPanel from "./components/ClaimsPanel.vue";
import ToggleSwitch from "./components/ToggleSwitch.vue";
import AutocompleteSimple from "./components/AutocompleteSimple.vue";
import { ConfigItem } from "@/types/config-item.interface";
import { StorageEntryInterface } from "@/types/storage-entry.interface";
import { useRecentSelections, type RecentSelectionType } from "@/composables/useRecentSelections";

const version = chrome.runtime.getManifest().version;
const showConfigurations = shallowRef(true);
const options = ref<ConfigItem[]>([]);
const selected = ref<ConfigItem | null>(null);
const autoSimpleKey = ref(0);
const error = ref<string | null>(null);
const isDark = ref(false);
const pendingRecentSelection = shallowRef<{
    type: RecentSelectionType;
    value: string;
} | null>(null);

const { recentParameters, recentAuthorities, addRecentItem, loadRecentItems } =
    useRecentSelections();

const activeRecentType = computed<RecentSelectionType>(() =>
    showConfigurations.value ? "parameter" : "authority",
);
const activeRecentItems = computed(() =>
    showConfigurations.value ? recentParameters.value : recentAuthorities.value,
);

watch(
    isDark,
    (val) => {
        document.body.classList.toggle("dark", val);
    },
    { immediate: true },
);

watch(
    () => showConfigurations.value,
    () => {
        ++autoSimpleKey.value;
        selected.value = null;
    },
);

const getRecentDisplayValue = (item: ConfigItem, type: RecentSelectionType): string => {
    const key = item.key.trim();
    const group = item.group.trim();

    if (type === "parameter") return group && key ? `${group}.${key}` : key;

    return key;
};

const handleSelection = async (
    item: ConfigItem | null,
    type: RecentSelectionType = activeRecentType.value,
) => {
    if (!item) {
        selected.value = null;
        return;
    }

    const recentValue = getRecentDisplayValue(item, type);

    selected.value = { ...item };
    await addRecentItem(type, recentValue);
};

const applyRecentSelection = async (value: string, type: RecentSelectionType): Promise<boolean> => {
    const item = options.value.find((option) => getRecentDisplayValue(option, type) === value);

    if (!item) return false;

    await handleSelection(item, type);
    return true;
};

const handleRecentSelection = async (value: string) => {
    const normalized = value.trim();
    const type = activeRecentType.value;

    if (!normalized) return;

    const applied = await applyRecentSelection(normalized, type);

    if (!applied && !options.value.length) {
        pendingRecentSelection.value = { type, value: normalized };
    }
};

const applyPendingRecentSelection = () => {
    const pending = pendingRecentSelection.value;

    if (!pending || pending.type !== activeRecentType.value) return;

    pendingRecentSelection.value = null;
    void applyRecentSelection(pending.value, pending.type);
};

const handleData = (rawList: StorageEntryInterface[]) => {
    if (showConfigurations.value && (!rawList || !rawList?.length)) {
        error.value = "Comed Parametre ve Yetki Tanımlamaları Bulunamadı!";
        options.value = [];
        selected.value = null;
        return;
    }

    error.value = null;

    const allConfigs: Record<string, any> = {};

    rawList.forEach((item: StorageEntryInterface) => {
        try {
            const parsed = JSON.parse(item.value);
            Object.assign(allConfigs, parsed);
        } catch (err) {
            console.warn("JSON Parse error:", err);
        }
    });

    options.value = flattenConfigs(allConfigs);
    applyPendingRecentSelection();
};

const flattenConfigs = (data: any): ConfigItem[] => {
    const items: ConfigItem[] = [];

    for (const group in data) {
        const groupObj = data[group];

        if (typeof groupObj === "object" && groupObj !== null && !Array.isArray(groupObj)) {
            for (const param in groupObj) {
                items.push({
                    label: param,
                    group: group,
                    key: param,
                    value: groupObj[param],
                });
            }
        }
    }
    return items;
};

onMounted(() => {
    isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
    void loadRecentItems();
});
</script>
