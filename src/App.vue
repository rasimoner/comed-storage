<template>
    <div class="app">
        <h1 style="margin-bottom: 20px; text-align: center">Comed Session Storage</h1>
        <ToggleSwitch
            v-model="showConfigurations"
        />
        <ConfigurationsPanel v-if="showConfigurations" />
        <ClaimsPanel v-else />
    </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import ConfigurationsPanel from "./components/ConfigurationsPanel.vue";
import ClaimsPanel from "./components/ClaimsPanel.vue";
import ToggleSwitch from "./components/ToggleSwitch.vue";

const showConfigurations = shallowRef(true);
</script>