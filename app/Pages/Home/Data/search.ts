export type PriceOption = {
    value: number
    price: string
    monthly: string
}

export type BodyType = {
    name: string
    label: string
    icon: string
    count: number
}

export type CountOption = {
    name: string
    count: number
}

export type Colour = {
    name: string
    hex: string
}

export const totalCars = "39 028";

export const drivenWheels: CountOption[] = [
    { name: "4X2", count: 28440 },
    { name: "4X4", count: 8793 },
];

export const transmissions: CountOption[] = [
    { name: "Manual", count: 13143 },
    { name: "Automatic", count: 25023 },
];

export const fuelTypes: CountOption[] = [
    { name: "Petrol", count: 24467 },
    { name: "Diesel", count: 12153 },
    { name: "Hybrid", count: 207 },
    { name: "Electric", count: 1339 },
];

export const searchProvinces: CountOption[] = [
    { name: "Eastern Cape", count: 1239 },
    { name: "Free State", count: 708 },
    { name: "Gauteng", count: 22016 },
    { name: "KwaZulu-Natal", count: 4669 },
    { name: "Limpopo", count: 758 },
    { name: "Mpumalanga", count: 1901 },
    { name: "Northern Cape", count: 313 },
    { name: "North West", count: 1781 },
    { name: "Western Cape", count: 5643 },
];

export const colours: Colour[] = [
    { name: "Beige", hex: "#C9B89A" },
    { name: "Black", hex: "#000000" },
    { name: "Blue", hex: "#2A6FDB" },
    { name: "Brown", hex: "#7A4E2E" },
    { name: "Gold", hex: "#D6A743" },
    { name: "Green", hex: "#2F8D4E" },
    { name: "Grey", hex: "#8A8A8A" },
    { name: "Orange", hex: "#E6782F" },
    { name: "Pink", hex: "#D86197" },
    { name: "Purple", hex: "#8257C7" },
    { name: "Red", hex: "#C9433D" },
    { name: "Silver", hex: "#A9A9A9" },
    { name: "Unknown", hex: "transparent" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Yellow", hex: "#DCC73A" },
];

export const minPrices: PriceOption[] = [
    { value: 5000, price: "R5 000", monthly: "R101 p/m" },
    { value: 50000, price: "R50 000", monthly: "R1 010 p/m" },
    { value: 100000, price: "R100 000", monthly: "R2 021 p/m" },
    { value: 150000, price: "R150 000", monthly: "R3 031 p/m" },
    { value: 200000, price: "R200 000", monthly: "R4 041 p/m" },
    { value: 250000, price: "R250 000", monthly: "R5 052 p/m" },
    { value: 300000, price: "R300 000", monthly: "R6 062 p/m" },
    { value: 350000, price: "R350 000", monthly: "R7 072 p/m" },
    { value: 400000, price: "R400 000", monthly: "R8 083 p/m" },
    { value: 450000, price: "R450 000", monthly: "R9 093 p/m" },
    { value: 500000, price: "R500 000", monthly: "R10 103 p/m" },
    { value: 600000, price: "R600 000", monthly: "R12 124 p/m" },
    { value: 700000, price: "R700 000", monthly: "R14 144 p/m" },
    { value: 800000, price: "R800 000", monthly: "R16 165 p/m" },
    { value: 900000, price: "R900 000", monthly: "R18 186 p/m" },
    { value: 1000000, price: "R1 000 000", monthly: "R20 206 p/m" },
    { value: 1250000, price: "R1 250 000", monthly: "R25 258 p/m" },
    { value: 1500000, price: "R1 500 000", monthly: "R30 309 p/m" },
    { value: 1750000, price: "R1 750 000", monthly: "R35 361 p/m" },
    { value: 2000000, price: "R2 000 000", monthly: "R40 413 p/m" },
    { value: 3000000, price: "R3 000 000", monthly: "R60 619 p/m" },
    { value: 4000000, price: "R4 000 000", monthly: "R80 825 p/m" },
    { value: 5000000, price: "R5 000 000", monthly: "R101 031 p/m" },
    { value: 7000000, price: "R7 000 000", monthly: "R141 444 p/m" },
    { value: 9000000, price: "R9 000 000", monthly: "R181 857 p/m" },
    { value: 11000000, price: "R11 000 000", monthly: "R222 269 p/m" },
    { value: 13000000, price: "R13 000 000", monthly: "R262 682 p/m" },
    { value: 15000000, price: "R15 000 000", monthly: "R303 094 p/m" },
];

export const maxPrices: PriceOption[] = minPrices.slice(1);

export const years: string[] = Array.from({ length: 2026 - 1980 + 1 }, (_, i) => String(2026 - i));

export const mileages: string[] = [
    "10 000 km", "20 000 km", "30 000 km", "40 000 km", "50 000 km", "75 000 km",
    "100 000 km", "125 000 km", "150 000 km", "200 000 km", "250 000 km", "300 000 km",
    "350 000 km", "400 000 km", "450 000 km", "500 000 km",
];

export const bodyTypes: BodyType[] = [
    { name: "Boat", label: "Boat", icon: "/img/body-types/boat.png", count: 2 },
    { name: "Caravan", label: "Caravan", icon: "/img/body-types/caravan.png", count: 87 },
    { name: "Convertible", label: "Convertible", icon: "/img/body-types/convertible.png", count: 161 },
    { name: "Coupé", label: "Coupé", icon: "/img/body-types/coupe.png", count: 694 },
    { name: "Double Cab Bakkie", label: "Double Cab -\nBakkie", icon: "/img/body-types/double-cab.png", count: 4748 },
    { name: "Extended Cab", label: "Extended Cab", icon: "/img/body-types/bakkie.png", count: 192 },
    { name: "Hatchback", label: "Hatchback", icon: "/img/body-types/hatchback.png", count: 8455 },
    { name: "Minibus", label: "Minibus", icon: "/img/body-types/minivan.png", count: 564 },
    { name: "Motorbike", label: "Motorbike", icon: "/img/body-types/motorbike.png", count: 1373 },
    { name: "MPV", label: "MPV", icon: "/img/body-types/panel-van.png", count: 547 },
    { name: "Panel Van", label: "Panel Van", icon: "/img/body-types/panel-van.png", count: 513 },
    { name: "Sedan", label: "Sedan", icon: "/img/body-types/sedan.png", count: 2096 },
    { name: "Single Cab Bakkie", label: "Single Cab Bakkie", icon: "/img/body-types/bakkie.png", count: 2234 },
    { name: "Station Wagon", label: "Station Wagon", icon: "/img/body-types/stationwagon.png", count: 152 },
    { name: "SUV", label: "SUV", icon: "/img/body-types/suv.png", count: 16998 },
];
