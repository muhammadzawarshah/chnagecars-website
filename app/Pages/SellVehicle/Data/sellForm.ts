export type YesNoKey = "registration" | "warranty" | "financed" | "settlementKnown" | "ownership"

export const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];

export const gearTypes = ["Manual", "Automatic"];

export const conditions = ["Great", "Good", "Fair", "Poor"];

export const serviceHistories = [
    "Full Service History with AIM",
    "Full Service History with AIM and Independent Service Centre",
    "Partial Service History",
    "No Service History",
];

export const sellTimes = ["Now", "This week", "This month", "Next month"];

export const photoTimings = ["Upload Now", "Upload Later"];

export const yesNoQuestions: { key: YesNoKey, label: string }[] = [
    { key: "registration", label: "Do you Know your Registration Number?" },
    { key: "warranty", label: "Is your car under warranty?" },
    { key: "financed", label: "Is your car financed?" },
];
