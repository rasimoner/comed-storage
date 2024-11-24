<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
    selected: string;
    filtered: string[];
    placeholder: string;
    disabled?: boolean;
}>();
const emit = defineEmits<{ (event: "onSelect", value: string): void }>();

const searchedItems = ref<string[]>([]);
const searchQuery = ref("");
const isDropdownVisible = ref(false);

const onSearchItems = () =>
    (searchedItems.value = props.filtered.filter((group) =>
        group.toLowerCase().includes(searchQuery.value.toLowerCase()),
    ));

const selectGroup = (group: string) => {
    isDropdownVisible.value = false;
    onSelect(group);
};
const onSelect = (value: string) => emit("onSelect", value);

const toggleDropdown = () => {
    if (props.disabled) return;

    isDropdownVisible.value = !isDropdownVisible.value;
    searchQuery.value = "";
    searchedItems.value = props.filtered;
};

const clearDropdown = () => {
    isDropdownVisible.value = false;
    searchQuery.value = "";
    searchedItems.value = props.filtered;
    onSelect("");
};
</script>

<template>
    <div style="position: relative; width: calc(100% - 12px)">
        <div
            :style="{
                opacity: disabled ? '0.7' : '1',
                backgroundColor: disabled ? 'rgba(239, 239, 239, 0.3)' : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }"
            class="custom-select"
            style="display: flex; border: 1px solid #ccc; padding: 8px"
            @click="toggleDropdown"
        >
            <div
                v-if="!searchQuery && !selected && !isDropdownVisible"
                style="display: flex; color: #aaa; width: 100%"
            >
                <span style="width: 100%">{{ placeholder }}</span>
                <span>↓</span>
            </div>
            <template v-else-if="isDropdownVisible">
                <input
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
