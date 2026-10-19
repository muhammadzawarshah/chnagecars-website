import definitions from "@/backend/src/modules/web/body-types.json"

// Shared with the backend so labels, order and category filters stay identical.
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
