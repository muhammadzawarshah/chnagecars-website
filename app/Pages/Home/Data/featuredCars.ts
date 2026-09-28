export type FeaturedCar = {
    title: string
    price: string
    specs: string[]
    image: string
    photos: number
    dealer: string
    location: string
}

export const featuredCars: FeaturedCar[] = [
    { title: "2009 Toyota Land Cruiser VX 200 Limited Edition", price: "R1,699,000", specs: ["SUV", "Gasoline", "Automatic", "4.6L", "99,000 km"], image: "/img/featured-cars/toyota-land-cruiser.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2021 Mercedes-Benz GLC-Class GLC220d AMG Dynamic", price: "R2,399,000", specs: ["SUV", "Diesel", "Automatic", "2.0L", "74,000 km"], image: "/img/featured-cars/mercedes-glc.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2024 Honda CR-V HEV RS 4WD AT", price: "R1,399,000", specs: ["SUV", "Hybrid", "Automatic", "2.0L", "50,000 km"], image: "/img/featured-cars/honda-crv.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2014 Hyundai i40 2.0 AT", price: "R339,000", specs: ["Hatchback", "Gasoline", "Automatic", "2.0L", "190,000 km"], image: "/img/featured-cars/hyundai-i40.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2017 Volvo XC60 D4 AWD", price: "R599,000", specs: ["SUV", "Diesel", "Automatic", "2.0L", "99,000 km"], image: "/img/featured-cars/volvo-xc60.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
    { title: "2024 Mitsubishi Triton 2.4 PLUS ULTRA", price: "R779,000", specs: ["Pickup", "Diesel", "Automatic", "2.4L", "431 km"], image: "/img/featured-cars/mitsubishi-triton.jpg", photos: 18, dealer: "Dealer Name", location: "City, Province" },
];
