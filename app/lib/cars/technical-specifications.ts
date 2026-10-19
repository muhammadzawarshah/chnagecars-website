import { normalizeBodyTypeName } from "./body-types"
import type { Car } from "./types"

const missing = "Not available";
const upper = (value: string | null | undefined) => value?.trim().toUpperCase() || missing;
const number = (value: number | null | undefined, unit = "") =>
    value != null && Number.isFinite(value) && value > 0 ? `${value}${unit}` : missing;

function introductionDate(value: string | null | undefined): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return missing;
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return missing;
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** One mapping shared by standard/featured pages at every viewport size. */
export function technicalSpecificationGroups(car: Car): { title: string; icon: string; rows: [string, string][] }[] {
    const spec = car.technicalSpecifications;
    return [
        { title: "General", icon: "general", rows: [
            ["No of Doors", number(spec?.doors)],
            ["No of Seats", number(spec?.seats)],
            ["Body Type", normalizeBodyTypeName(spec?.bodyType) || missing],
            ["Colour", upper(spec?.colour)],
            ["Introduction Date", introductionDate(spec?.introductionDate)],
        ] },
        { title: "Engine", icon: "engine", rows: [
            ["Power Maximum", number(spec?.powerKw, "KW")],
            ["Engine Cylinders", number(spec?.cylinders)],
            ["Engine Capacity", number(spec?.engineCapacityCc, "cc")],
            ["Turbo / Supercharged", upper(spec?.turboSupercharged)],
            ["Fuel Tank Size", number(spec?.fuelTankLitres, "L")],
        ] },
        { title: "Handling", icon: "handling", rows: [
            ["Front Tyres", upper(spec?.frontTyreSize)],
            ["Rear Tyres", upper(spec?.rearTyreSize)],
            ["Driven Wheels", upper(spec?.drivenWheels)],
        ] },
    ];
}
