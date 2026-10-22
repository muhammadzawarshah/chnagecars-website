import { Car } from "./types"

// separator " " gives the South African style used on the results page: R1 259 700
export function formatRand(value: number, separator = ",") {
    return `R${Math.round(value).toLocaleString("en-US").replace(/,/g, separator)}`;
}

export function formatKm(value: number | null | undefined, separator = ",") {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "N/A";
    return `${value.toLocaleString("en-US").replace(/,/g, separator)} km`;
}

export function monthlyPayment(principal: number, months = 72, rate = 0.125) {
    const r = rate / 12;
    return principal <= 0 ? 0 : (principal * r) / (1 - Math.pow(1 + r, -months));
}

// URL is "<readable-title>-<id>": the title is for people and SEO, the id is what we look up.
export function carSlug(car: Car) {
    const title = car.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${title}-${car.id}`;
}

export function carHref(car: Car) {
    return `/car/${carSlug(car)}`;
}

// Featured Cars on the home page open the app-style detail page.
export function featuredCarHref(car: Car) {
    return `/featured-car/${carSlug(car)}`;
}

export function idFromSlug(slug: string) {
    return slug.slice(slug.lastIndexOf("-") + 1);
}

export function carSpecs(car: Car) {
    return [car.bodyType, car.fuel, car.transmission, car.engine, formatKm(car.mileage)];
}

// Render source entities as text; React still escapes the result.
export function sourceDescription(value: string) {
    const entities: Record<string, string> = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>', nbsp: ' ' };
    return value.replace(/&(#x[0-9a-f]+|#[0-9]+|quot|apos|amp|lt|gt|nbsp);/gi, (original, entity: string) => {
        if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? original;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : original;
    });
}
