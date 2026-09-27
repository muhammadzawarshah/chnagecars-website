import { makes } from "./makes"
import { dealerships } from "./dealerships"

export type SearchValues = {
    makes: string[]
    minPrice: number | null
    maxPrice: number | null
    minYear: number | null
    maxYear: number | null
    minMileage: number | null
    maxMileage: number | null
    bodyTypes: string[]
}

const baseUrl = "https://www.changecars.co.za/new-or-used-cars-for-sale/";

const provinceSlugs: Record<string, string> = {
    "Eastern Cape": "eastern-cape",
    "Free State": "free-state",
    "Gauteng": "gauteng",
    "KwaZulu-Natal": "kwaZulu-natal",
    "Limpopo": "limpopo",
    "Mpumalanga": "mpumalanga",
    "Northern Cape": "northern-cape",
    "North West": "north-west",
    "Western Cape": "western-cape",
};

const groupSlugs: Record<string, string> = { "New": "new", "Almost new": "almost", "Used": "used", "Classic": "classic" };

const specialSlugs: Record<string, string> = { "On special": "yes", "Not on special": "no" };

function slugify(value: string) {
    return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, "-");
}

function rangeParam(min: number | string | null | undefined, max: number | string | null | undefined, fallbackMin: number, fallbackMax: number) {
    if (!min && !max) return "";
    return `${min || fallbackMin}to${max || fallbackMax}`;
}

function amount(option: string | undefined) {
    return option ? String(parseInt(option, 10)) : "";
}

function makeGroup(selection: string) {
    const [makeName, modelName, variant] = selection.split("|");
    const make = makes.find((item) => item.name === makeName);
    const model = make?.models.find((item) => item.name === modelName);
    if (!make) return "";
    return [make.slug, model?.slug, model && variant ? slugify(variant) : ""].filter(Boolean).join(":");
}

export function buildSearchUrl(values: SearchValues, extra: Record<string, string[]>) {
    const pick = (key: string) => extra[key] ?? [];
    const groups = values.makes.map(makeGroup).filter(Boolean);
    const provinces = pick("province").map((name) => provinceSlugs[name]).filter(Boolean);
    const bodies = values.bodyTypes.map(slugify);
    const fuels = pick("fuelType").map(slugify);
    const transmissions = pick("transmission").map(slugify);
    const wheels = pick("drive").map(slugify);
    const colours = pick("colour").map(slugify);
    const conditions = pick("vehicleGroup").map((name) => groupSlugs[name]).filter(Boolean);
    const dealerNames = pick("dealership");
    const onlyNew = conditions.length > 0 && conditions.every((item) => item === "new" || item === "almost");
    const multiple = [groups, provinces, bodies, fuels, transmissions, wheels, colours, conditions, dealerNames].some((list) => list.length > 1);

    const params: [string, string][] = [];
    const add = (key: string, value: string | undefined) => {
        if (value) params.push([key, value]);
    };

    let path = "";
    if (multiple) {
        groups.forEach((group, index) => add(`g${index + 1}`, group));
        add("province", provinces.join("+"));
        add("body-type", bodies.join("+"));
    } else {
        path = [provinces[0], bodies[0], ...(groups[0] ?? "").split(":")].filter(Boolean).map((segment) => `${segment}/`).join("");
    }

    add("transmission", transmissions.join("+"));
    if (!onlyNew) add("mileage", rangeParam(values.minMileage, values.maxMileage, 0, 500000));
    add("fueltype", fuels.join("+"));
    add("vehiclegroup", conditions.join("+"));
    add("price", rangeParam(values.minPrice, values.maxPrice, 0, 15000000));
    add("wheeldrive", wheels.join("+"));
    add("year", rangeParam(values.minYear, values.maxYear, 0, new Date().getFullYear()));
    add("cylinders", pick("cylinders")[0]);
    add("enginecapacity", rangeParam(amount(pick("minEngine")[0]), amount(pick("maxEngine")[0]), 0, 10000));
    add("kilowatts", rangeParam(amount(pick("minKw")[0]), amount(pick("maxKw")[0]), 0, 1000));
    add("seats", pick("seats")[0]);
    add("colour", colours.join("+"));
    add("special", specialSlugs[pick("specials")[0]]);
    if (multiple) {
        add("dealer", dealerNames.map((name) => dealerships.find((dealer) => dealer.name === name)?.slug ?? slugify(name)).join("+"));
    } else {
        add("dealer", dealerNames[0] ? dealerNames[0].toLowerCase().replace(/\s+/g, "-") : "");
    }

    const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%2B/g, "+").replace(/%3A/g, ":")}`).join("&");
    return `${baseUrl}${path}${query ? `?${query}` : ""}`;
}
