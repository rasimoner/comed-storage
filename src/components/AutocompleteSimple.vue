<template>
    <div class="autocomplete-simple" ref="wrapper">
        <div class="autocomplete-input-wrapper">
            <input
                ref="inputRef"
                type="text"
                :placeholder="placeholder"
                v-model="searchText"
                @focus="open = true"
                @input="filterItems"
                @keydown.down.prevent="moveDown"
                @keydown.up.prevent="moveUp"
                @keydown.enter.prevent="enterSelect"
                class="autocomplete-input"
            />
        </div>

        <ul v-if="open && filtered.length" class="autocomplete-dropdown">
            <li
                v-for="(item, index) in filtered"
                :key="`${item.key}.${item.group}`"
                ref="itemsRef"
                @click="select(item)"
                :class="['autocomplete-item', highlightedIndex === index ? 'highlighted' : '']"
            >
                <span class="group-label">({{ item.group }})</span> {{ item.label }}
            </li>
        </ul>
    </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ConfigItem } from "@/types/config-item.interface";

const props = defineProps<{
    modelValue: ConfigItem | null;
    items: ConfigItem[];
    placeholder?: string;
    showConfigurations: boolean;
}>();

const emit = defineEmits(["update:modelValue", "input"]);

const searchText = ref("");
const filtered = ref<ConfigItem[]>([]);
const open = ref(false);
const wrapper = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const highlightedIndex = ref(-1);
const itemsRef = ref<HTMLElement[]>([]);

watch(
    () => props.showConfigurations,
    () => {
        searchText.value = "";
        filtered.value = [];
    },
    { immediate: true },
);

watch(highlightedIndex, (i) => {
    if (i < 0) return;

    const el = itemsRef.value[i];
    if (!el) return;

    el.scrollIntoView({
        block: "nearest",
    });
});

const filterItems = () => {
    filtered.value = [];
    if (searchText.value.length < 3) return;

    const q = searchText.value.toLowerCase();
    filtered.value = props.items.filter((i) => i.label.toLowerCase().includes(q));

    open.value = true;

    if (filtered.value.length === 1) {
        select(filtered.value[0]);
        highlightedIndex.value = -1;
    }
};

const select = (item: ConfigItem) => {
    searchText.value = item.label;
    filtered.value = [];
    open.value = false;

    emit("update:modelValue", item);
};

const moveDown = () => {
    if (!open.value || !filtered.value.length) return;
    highlightedIndex.value = (highlightedIndex.value + 1) % filtered.value.length;
};

const moveUp = () => {
    if (!open.value || !filtered.value.length) return;
    highlightedIndex.value =
        (highlightedIndex.value - 1 + filtered.value.length) % filtered.value.length;
};

const enterSelect = () => {
    if (!open.value || highlightedIndex.value < 0) return;
    select(filtered.value[highlightedIndex.value]);
};

const clickHandler = (e: MouseEvent) => {
    if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
        open.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", clickHandler);
    setTimeout(() => {
        inputRef.value?.focus();
    }, 0);
});
onBeforeUnmount(() => document.removeEventListener("click", clickHandler));
</script>