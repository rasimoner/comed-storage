<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import SelectFilterComponent from "./SelectFilterComponent.vue";

const storageData = ref<{ key: string; value: string }[]>([]);
const storageKey = ref("");
const selectedGroup = ref("");
const selectedParameter = ref("");
const parameterValue = ref<string | boolean | number | null>(null);
const parameterValueAsString = ref("");
const filteredGroups = ref<string[]>([]);
const filteredParameters = ref<{ key: string; value: any }[]>([]);

const isLoading = ref(false);
const activeTabId = ref<number | null>(null);

const onSelectGroup = (group: string) => (selectedGroup.value = group);
const onSelectParameter = (parameter: string) => (selectedParameter.value = parameter);

const filterGroups = () => {
    const selectedGroupData = storageData.value.find((item) => item.key === storageKey.value);
    if (!selectedGroupData) return (filteredGroups.value = []);

    const parsedValue = JSON.parse(selectedGroupData.value);
    filteredGroups.value = Object.keys(parsedValue);
};

const filterParameters = () => {
    selectedParameter.value = "";
    const selectedGroupData = storageData.value.find((item) => item.key === storageKey.value);
    if (!selectedGroupData) return (filteredParameters.value = []);

    const parsedValue = JSON.parse(selectedGroupData.value);
    const groupData = parsedValue[selectedGroup.value] || {};
    filteredParameters.value = Object.keys(groupData).map((key) => ({
        key,
        value: groupData[key],
    }));
};

const showParameterValue = () => {
    const selectedParam = filteredParameters.value.find(
        (param) => param.key === selectedParameter.value,
    );
    parameterValue.value = selectedParam?.value ?? null;
};

const applyArrayValue = () => {
    try {
        parameterValue.value = JSON.parse(parameterValueAsString.value);
    } catch (error) {
        alert("Geçersiz JSON formatı! Lütfen doğru bir JSON array girin.");
    }
};

const validateInput = (event: Event) => {
    const inputValue = (event.target as HTMLInputElement).value;
    if (!inputValue || isNaN(Number(inputValue))) parameterValue.value = 0;
};

const updateValue = () => {
    const selectedGroupData = storageData.value.find((item) => item.key === storageKey.value);
    if (selectedGroupData) {
        const parsedValue = JSON.parse(selectedGroupData.value);
        if (selectedGroup.value in parsedValue) {
            parsedValue[selectedGroup.value][selectedParameter.value] = parameterValue.value;
            selectedGroupData.value = JSON.stringify(parsedValue);
        }
        updateSessionStorageData();
        refreshPage();
    }
};

const getActiveTabId = async (): Promise<number | null> =>
    new Promise((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
            resolve(!!tabs?.[0]?.id ? tabs[0].id : null),
        ),
    );

const fetchSessionStorageData = async () => {
    if (activeTabId.value === null) return console.error("Aktif sekme bulunamadı.");

    isLoading.value = true;
    chrome.scripting.executeScript(
        {
            target: { tabId: activeTabId.value },
            func: () => {
                const keys = Object.keys(sessionStorage).filter((key) =>
                    key.includes("getConfigurations"),
                );
                return keys.map((key) => ({
                    key,
                    value: sessionStorage.getItem(key) || "",
                }));
            },
        },
        (results) => {
            if (results && results[0]?.result) storageData.value = results[0].result;
            isLoading.value = false;
        },
    );
};

const updateSessionStorageData = () => {
    if (activeTabId.value === null) return console.error("Aktif sekme bulunamadı.");

    storageData.value.forEach((data) => {
        if (activeTabId.value === null) return;

        chrome.scripting.executeScript({
            target: { tabId: activeTabId.value },
            func: (item: { key: string; value: string }) =>
                sessionStorage.setItem(item.key, item.value),
            args: [data],
        });
    });
};

const refreshPage = () => {
    if (activeTabId.value === null) return console.error("Aktif sekme bulunamadı.");

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value },
        func: () => location.reload(),
    });
};

const filteredParameterList = computed(() => filteredParameters.value?.map((x) => x.key) ?? []);

onMounted(async () => {
    activeTabId.value = await getActiveTabId();
    if (activeTabId.value === null) return console.error("Aktif sekme bulunamadı.");

    await fetchSessionStorageData();
});

watch(
    () => [storageData.value],
    () => {
        storageKey.value = storageData.value?.[0]?.key;
    },
    { immediate: true, deep: true },
);
watch(
    () => storageKey.value,
    () => {
        filterGroups();
    },
);

watch(
    () => selectedGroup.value,
    () => {
        filterParameters();
    },
);

watch(
    () => selectedParameter.value,
    () => {
        showParameterValue();
    },
);
watch(
    () => parameterValue.value,
    (newValue) => {
        if (Array.isArray(newValue))
            parameterValueAsString.value = JSON.stringify(newValue, null, 2);
    },
    { immediate: true },
);
</script>

<template>
    <div>
        <h1 style="margin-bottom: 20px; text-align: center">Comed SessionStorage</h1>
        <div v-if="isLoading">Yükleniyor...</div>
        <div v-else style="display: flex; flex-direction: column; gap: 12px">
            <SelectFilterComponent
                key="group"
                :filtered="filteredGroups"
                :selected="selectedGroup"
                placeholder="Grup Ara..."
                @onSelect="onSelectGroup"
            />
            <SelectFilterComponent
                key="parameter"
                :disabled="!selectedGroup"
                :filtered="filteredParameterList"
                :selected="selectedParameter"
                placeholder="Parametre Ara..."
                @onSelect="onSelectParameter"
            />
            <div>
                <label>Değer:</label>
                <div v-if="Array.isArray(parameterValue)">
                    <textarea
                        v-model="parameterValueAsString"
                        placeholder="JSON formatında array girin"
                        style="width: calc(100% - 12px); height: 100px"
                    />
                    <button @click="applyArrayValue">Uygula</button>
                </div>
                <input
                    v-else-if="typeof parameterValue === 'number'"
                    v-model.number="parameterValue"
                    min="0"
                    type="number"
                    @input="validateInput"
                />
                <input
                    v-else-if="typeof parameterValue === 'boolean'"
                    v-model="parameterValue"
                    type="checkbox"
                />
                <input
                    v-else
                    v-model="parameterValue"
                    :disabled="!selectedParameter"
                    :style="{
                        color: !selectedParameter ? 'rgb(170, 170, 170)' : 'rgb(84, 84, 84)',
                        opacity: !selectedParameter ? '0.7' : '1',
                        cursor: !selectedParameter ? 'not-allowed' : 'text',
                    }"
                    placeholder="Metin girin"
                    style="width: calc(100% - 25px); padding: 5px"
                    type="text"
                />
            </div>
        </div>
        <div style="width: calc(100% - 12px); display: flex; padding-top: 10px">
            <span style="width: calc(100% - 12px)"></span>
            <button :disabled="!selectedParameter" style="height: 30px" @click="updateValue">
                Güncelle
            </button>
        </div>
    </div>
</template>
