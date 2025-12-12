<script setup lang="ts">
import { ref, watch, onMounted, shallowRef } from "vue";
import SelectFilterComponent from "./SelectFilterComponent.vue";
import ValueEditor from "./ValueEditor.vue";
import { ConfigItem } from "@/types/config-item.interface";

const props = defineProps<{
    selected?: ConfigItem | null;
}>();
const emit = defineEmits<{
    (event: "storage-fetched", value: { key: string; value: string }[]): void;
}>();

const claimsData = ref<{ key: string; value: string }[]>([]);
const claimsKey = shallowRef("");
const selectedClaim = shallowRef("");
const selectedGroup = shallowRef("");
const claimValue = ref(null);
const filteredClaims = ref<{ key: string; value: any }[]>([]);
const activeTabId = ref<number | null>(null);
const filteredGroups = ref<string[]>([]);
const claimValueAsString = shallowRef("");
const isUserSelecting = ref(false);

const getActiveTabId = async () =>
    new Promise<number | null>((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
            resolve(tabs?.[0]?.id ?? null),
        ),
    );

const onGroupSelected = (val: string) => {
    isUserSelecting.value = true;
    selectedGroup.value = val;
    const match = findClaimConfigByGroup(val);

    claimsKey.value = match?.key || "";
};

const findClaimConfigByGroup = (val: string) => {
    return claimsData.value.find((item) => {
        try {
            const parsed = JSON.parse(item.value);
            return Object.keys(parsed)[0] === val;
        } catch {
            return false;
        }
    });
};

const onClaimSelected = (val: string) => {
    isUserSelecting.value = true;
    selectedClaim.value = val;
};

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

            emit("storage-fetched", claimsData.value);
        },
    );
};

const filterGroups = () => {
    filteredGroups.value = claimsData.value
        .map((item) => {
            try {
                const parsed = JSON.parse(item.value);
                return Object.keys(parsed)[0];
            } catch {
                return null;
            }
        })
        .filter((x): x is string => x !== null);
};

const filterClaimParameters = () => {
    const match = findClaimConfigByGroup(selectedGroup.value);

    if (!match) return (filteredClaims.value = []);

    const parsed = JSON.parse(match.value);
    const groupData = parsed[selectedGroup.value];

    filteredClaims.value = Object.keys(groupData).map((k) => ({
        key: k,
        value: groupData[k],
    }));
};

const showParameterValue = () => {
    if (!selectedClaim.value) {
        return (claimValue.value = null);
    }
    const found = filteredClaims.value.find((x) => x.key === selectedClaim.value);
    claimValue.value = found?.value ?? null;
};

const updateClaimValue = () => {
    const item = claimsData.value.find((x) => x.key === claimsKey.value);
    if (!item) return;

    const parsed = JSON.parse(item.value);
    parsed[selectedGroup.value][selectedClaim.value] = claimValue.value;
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

const clear = () => {
    selectedGroup.value = "";
    selectedClaim.value = "";
};

watch(claimsKey, filterGroups);
watch(selectedGroup, filterClaimParameters);
watch(selectedClaim, showParameterValue);

watch(claimValue, (val) => {
    if (Array.isArray(val)) claimValueAsString.value = JSON.stringify(val, null, 2);
});

watch(
    () => props.selected,
    async (newVal) => {
        if (!newVal) return;

        isUserSelecting.value = false;
        selectedGroup.value = newVal.group;
        selectedClaim.value = newVal.key;
        const match = findClaimConfigByGroup(selectedGroup.value);

        claimsKey.value = match?.key || "";
    },
);

onMounted(async () => {
    activeTabId.value = await getActiveTabId();
    await fetchClaimsData();
    clear();
});
</script>

<template>
    <div>
        <SelectFilterComponent
            :filtered="filteredGroups"
            :selected="selectedGroup"
            placeholder="Grup Ara..."
            class="select-filter"
            @onSelect="onGroupSelected"
        />

        <SelectFilterComponent
            :disabled="!selectedGroup"
            :filtered="filteredClaims.map((x) => x.key)"
            :selected="selectedClaim"
            placeholder="Yetki Ara..."
            @onSelect="onClaimSelected"
        />

        <ValueEditor
            v-model="claimValue"
            label="Değer"
            :disabled="!selectedClaim"
            update-text="Güncelle"
            @updateClick="updateClaimValue"
        />
    </div>
</template>
