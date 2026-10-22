import definitions from "./body-types.json"

// Same list as backend/src/modules/web/body-types.json so labels, order and category filters
// stay identical. When one changes, copy it to the other.
export const BODY_TYPES = definitions;
export const bodyTypeCategories: Record<string, string[]> = Object.fromEntries(
    BODY_TYPES.map(type => [type.label, type.slugs]),
);
export function bodyTypeOptions(categories: { slug?: string; count: number }[]) {
    return BODY_TYPES.map(type => ({
        name: type.label,
        count: categories.filter(category => type.slugs.includes(category.slug ?? "")).reduce((sum, category) => sum + category.count, 0),
    }));
}

/** Canonical Title Case labels, including legacy API codes and common spelling variants. */
export function normalizeBodyTypeName(value: string | null | undefined): string | null {
    if (!value?.trim()) return null;
    const key = (text: string) => text.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-\s]+/g, " ");
    return BODY_TYPES.find(type => key(type.label) === key(value) || type.sourceCodes.some(code => key(code) === key(value)))?.label ?? null;
}
