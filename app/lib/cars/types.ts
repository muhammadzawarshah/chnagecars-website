// Shape of a car listing as the backend will send it.
// Keep raw values here (numbers, ids); formatting lives in format.ts.

export type Dealer = {
    id: string
    name: string
    logo?: string
    address?: string
    hours?: { day: string, time: string }[]
}

export type CarCategory = "exotic" | "classic" | "leisure"

export type Car = {
    id: string
    title: string
    make: string
    model: string
    year: number
    price: number
    bodyType: string
    fuel: string
    transmission: string
    drive: "4X2" | "4X4" | "Unknown"
    colour: string
    engine: string
    mileage: number
    image: string
    gallery: string[]
    photoCount: number
    dealer: Dealer
    location: string
    province: string
    category?: CarCategory
    vehicleGroup?: string
    isSpecial?: boolean
    engineCc?: number
    powerKw?: number
    seats?: number
    cylinders?: number
    featured: boolean
    listedAt: string
    views?: number
    enquiries?: number
}
