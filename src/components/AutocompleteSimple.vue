<template>
    <div class="autocomplete-simple" ref="wrapper">
        <input
            type="text"
            :placeholder="placeholder"
            v-model="searchText"
            @focus="open = true"
            @input="filterItems"
            class="autocomplete-input"
        />

        <ul v-if="open && filtered.length" class="autocomplete-dropdown">
            <li
                v-for="item in filtered"
                :key="item.value"
                @click="select(item)"
                class="autocomplete-item"
            >
               <span class="group-label">{{ `(${item.group})` }}</span>   {{ item.label }}
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ConfigItem } from "@/types/config-item.interface";

const props = defineProps<{
    value: ConfigItem | null;
    items: ConfigItem[];
    placeholder?: string;
}>();

const emit = defineEmits(["update:value", "input"]);

const searchText = ref("");
const filtered = ref<any[]>([]);
const open = ref(false);
const wrapper = ref<HTMLElement | null>(null);

watch(
    () => props.value,
    (val) => {
        if (val && val.label) {
            searchText.value = val.label;
        }
    },
    { immediate: true }
);

const filterItems = () => {
    if(searchText.value.length < 3) return;

    const q = searchText.value?.toLowerCase();
    filtered.value = props.items?.filter((i) =>
        i.label?.toLowerCase().includes(q)
    );
    open.value = true;
};

const select = (item: any) => {
    searchText.value = "";
    filtered.value = []
    open.value = false;

    emit("update:value", item);
    emit("input", item);
};

const clickHandler = (e: MouseEvent) => {
    if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
        open.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", clickHandler);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", clickHandler);
});
</script>

<style>

</style>