import { ref, watch, type Ref } from "vue";
import { UseKeyboardNavigationOptions } from "@/types/use-keyboard-navigation-options.interface";

export function useKeyboardNavigation<T>({
    items,
    onSelect,
    itemRefs,
}: UseKeyboardNavigationOptions<T>) {
    const highlightedIndex = ref(-1);

    const moveDown = () => {
        if (!items.value.length) return;
        highlightedIndex.value = (highlightedIndex.value + 1) % items.value.length;
    };

    const moveUp = () => {
        if (!items.value.length) return;
        highlightedIndex.value =
            (highlightedIndex.value - 1 + items.value.length) % items.value.length;
    };

    const enterSelect = () => {
        if (highlightedIndex.value < 0) return;
        const item = items.value[highlightedIndex.value];
        if (item) onSelect(item);
    };

    if (itemRefs) {
        watch(highlightedIndex, (i) => {
            const el = itemRefs.value?.[i];
            el?.scrollIntoView({ block: "nearest" });
        });
    }

    const reset = () => {
        highlightedIndex.value = -1;
    };

    return {
        highlightedIndex,
        moveDown,
        moveUp,
        enterSelect,
        reset,
    };
}
