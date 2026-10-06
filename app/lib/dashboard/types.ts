// Shapes the dashboards expect from the backend.

export type Role = "super-admin" | "admin" | "dealer"

export type DealerStatus = "active" | "pending" | "suspended"
export type DealerPlan = "Gold" | "Silver" | "Basic"

export type MonthlyPoint = {
    month: string
    value: number
}

export type Dealer = {
    id: string
    name: string
    contactName: string
    email: string
    phone: string
    city: string
    province: string
    plan: DealerPlan
    status: DealerStatus
    joinedAt: string
    rating: number
}

export type DealerStats = {
    activeListings: number
    soldThisMonth: number
    views: number
    leads: number
    conversionRate: number
    avgDaysToSell: number
    stockValue: number
    responseHours: number
    monthlyLeads: MonthlyPoint[]
    monthlyViews: MonthlyPoint[]
    monthlySold: MonthlyPoint[]
}

export type DealerSummary = Dealer & { stats: DealerStats }

export type ListingStatus = "active" | "sold" | "draft" | "flagged"

export type InventoryItem = {
    id: string
    dealerId: string
    title: string
    image: string
    price: number
    mileage: number
    status: ListingStatus
    views: number
    leads: number
    listedAt: string
}

export type LeadStatus = "new" | "contacted" | "won" | "lost"
export type LeadSource = "Call" | "WhatsApp" | "Email" | "Website form"

export type Lead = {
    id: string
    dealerId: string
    customer: string
    phone: string
    vehicle: string
    source: LeadSource
    status: LeadStatus
    createdAt: string
}

export type StaffUser = {
    id: string
    name: string
    email: string
    role: Exclude<Role, "dealer">
    status: "active" | "invited" | "disabled"
    lastActive: string
}

export type Activity = {
    id: string
    actor: string
    action: string
    target: string
    at: string
}

export type PlatformOverview = {
    dealers: number
    activeDealers: number
    pendingDealers: number
    activeListings: number
    leads: number
    views: number
    soldThisMonth: number
    stockValue: number
    monthlyLeads: MonthlyPoint[]
    monthlySold: MonthlyPoint[]
}
