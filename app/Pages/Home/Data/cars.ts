export type ListedCar = {
    title: string
    price: string
    specs: string[]
    image: string
    photos: number
    gallery?: string[]
    dealer: string
    location: string
}

export const featuredCars: ListedCar[] = [
    { title: "2009 Toyota Land Cruiser VX 200 Limited Edition", price: "R1,699,000", specs: ["SUV", "Gasoline", "Automatic", "4.6L", "99,000 km"], image: "/img/featured-cars/toyota-land-cruiser.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2021 Mercedes-Benz GLC-Class GLC220d AMG Dynamic", price: "R2,399,000", specs: ["SUV", "Diesel", "Automatic", "2.0L", "74,000 km"], image: "/img/featured-cars/mercedes-glc.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2024 Honda CR-V HEV RS 4WD AT", price: "R1,399,000", specs: ["SUV", "Hybrid", "Automatic", "2.0L", "50,000 km"], image: "/img/featured-cars/honda-crv.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2014 Hyundai i40 2.0 AT", price: "R339,000", specs: ["Hatchback", "Gasoline", "Automatic", "2.0L", "190,000 km"], image: "/img/featured-cars/hyundai-i40.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2017 Volvo XC60 D4 AWD", price: "R599,000", specs: ["SUV", "Diesel", "Automatic", "2.0L", "99,000 km"], image: "/img/featured-cars/volvo-xc60.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2024 Mitsubishi Triton 2.4 PLUS ULTRA", price: "R779,000", specs: ["Pickup", "Diesel", "Automatic", "2.4L", "431 km"], image: "/img/featured-cars/mitsubishi-triton.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
];

export const recentCars: ListedCar[] = [
    { title: "2018 Toyota Camry 2.0 G AT", price: "R717,000", specs: ["Sedan", "Gasoline", "Automatic", "2.0L", "94,000 km"], image: "/img/recent-cars/toyota-camry.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2022 Toyota Yaris Ativ 1.2 PREMIUM LUXURY", price: "R567,000", specs: ["Sedan", "Gasoline", "Automatic", "1.2L", "38,000 km"], image: "/img/recent-cars/toyota-yaris-ativ.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2017 BMW 3 Series 320d GT SPORT F34", price: "R739,000", specs: ["Hatchback", "Diesel", "Automatic", "2.0L", "126,000 km"], image: "/img/recent-cars/bmw-320d-gt.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2014 BMW 3 Series 320d Luxury F30", price: "R599,000", specs: ["Sedan", "Diesel", "Automatic", "2.0L", "138,000 km"], image: "/img/recent-cars/bmw-320d-f30.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2020 Mercedes-Benz A-Class A200 AMG Dynamic", price: "R959,000", specs: ["Sedan", "Gasoline", "Automatic", "1.3L", "40,000 km"], image: "/img/recent-cars/mercedes-a200.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2023 Mercedes-Benz GLA-Class GLA 200 AMG Dynamic", price: "R1,199,000", specs: ["SUV", "Gasoline", "Automatic", "1.3L", "89,000 km"], image: "/img/recent-cars/mercedes-gla200.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
];

export const allCars: ListedCar[] = [...featuredCars, ...recentCars];

export function carSlug(car: ListedCar) {
    return car.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function findCar(slug: string) {
    return allCars.find((car) => carSlug(car) === slug);
}

export function priceValue(car: ListedCar) {
    return Number(car.price.replace(/[^\d]/g, ""));
}

export function monthlyPayment(principal: number, months = 72, rate = 0.125) {
    const r = rate / 12;
    return principal <= 0 ? 0 : (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function formatRand(value: number) {
    return `R${Math.round(value).toLocaleString("en-US")}`;
}
