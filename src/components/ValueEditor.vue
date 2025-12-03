<template>
    <div class="value-editor">
        <label v-if="label">{{ label }}</label>
        <div v-if="Array.isArray(localValue)">
            <textarea v-model="arrayText" class="value-textarea"></textarea>
            <button @click="applyArray" class="update-btn">Uygula</button>
        </div>

        <input
            v-else-if="typeof localValue === 'boolean'"
            type="checkbox"
            v-model="localValue"
            class="boolean-checkbox"
        />

        <input
            v-else-if="typeof localValue === 'number'"
            type="number"
            v-model.number="localValue"
            class="number-checkbox"
        />

        <input v-else type="text" v-model="localValue" class="textArea-div" />
        <div class="update-button">
            <button :disabled="disabled" @click="emitUpdate" class="update-btn">
                {{ updateText }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";

const props = defineProps<{
    value: any;
    label?: string;
    disabled?: boolean;
    updateText?: string;
}>();

const emit = defineEmits(["update:value", "apply", "updateClick"]);

const localValue = ref(null);
const arrayText = shallowRef("");

watch(
    () => props.value,
    (val) => {
        localValue.value = structuredClone(val);
        if (Array.isArray(val)) {
            arrayText.value = JSON.stringify(val, null, 2);
        }
    },
);

watch(localValue, (val) => {
    emit("update:value", val);
});

const applyArray = () => {
    try {
        emit("update:value", JSON.parse(arrayText.value));
    } catch {
        alert("Geçersiz JSON formatı!");
    }
};

const emitUpdate = () => {
    emit("updateClick");
};


</script>
