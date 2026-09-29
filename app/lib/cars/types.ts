// Shape of a car listing as the backend will send it.
// Keep raw values here (numbers, ids); formatting lives in format.ts.

export type Dealer = {
    id: string
    name: string
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
    drive: "4X2" | "4X4"
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
    featured: boolean
    listedAt: string
}
