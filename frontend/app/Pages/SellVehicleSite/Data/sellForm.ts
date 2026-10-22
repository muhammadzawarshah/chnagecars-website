import { makes as siteMakes } from "../../Home/Data/makes"

// Lists as served by the WeeLee sell form embedded on the live page.
export const makes = "ABARTH|AC|AIM|ALFA ROMEO|ASHOK LEYLAND|ASIA WING|ASTON MARTIN|AUDI|B.A.W|BACKDRAFT|BAIC|BAJAJ|BENTLEY|BIRKIN|BMW|BRANDT BRV|BYD|C.A.M|CADILLAC|CHANA - CHANGAN|CHANGAN|CHERY|CHEVROLET|CHRYSLER|CITROEN|CMC|COLT|DACIA|DAEWOO|DAIHATSU|DAIMLER|DATSUN|DAYUN|DFM|DFSK|DMC|DODGE|DONGFENG|DTV|EVERIONE|FAW|FERRARI|FIAT|FORCE|FORD|FOTON|FUDI|GAC MOTOR|GEELY|GOLDEN DRAGON|GOLDEN JOURNEY|GONOW|GWM|HAFEI|HAISE|HAJADU|HAVAL|HINO|HONDA|HUMMER|HYUNDAI|iCAUR|INEOS|INFINITI|ISUZU|IVECO|JAC|JAECOO|JAGUAR|JEEP|JETOUR|JIAYUAN|JINBEI|JMC|JOYLONG|JUNEYAO|KIA|KINGLONG|KTM|L D V|LADA|LAMBORGHINI|LANCIA|LAND ROVER|LDV|LEAPMOTOR|LEPAS|LEXUS|LOTUS|MAHINDRA|MASERATI|MAYBACH|MAZDA|MCLAREN|MEIYA|MERCEDES-BENZ|MG|MINI|MITSUBISHI|MORGAN|NANFENG|NISSAN|NOBLE|OMODA|OPEL|PEUGEOT|POLARSUN|PORSCHE|PROTON|RENAULT|RIDDARA|ROLLS ROYCE|ROVER|SAAB|SAIC|SEAT|SECMA|SMART|SOYAT|SRM|SSANGYONG|SUBARU|SUZUKI|TATA|TOYOTA|TVR|US TRUCK|VOLKSWAGEN|VOLVO|ZOTYE|ZX AUTO".split("|");

export const years = Array.from({ length: 61 }, (_, index) => String(2026 - index));

const toyotaModels = "86|AVANZA / INNOVA|AVANZA / INNOVA / RUMION|AYGO/AGYA|AYGO/AGYA/VITZ|C-HR|COROLLA 2002 - ON|COROLLA QUEST|DYNA|ETIOS|FORTUNER|GR SUPRA|HILUX 2016 ON|LAND CRUISER / LEXUS|LAND CRUISER PICK UP|LANDCRUISER 70 SERIES|PRADO 2002 - ON|PRIUS|QUANTUM|QUANTUM/HIACE|RAV 4|RUSH|STARLET|YARIS".split("|");

function siteMake(make: string) {
    return siteMakes.find((item) => item.name.toLowerCase() === make.toLowerCase());
}

export function modelsFor(make: string) {
    if (make === "TOYOTA") return toyotaModels;
    const models = siteMake(make)?.models.map((model) => model.name.toUpperCase()) ?? [];
    return models.length ? models : ["OTHER"];
}

export function variantsFor(make: string, model: string) {
    const variants = siteMake(make)?.models.find((item) => item.name.toUpperCase() === model)?.variants ?? [];
    return ["Other", "Unsure", ...variants.map((variant) => `${model} ${variant}`.toUpperCase())];
}

const mileageSteps = [0, 1000, 2500, 5000, ...Array.from({ length: 39 }, (_, index) => 10000 + index * 5000), ...Array.from({ length: 20 }, (_, index) => 210000 + index * 10000)];

export const mileages = [
    ...mileageSteps.slice(0, -1).map((from, index) => `${from ? (from + 1).toLocaleString("en-US") : "0"} - ${mileageSteps[index + 1].toLocaleString("en-US")} km`),
    "400,001 km PLUS",
];

export const ownedFor = ["0 to 6 Months", "6 Months to 1 Year", "1 to 2 Years", "2 to 5 Years", "5 Years +"];

export const fuelTypes = [
    { label: "Petrol", disabled: false },
    { label: "Diesel", disabled: false },
    { label: "Electric", disabled: true },
    { label: "Hybrid", disabled: true },
];

export const gearTypes = ["Manual", "Automatic"];

export const conditions = [
    {
        label: "Great",
        notes: [
            ["The vehicle is in almost brand-new condition."],
            ["There are no cosmetic or mechanical defects."],
            ["The interior is neat and there are no signs of wear and tear."],
            ["The vehicle is mechanically sound, and all accessories are operational."],
            ["A full-service history shows that the vehicle was taken for regular services.", "Only Limited high-quality repairs may have been conducted."],
        ],
    },
    {
        label: "Good",
        notes: [
            ["The vehicle is in good condition, better than average."],
            ["There may be very minor chips or scratches in panel surfaces."],
            ["The interior is neat and shows little to no signs of wear and tear."],
            ["The vehicle is mechanically sound, and all accessories are operational."],
            ["Mostly recorded service history."],
            ["If the vehicle has sustained any cosmetic or collision damage, it was minor and has received high quality repairs.."],
        ],
    },
    {
        label: "Fair",
        notes: [
            ["Normal wear and tear is evident in the form of", "parking lot dents or small scratches and chips."],
            ["The vehicle may be in need of conventional body", "and paint work or the replacement of parts."],
            ["The interior shows evidence of normal wear and tear."],
            ["The windshield may have some chips or cracks."],
            ["The vehicle is mechanically sound but may be in need of a regular service."],
            ["Service history is full or incomplete."],
        ],
    },
    {
        label: "Poor",
        notes: [
            ["Excessive wear and tear is evident on the vehicle."],
            ["The vehicle may have dents, scratches and body panels requiring replacement."],
            ["Interior shows signs of excess wear."],
            ["Parts are broken or may be missing."],
            ["The vehicle may have gone through inadequate", "prior repairs or there is unrepaired damage.", ""],
            ["The vehicle may not be fully operational due to mechanical defects."],
        ],
    },
];

export function serviceHistories(make: string) {
    return [`Full Service History with ${make}`, `Full Service History with ${make} and Independent Service Centre`, "Partial Service History", "No Service History"];
}

export const sellTimes = ["Now", "This week", "This month", "Next month"];

export const photoTimings = ["Upload Now", "Upload Later"];
