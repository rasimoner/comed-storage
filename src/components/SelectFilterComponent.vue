<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useKeyboardNavigation } from "@/composables/useKeyboardNavigation";

const props = defineProps<{
    selected: string;
    filtered: string[];
    placeholder: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (event: "onSelect", value: string): void;
}>();

const searchedItems = shallowRef<string[]>([]);
const searchQuery = shallowRef("");
const isDropdownVisible = shallowRef(false);
const wrapperRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
const { highlightedIndex, moveDown, moveUp, enterSelect, reset } = useKeyboardNavigation({
    items: searchedItems,
    itemRefs,
    onSelect: (value) => selectGroup(value),
});

const handleClickOutside = (e: MouseEvent) => {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isDropdownVisible.value = false;
    }
};

const onSearchItems = () => {
    searchedItems.value = props.filtered.filter((group) =>
        group.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
};

const selectGroup = (group: string) => {
    isDropdownVisible.value = false;
    emit("onSelect", group);
};

const toggleDropdown = async () => {
    if (props.disabled) return;

    isDropdownVisible.value = !isDropdownVisible.value;
    searchQuery.value = "";
    searchedItems.value = props.filtered;

    if (isDropdownVisible.value) {
        await nextTick();
        searchInputRef.value?.focus();
    }
};

const clearDropdown = () => {
    isDropdownVisible.value = false;
    searchQuery.value = "";
    searchedItems.value = props.filtered;
    emit("onSelect", "");
};

watch(isDropdownVisible, (open) => {
    if (!open) {
        reset();
    }
});

onMounted(() => {
    document.addEventListener("mousedown", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<template>
    <div class="select-filter" ref="wrapperRef">
        <div class="custom-select" :class="{ disabled: props.disabled }" @click="toggleDropdown">
            <!-- Placeholder -->
            <div
                v-if="!searchQuery && !selected && !isDropdownVisible"
                class="custom-select-placeholder"
            >
                <span>{{ placeholder }}</span>
                <span class="custom-select-arrow">↓</span>
            </div>

            <!-- Search input -->
            <template v-else-if="isDropdownVisible">
                <input
                    ref="searchInputRef"
                    v-model="searchQuery"
                    :placeholder="placeholder"
                    @keydown.down.prevent="moveDown"
                    @keydown.up.prevent="moveUp"
                    @keydown.enter.prevent="enterSelect"
                    @input="onSearchItems"
                    @click.stop
                />
                <span class="custom-select-arrow" @click.stop="clearDropdown">↑</span>
            </template>

            <span v-else class="custom-select-value">
                {{ selected }}
            </span>
        </div>

        <div v-if="isDropdownVisible" class="custom-select-dropdown">
            <div
                v-for="(group, index) in searchedItems"
                :key="group"
                :ref="(el) => (itemRefs[index] = el as HTMLElement)"
                class="custom-select-item"
                :class="['custom-select-item', highlightedIndex === index && 'highlighted']"
                @click="selectGroup(group)"
            >
                {{ group }}
            </div>
        </div>
    </div>
</template>
