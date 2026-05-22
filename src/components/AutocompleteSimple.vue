<template>
    <div class="autocomplete-simple" ref="wrapper">
        <div class="autocomplete-input-wrapper">
            <span class="search-icon">🔍︎</span>
            <input
                ref="inputRef"
                name="autocomplete-simple"
                type="text"
                :placeholder="placeholder"
                v-model="searchText"
                @focus="handleFocus"
                @input="filterItems"
                @keydown.down.prevent="moveDown"
                @keydown.up.prevent="moveUp"
                @keydown.enter.prevent="enterSelect"
                class="autocomplete-input"
            />
            <button
                type="button"
                class="recent-toggle"
                :class="{ active: recentOpen }"
                title="Son kullanılanlar"
                aria-label="Son kullanılanlar"
                :aria-expanded="recentOpen"
                @click.stop="toggleRecentDropdown"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" class="recent-toggle-icon">
                    <path
                        d="M3 12a9 9 0 1 0 3-6.7"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                    />
                    <path
                        d="M3 4v5h5"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                    />
                    <path
                        d="M12 7v5l3 2"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                    />
                </svg>
            </button>
        </div>

        <ul v-if="recentOpen" class="recent-dropdown">
            <li v-if="!recentItems?.length" class="recent-empty">Son kullanılan yok</li>
            <template v-else>
                <li
                    v-for="recentItem in recentItems"
                    :key="recentItem"
                    class="recent-item"
                    @click="selectRecent(recentItem)"
                >
                    {{ recentItem }}
                </li>
            </template>
        </ul>

        <ul v-if="open && filtered.length" class="autocomplete-dropdown">
            <li
                v-for="(item, index) in filtered"
                :key="`${item.key}.${item.group}`"
                :ref="(el) => (itemsRef[index] = el as HTMLElement)"
                @click="select(item)"
                :class="['autocomplete-item', highlightedIndex === index && 'highlighted']"
            >
                <span class="group-label">({{ item.group }})</span> {{ item.label }}
            </li>
        </ul>
    </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ConfigItem } from "@/types/config-item.interface";
import { useKeyboardNavigation } from "@/composables/useKeyboardNavigation";

const props = withDefaults(
    defineProps<{
        modelValue: ConfigItem | null;
        items: ConfigItem[];
        placeholder?: string;
        showConfigurations: boolean;
        recentItems?: string[];
    }>(),
    {
        placeholder: "Arama yap...",
        recentItems: () => [],
    },
);

const emit = defineEmits<{
    (event: "update:modelValue", value: ConfigItem | null): void;
    (event: "input", value: string): void;
    (event: "select-recent", value: string): void;
}>();

const searchText = ref("");
const filtered = ref<ConfigItem[]>([]);
const open = ref(false);
const recentOpen = ref(false);
const wrapper = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const itemsRef = ref<HTMLElement[]>([]);

const { highlightedIndex, moveDown, moveUp, enterSelect, reset } = useKeyboardNavigation({
    items: filtered,
    itemRefs: itemsRef,
    onSelect: (item) => select(item),
});

watch(
    () => props.showConfigurations,
    () => {
        searchText.value = "";
        filtered.value = [];
        open.value = false;
        recentOpen.value = false;
    },
    { immediate: true },
);

watch(
    () => props.modelValue,
    (item) => {
        searchText.value = item?.label ?? "";
    },
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
    recentOpen.value = false;
    filtered.value = [];
    emit("input", searchText.value);

    const query = searchText.value.trim();

    if (query.length < 3) return;

    const q = query.toLowerCase();
    filtered.value = props.items.filter((i) => i.label.toLowerCase().includes(q));

    open.value = true;

    if (filtered.value.length === 1) {
        select(filtered.value[0]);
        highlightedIndex.value = -1;
    }
};

const handleFocus = () => {
    open.value = true;
    recentOpen.value = false;
};

const select = (item: ConfigItem) => {
    searchText.value = item.label;
    filtered.value = [];
    open.value = false;
    recentOpen.value = false;
    reset();
    emit("update:modelValue", item);
};

const toggleRecentDropdown = () => {
    recentOpen.value = !recentOpen.value;
    open.value = false;
    filtered.value = [];
    reset();
};

const selectRecent = (value: string) => {
    const normalized = value.trim();

    if (!normalized) return;

    searchText.value = normalized;
    recentOpen.value = false;
    open.value = false;
    filtered.value = [];
    reset();
    emit("select-recent", normalized);
};

const clickHandler = (e: MouseEvent) => {
    if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
        open.value = false;
        recentOpen.value = false;
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
