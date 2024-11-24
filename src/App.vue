<script lang="ts" setup>
import { onMounted, ref } from "vue";

const storageData = ref<{ key: string; value: string }[]>([]);
const isLoading = ref(false);
const activeTabId = ref<number | null>(null);

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

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value },
        func: (data) => {
            data.forEach(({ key, value }: { key: string; value: string }) =>
                sessionStorage.setItem(key, value),
            );
        },
        args: [storageData.value],
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
    if (activeTabId.value !== null) await fetchSessionStorageData();
    else console.error("Aktif sekme bulunamadı.");
});
</script>

<template>
    <div>
        <h1>SessionStorage Editor</h1>
        <button :disabled="isLoading" @click="fetchSessionStorageData">Verileri Yenile</button>
        <div v-if="isLoading">Yükleniyor...</div>
        <div v-else>
            <div v-for="item in storageData" :key="item.key" class="storage-item">
                <label>{{ item.key }}</label>
                <input v-model="item.value" placeholder="Değer girin" type="text" />
            </div>
            <button @click="updateSessionStorageData">Güncelle</button>
            <button @click="refreshPage">Sayfayı Yenile</button>
        </div>
    </div>
</template>

<style scoped>
.storage-item {
    margin-bottom: 10px;
}
</style>
