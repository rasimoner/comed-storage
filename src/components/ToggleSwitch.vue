<template>
    <div class="segmented-switch">
        <div
            class="segment"
            :class="{ active: modelValue }"
            @click="emit('update:modelValue', true)"
        >
            {{ left }}
        </div>

        <div
            class="segment"
            :class="{ active: !modelValue }"
            @click="emit('update:modelValue', false)"
        >
            {{ right }}
        </div>

        <div
            class="slider-bg"
            :class="{ right: !modelValue }"
        ></div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean;
}>();

const left = "Parametre";
const right = "Yetki";


const emit = defineEmits(["update:modelValue"]);
</script>
