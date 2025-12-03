<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef } from "vue";
import SelectFilterComponent from "./SelectFilterComponent.vue";
import ValueEditor from "./ValueEditor.vue";

const claimsData = ref<{ key: string; value: string }[]>([]);
const claimsKey = shallowRef("");
const selectedClaim = shallowRef("");
const claimValue = ref(null);
const filteredClaims = ref<string[]>([]);

const activeTabId = ref<number | null>(null);

const getActiveTabId = async () =>
    new Promise<number | null>((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
            resolve(tabs?.[0]?.id ?? null),
        ),
    );

const fetchClaimsData = async () => {
    if (!activeTabId.value) return;

    chrome.scripting.executeScript(
        {
            target: { tabId: activeTabId.value },
            func: () => {
                const keys = Object.keys(sessionStorage).filter((k) => k.includes("getClaims"));
                return keys.map((key) => ({
                    key,
                    value: sessionStorage.getItem(key) || "",
                }));
            },
        },
        (res) => {
            claimsData.value = res?.[0]?.result ?? [];
            claimsKey.value = claimsData.value?.[0]?.key || "";
        },
    );
};

const claimsDisplayList = computed(() =>
    claimsData.value
        .map((item) => {
            try {
                const parsed = JSON.parse(item.value);
                return Object.keys(parsed)[0];
            } catch {
                return "";
            }
        })
        .filter((x) => x),
);

const selectedClaimDisplay = computed(() => {
    const item = claimsData.value.find((c) => c.key === claimsKey.value);
    if (!item) return "";

    try {
        const parsed = JSON.parse(item.value);
        return Object.keys(parsed)[0];
    } catch {
        return "";
    }
});

const selectClaimKey = (rootName: string) => {
    const match = claimsData.value.find((item) => {
        try {
            const parsed = JSON.parse(item.value);
            return Object.keys(parsed)[0] === rootName;
        } catch {
            return false;
        }
    });

    claimsKey.value = match?.key || "";
    filterClaimParameters();
};

const filterClaimParameters = () => {
    selectedClaim.value = "";
    filteredClaims.value = [];

    const item = claimsData.value.find((x) => x.key === claimsKey.value);
    if (!item) return;

    const parsed = JSON.parse(item.value);
    const root = Object.keys(parsed)[0];

    filteredClaims.value = Object.keys(parsed[root] || {});
};

const showClaimValue = () => {
    const item = claimsData.value.find((x) => x.key === claimsKey.value);
    if (!item) return;

    const parsed = JSON.parse(item.value);
    const root = Object.keys(parsed)[0];

    claimValue.value = parsed[root][selectedClaim.value];
};

const updateClaimValue = () => {
    const item = claimsData.value.find((x) => x.key === claimsKey.value);
    if (!item) return;

    const parsed = JSON.parse(item.value);
    const root = Object.keys(parsed)[0];

    parsed[root][selectedClaim.value] = claimValue.value;
    item.value = JSON.stringify(parsed);

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value ?? 0 },
        func: (it) => sessionStorage.setItem(it.key, it.value),
        args: [item],
    });

    chrome.scripting.executeScript({
        target: { tabId: activeTabId.value ?? 0 },
        func: () => location.reload(),
    });
};

watch(claimsKey, filterClaimParameters);
watch(selectedClaim, showClaimValue);

onMounted(async () => {
    activeTabId.value = await getActiveTabId();
    await fetchClaimsData();
});
</script>

<template>
    <div>
        <SelectFilterComponent
            :filtered="claimsDisplayList"
            :selected="selectedClaimDisplay"
            placeholder="Grup Ara..."
            class="select-filter"
            @onSelect="selectClaimKey"
        />

        <SelectFilterComponent
            :disabled="!claimsKey"
            :filtered="filteredClaims"
            :selected="selectedClaim"
            placeholder="Yetki Ara..."
            @onSelect="(val) => (selectedClaim = val)"
        />

        <ValueEditor
            :value="claimValue"
            label="Değer"
            :disabled="!selectedClaim"
            update-text="Güncelle"
            @update:value="claimValue = $event"
            @updateClick="updateClaimValue"
        />
    </div>
</template>
