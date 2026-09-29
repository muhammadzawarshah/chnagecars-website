export type HowItWorksItem = {
    icon: string
    iconWidth: string
    title: string
    before?: string
    after: string
}

export const howItWorks: HowItWorksItem[] = [
    { icon: "/img/sell/how-1.svg", iconWidth: "w-7.5", title: "List your car in just 2 minutes", before: "Enter a few details about you and your vehicle.", after: "will contact you to arrange a free, no-obligation valuation" },
    { icon: "/img/sell/how-2.svg", iconWidth: "w-7.5", title: "Get paid fast", before: "If", after: "buys your car immediately, payment is usually made before we leave your premises — with no hidden fees" },
    { icon: "/img/sell/how-3.svg", iconWidth: "w-10.5", title: "Receive competitive offers", before: "If", after: "doesn’t buy your car straight away, your vehicle is placed on our dealer bidding platform, where verified dealers can submit their offers" },
    { icon: "/img/sell/how-4.svg", iconWidth: "w-7.5", title: "Important to know", after: "All offers are subject to a vehicle inspection, and you’re free to accept or decline any offer at any time" },
];

export const transmissions = ["Manual", "Automatic"];

export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"];

export const conditions = ["Great", "Good", "Fair", "Poor"];

export const serviceHistories = [
    "Full Service History with AIM",
    "Full Service History with AIM and Independent Service Centre",
    "Partial Service History",
    "No Service History",
];

export const yesNo = ["Yes", "No"];

export const sellTimes = ["Now", "This week", "This month", "Next month"];

export const photoTimings = ["Upload Now", "Upload Later"];
