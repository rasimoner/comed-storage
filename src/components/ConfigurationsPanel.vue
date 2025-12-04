<script setup lang="ts">
import { computed, ref, onMounted, watch, shallowRef } from "vue";
import SelectFilterComponent from "./SelectFilterComponent.vue";
import ValueEditor from "./ValueEditor.vue";

const props = defineProps<{
    selected?: { key: string; value: any, group: string, label: string };
}>()

const emit = defineEmits<{
    (event: "storage-fetched", value: { key: string; value: string }[]): void;
}>()

const storageData = ref<{ key: string; value: string }[]>([]);
const storageKey = shallowRef("");
const selectedGroup = shallowRef("");
const selectedParameter = shallowRef("");
const filteredGroups = ref<string[]>([]);
const filteredParameters = ref<{ key: string; value: any }[]>([]);
const parameterValue = ref<string | boolean | number | null>(null);
const parameterValueAsString = shallowRef("");
const isUserSelecting = ref(false);

const activeTabId = ref<number | null>(null);
const isLoading = shallowRef(false);

const getActiveTabId = async () =>
    new Promise<number | null>((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
            resolve(tabs?.[0]?.id ?? null),
        ),
    );

const onGroupSelect = (val: string) => {
    isUserSelecting.value = true;
    selectedGroup.value = val;

    const match = storageData.value.find(item => {
        try {
            const parsed = JSON.parse(item.value);
            return Object.keys(parsed).includes(val);
        } catch {
            return false;
        }
    });

    storageKey.value = match?.key || "";
};


const onParameterSelect = (val: string) => {
    isUserSelecting.value = true;
    selectedParameter.value = val;
};

const fetchSessionStorageData = async () => {
    if (!activeTabId.value) return;

    isLoading.value = true;

    chrome.scripting.executeScript(
        {
            target: { tabId: activeTabId.value },
            func: () => {
                const keys = Object.keys(sessionStorage).filter((k) =>
                    k.includes("getConfigurations"),
                );
                return keys.map((key) => ({
                    key,
                    value: sessionStorage.getItem(key) || "",
                }));
            },
        },
        (results) => {
            storageData.value = results?.[0]?.result ?? [];
            storageKey.value = storageData.value?.[0]?.key;
            isLoading.value = false;

            emit("storage-fetched", storageData.value);
        },
    );
};

const filterGroups = () => {
    const found = storageData.value.find((x) => x.key === storageKey.value);
    if (!found) return (filteredGroups.value = []);

    const parsed = JSON.parse(found.value);
    filteredGroups.value = Object.keys(parsed);
};

const filterParameters = () => {
    if (isUserSelecting.value) {
        selectedParameter.value = "";
        isUserSelecting.value = false;
    }

    const found = storageData.value.find((x) => x.key === storageKey.value);
    if (!found) return (filteredParameters.value = []);

    const parsed = JSON.parse(found.value);
    const groupData = parsed[selectedGroup.value] || {};

    filteredParameters.value = Object.keys(groupData).map((k) => ({
        key: k,
        value: groupData[k],
    }));
};


const showParameterValue = () => {
    if(!selectedParameter.value) {
       return parameterValue.value = null;
    }
    const found = filteredParameters.value.find((x) => x.key === selectedParameter.value);
    parameterValue.value = found?.value ?? null;
};

const updateConfigValue = () => {
    const found = storageData.value.find((x) => x.key === storageKey.value);
    if (!found) return;

    const parsed = JSON.parse(found.value);
    parsed[selectedGroup.value][selectedParameter.value] = parameterValue.value;

    found.value = JSON.stringify(parsed);

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value ?? 0},
        func: (item) => sessionStorage.setItem(item.key, item.value),
        args: [found],
    });

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value ?? 0},
        func: () => location.reload(),
    });
};

watch(storageKey, filterGroups);
watch(selectedGroup, filterParameters);
watch(selectedParameter, showParameterValue);

watch(parameterValue, (val) => {
    if (Array.isArray(val)) parameterValueAsString.value = JSON.stringify(val, null, 2);
});

watch( () => props.selected,  (newVal) => {
        isUserSelecting.value = false;
        selectedGroup.value = newVal.group;
        selectedParameter.value = newVal.key;
}, { immediate: true });

onMounted(async () => {
    activeTabId.value = await getActiveTabId();
    await fetchSessionStorageData();
});
</script>

<template>
    <div>
        <SelectFilterComponent
            :filtered="filteredGroups"
            :selected="selectedGroup"
            placeholder="Grup Ara..."
            @onSelect="onGroupSelect"
        />

        <SelectFilterComponent
            :disabled="!selectedGroup"
            :filtered="filteredParameters.map((x) => x.key)"
            :selected="selectedParameter"
            placeholder="Parametre Ara..."
            @onSelect="onParameterSelect"
        />

        <ValueEditor
            :value="parameterValue"
            label="Değer"
            :disabled="!selectedParameter"
            update-text="Güncelle"
            @update:value="parameterValue = $event"
            @updateClick="updateConfigValue"
        />
    </div>
</template>
