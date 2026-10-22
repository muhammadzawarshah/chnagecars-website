// Shape of a car listing as the backend will send it.
// Keep raw values here (numbers, ids); formatting lives in format.ts.

export type Dealer = {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    whatsappNumber?: string | null
    rating?: number | null
    googleReviewUrl?: string | null
    hellopeterReviewUrl?: string | null
    logo?: string
    address?: string
    hours?: { day: string, time: string }[]
}

export type CarCategory = "exotic" | "classic" | "leisure"

export type Car = {
    technicalSpecifications?: {
        doors: number | null
        seats: number | null
        bodyType: string | null
        colour: string | null
        introductionDate: string | null
        powerKw: number | null
        cylinders: number | null
        engineCapacityCc: number | null
        turboSupercharged: string | null
        fuelTankLitres: number | null
        frontTyreSize: string | null
        rearTyreSize: string | null
        drivenWheels: string | null
    }
    insights?: {
        source: 'this-site'
        comparableCount: number
        averagePrice: number | null
        priceDifference: number | null
        averageMileage: number | null
        mileageDifference: number | null
        daysListed: number | null
        viewsLast7Days: number
        enquiriesLast7Days: number
    }
    additionalInformation?: string | null
    description?: string | null
    id: string
    title: string
    make: string
    model: string
    year: number
    price: number
    monthlyPrice?: number
    formattedMonthlyPrice?: string
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
