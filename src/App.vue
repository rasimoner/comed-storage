<template>
    <div class="app">
        <h1 style="margin-bottom: 20px; text-align: center">Comed Session Storage</h1>
        <ToggleSwitch v-model="showConfigurations" />
        <AutocompleteSimple v-model="selected" :items="options" placeholder="Arama yap..." @update:value="updateSelections"/>
        <ConfigurationsPanel v-if="showConfigurations" @storage-fetched="handleData" :selected="selected"/>
        <ClaimsPanel v-else :selected="selected" @storage-fetched="handleData"/>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import ConfigurationsPanel from "./components/ConfigurationsPanel.vue";
import ClaimsPanel from "./components/ClaimsPanel.vue";
import ToggleSwitch from "./components/ToggleSwitch.vue";
import AutocompleteSimple from "./components/AutocompleteSimple.vue";

const showConfigurations = shallowRef(true);
const options = ref([]);
const selected = ref(null);

const updateSelections = (value) => selected.value = value;

const handleData = (rawList) => {
    const allConfigs = {};

    rawList.forEach(item => {
        try {
            const parsed = JSON.parse(item.value);
            Object.assign(allConfigs, parsed);
        } catch (err) {
            console.warn("JSON Parse error:", err);
        }
    });

    options.value = flattenConfigs(allConfigs);
};

const flattenConfigs = (data) => {
    const items = [];

    for (const group in data) {
        const groupObj = data[group];

        if (typeof groupObj === "object" && groupObj !== null && !Array.isArray(groupObj)) {
            for (const param in groupObj) {
                items.push({
                    label: param,
                    group: group,
                    key: param,
                    value: groupObj[param]
                });
            }
        }
    }
    return items;
}
</script>