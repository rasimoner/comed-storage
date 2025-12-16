import { Ref } from "vue";

export interface UseKeyboardNavigationOptions<T> {
    items: Ref<T[]>;
    onSelect: (item: T) => void;
    itemRefs?: Ref<HTMLElement[]>;
}