import { Car } from "./types"
import { formatRand, monthlyPayment } from "./format"

// Sample listings used until the backend is connected. Only api.ts reads this file.

type MockInput = Omit<Car, "gallery" | "photoCount" | "dealer" | "location" | "monthlyPrice" | "formattedMonthlyPrice">

const dealer = {
    id: "1",
    name: "Dealer Name",
    hours: [
        { day: "Monday to Friday", time: "08.00 – 17.00" },
        { day: "Saturdays", time: "08.30 – 13.00" },
        { day: "Sundays", time: "Closed" },
        { day: "Public holidays", time: "Closed" },
    ],
};

// Real listings will send their own gallery; repeat the cover so the gallery grid shows.
function mock(car: MockInput): Car {
    const monthly = Math.round(monthlyPayment(car.price));
    return {
        ...car,
        monthlyPrice: monthly,
        formattedMonthlyPrice: `${formatRand(monthly, " ")} pm`,
        gallery: Array(5).fill(car.image),
        photoCount: 18,
        dealer,
        location: `City, ${car.province}`,
    };
}

export const mockCars: Car[] = [
    mock({ id: "101", make: "Toyota", model: "Land Cruiser", title: "2009 Toyota Land Cruiser VX 200 Limited Edition", year: 2009, price: 1699000, bodyType: "SUV", fuel: "Petrol", transmission: "Automatic", drive: "4X4", colour: "White", province: "Gauteng", engine: "4.6L", mileage: 99000, image: "/img/featured-cars/toyota-land-cruiser.jpg", featured: true, listedAt: "2026-08-01" }),
    mock({ id: "102", make: "Mercedes-Benz", model: "GLC-Class", title: "2021 Mercedes-Benz GLC-Class GLC220d AMG Dynamic", year: 2021, price: 2399000, bodyType: "SUV", fuel: "Diesel", transmission: "Automatic", drive: "4X2", colour: "White", province: "Western Cape", engine: "2.0L", mileage: 74000, image: "/img/featured-cars/mercedes-glc.jpg", featured: true, listedAt: "2026-08-02" }),
    mock({ id: "103", make: "Honda", model: "CR-V", title: "2024 Honda CR-V HEV RS 4WD AT", year: 2024, price: 1399000, bodyType: "SUV", fuel: "Hybrid", transmission: "Automatic", drive: "4X4", colour: "Blue", province: "Gauteng", engine: "2.0L", mileage: 50000, image: "/img/featured-cars/honda-crv.jpg", featured: true, listedAt: "2026-08-03" }),
    mock({ id: "104", make: "Hyundai", model: "i40", title: "2014 Hyundai i40 2.0 AT", year: 2014, price: 339000, bodyType: "Hatchback", fuel: "Petrol", transmission: "Automatic", drive: "4X2", colour: "Grey", province: "KwaZulu-Natal", engine: "2.0L", mileage: 190000, image: "/img/featured-cars/hyundai-i40.jpg", featured: true, listedAt: "2026-08-04" }),
    mock({ id: "105", make: "Volvo", model: "XC60", title: "2017 Volvo XC60 D4 AWD", year: 2017, price: 599000, bodyType: "SUV", fuel: "Diesel", transmission: "Automatic", drive: "4X4", colour: "Silver", province: "Western Cape", engine: "2.0L", mileage: 99000, image: "/img/featured-cars/volvo-xc60.jpg", featured: true, listedAt: "2026-08-05" }),
    mock({ id: "106", make: "Mitsubishi", model: "Triton", title: "2024 Mitsubishi Triton 2.4 PLUS ULTRA", year: 2024, price: 779000, bodyType: "Double Cab Bakkie", fuel: "Diesel", transmission: "Automatic", drive: "4X4", colour: "White", province: "Gauteng", engine: "2.4L", mileage: 431, image: "/img/featured-cars/mitsubishi-triton.jpg", featured: true, listedAt: "2026-08-06" }),
    mock({ id: "201", make: "Toyota", model: "Camry", title: "2018 Toyota Camry 2.0 G AT", year: 2018, price: 717000, bodyType: "Sedan", fuel: "Petrol", transmission: "Automatic", drive: "4X2", colour: "Silver", province: "Gauteng", engine: "2.0L", mileage: 94000, image: "/img/recent-cars/toyota-camry.jpg", featured: false, listedAt: "2026-09-28" }),
    mock({ id: "202", make: "Toyota", model: "Yaris Ativ", title: "2022 Toyota Yaris Ativ 1.2 PREMIUM LUXURY", year: 2022, price: 567000, bodyType: "Sedan", fuel: "Petrol", transmission: "Automatic", drive: "4X2", colour: "Red", province: "Free State", engine: "1.2L", mileage: 38000, image: "/img/recent-cars/toyota-yaris-ativ.jpg", featured: false, listedAt: "2026-09-27" }),
    mock({ id: "203", make: "BMW", model: "3 Series", title: "2017 BMW 3 Series 320d GT SPORT F34", year: 2017, price: 739000, bodyType: "Hatchback", fuel: "Diesel", transmission: "Automatic", drive: "4X2", colour: "White", province: "Western Cape", engine: "2.0L", mileage: 126000, image: "/img/recent-cars/bmw-320d-gt.jpg", featured: false, listedAt: "2026-09-26" }),
    mock({ id: "204", make: "BMW", model: "3 Series", title: "2014 BMW 3 Series 320d Luxury F30", year: 2014, price: 599000, bodyType: "Sedan", fuel: "Diesel", transmission: "Automatic", drive: "4X2", colour: "Black", province: "Gauteng", engine: "2.0L", mileage: 138000, image: "/img/recent-cars/bmw-320d-f30.jpg", featured: false, listedAt: "2026-09-25" }),
    mock({ id: "205", make: "Mercedes-Benz", model: "A-Class", title: "2020 Mercedes-Benz A-Class A200 AMG Dynamic", year: 2020, price: 959000, bodyType: "Sedan", fuel: "Petrol", transmission: "Automatic", drive: "4X2", colour: "White", province: "KwaZulu-Natal", engine: "1.3L", mileage: 40000, image: "/img/recent-cars/mercedes-a200.jpg", featured: false, listedAt: "2026-09-24" }),
    mock({ id: "206", make: "Mercedes-Benz", model: "GLA-Class", title: "2023 Mercedes-Benz GLA-Class GLA 200 AMG Dynamic", year: 2023, price: 1199000, bodyType: "SUV", fuel: "Petrol", transmission: "Automatic", drive: "4X2", colour: "White", province: "Gauteng", engine: "1.3L", mileage: 89000, image: "/img/recent-cars/mercedes-gla200.jpg", featured: false, listedAt: "2026-09-23" }),
];
