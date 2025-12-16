<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

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
                    @input="onSearchItems"
                    @click.stop
                />
                <span class="custom-select-arrow" @click.stop="clearDropdown">↑</span>
            </template>

            <!-- Selected value -->
            <span v-else class="custom-select-value">
                {{ selected }}
            </span>
        </div>

        <!-- Dropdown -->
        <div v-if="isDropdownVisible" class="custom-select-dropdown">
            <div
                v-for="group in searchedItems"
                :key="group"
                class="custom-select-item"
                @click="selectGroup(group)"
            >
                {{ group }}
            </div>
        </div>
    </div>
</template>
