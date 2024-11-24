<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";

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

const filterGroups = () => {
    const selectedGroupData = storageData.value.find((item) => item.key === storageKey.value);
    if (!selectedGroupData) return (filteredGroups.value = []);

    const parsedValue = JSON.parse(selectedGroupData.value);
    filteredGroups.value = Object.keys(parsedValue);
};

const filterParameters = () => {
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
    <div style="width: 600px">
        <h1>SessionStorage Editor</h1>
        <div v-if="isLoading">Yükleniyor...</div>
        <div v-else style="display: flex; flex-direction: column; gap: 12px">
            <div>
                <select v-model="selectedGroup" style="width: calc(100% - 12px)">
                    <option v-for="group in filteredGroups" :key="group" :value="group">
                        {{ group }}
                    </option>
                </select>
            </div>
            <div>
                <select v-model="selectedParameter" style="width: calc(100% - 12px)">
                    <option
                        v-for="parameter in filteredParameters"
                        :key="parameter.key"
                        :value="parameter.key"
                    >
                        {{ parameter.key }}
                    </option>
                </select>
            </div>
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
                    type="number"
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
                    placeholder="Metin girin"
                    style="width: calc(100% - 12px)"
                    type="text"
                />
            </div>
            <button :disabled="!selectedParameter" @click="updateValue">Güncelle</button>
        </div>
    </div>
</template>

<style scoped>
h1 {
    margin-bottom: 20px;
}
</style>
