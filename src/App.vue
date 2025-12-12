<template>
    <div class="app">
        <h1 style="margin-bottom: 20px; text-align: center">Comed Session Storage</h1>
        <div v-if="error" class="context-warning">
            {{ error }}
        </div>
        <div v-else>
            <ToggleSwitch v-model="showConfigurations" />
            <AutocompleteSimple
                v-model="selected"
                :items="options"
                placeholder="Arama yap..."
                :show-configurations="showConfigurations"
            />
            <ConfigurationsPanel
                v-if="showConfigurations"
                @storage-fetched="handleData"
                :selected="selected"
            />
            <ClaimsPanel v-else :selected="selected" @storage-fetched="handleData" />
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
import logMessage = chrome.cast.logMessage;

const version = chrome.runtime.getManifest().version;
const showConfigurations = shallowRef(true);
const options = ref<ConfigItem[]>([]);
const selected = ref<ConfigItem | null>(null);
const autoSimpleKey = ref(0);
const error = ref<string | null>(null);

watch(
    () => showConfigurations.value,
    () => ++autoSimpleKey.value,
);

const handleData = (rawList: StorageEntryInterface[]) => {
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

const isComedContext = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (!tabId) return resolve(false);

            chrome.scripting.executeScript(
                {
                    target: { tabId },
                    func: () => {
                        return performance
                            .getEntriesByType("resource")
                            .some((r) => r.name.includes("comed.com.tr"));
                    },
                },
                (res) => {
                    resolve(Boolean(res?.[0]?.result));
                },
            );
        });
    });
};

onMounted(async () => {
    const isComed = await isComedContext();

    if (!isComed) {
        error.value = "Comed Parametre ve Yetki Tanımlamaları Bulunamadı!";
        return;
    }
});
</script>