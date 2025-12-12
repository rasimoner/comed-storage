<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

const props = defineProps<{
    selected: string;
    filtered: string[];
    placeholder: string;
    disabled?: boolean;
}>();
const emit = defineEmits<{ (event: "onSelect", value: string): void }>();

const searchedItems = shallowRef<string[]>([]);
const searchQuery = shallowRef("");
const isDropdownVisible = shallowRef(false);
const wrapperRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const handleClickOutside = (e: MouseEvent) => {
    if (!wrapperRef.value) return;

    if (!wrapperRef.value.contains(e.target as Node)) {
        isDropdownVisible.value = false;
    }
};

const onSearchItems = () =>
    (searchedItems.value = props.filtered.filter((group) =>
        group.toLowerCase().includes(searchQuery.value.toLowerCase()),
    ));

const selectGroup = (group: string) => {
    isDropdownVisible.value = false;
    onSelect(group);
};
const onSelect = (value: string) => emit("onSelect", value);

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
    onSelect("");
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
        <div :class="['custom-select', { disabled: props.disabled }]" @click="toggleDropdown">
            <div
                v-if="!searchQuery && !selected && !isDropdownVisible"
                style="display: flex; color: #aaa; width: 100%"
            >
                <span style="width: 100%">{{ placeholder }}</span>
                <span>↓</span>
            </div>
            <template v-else-if="isDropdownVisible">
                <input
                    ref="searchInputRef"
                    v-model="searchQuery"
                    :placeholder="placeholder"
                    autofocus
                    style="width: 100%; border: none; outline: none"
                    @input="onSearchItems"
                    @click.stop
                />
                <div style="color: #aaa" @click.stop="clearDropdown">↑</div>
            </template>
            <span v-else> {{ selected }}</span>
        </div>
        <div
            v-if="isDropdownVisible"
            style="
                border: 1px solid #ccc;
                position: absolute;
                width: 100%;
                max-height: 200px;
                overflow-y: auto;
                background: white;
                z-index: 10;
            "
        >
            <div
                v-for="group in searchedItems"
                :key="group"
                style="padding: 8px; cursor: pointer"
                @click="selectGroup(group)"
            >
                {{ group }}
            </div>
        </div>
    </div>
</template>