"use client"

import { useState } from "react"
import CustomPriceField from "./CustomPriceField"

type CustomPriceInputsProps = {
    price: string
    monthly: string
    onPriceChange: (value: string) => void
    onMonthlyChange: (value: string) => void
    onCommit: () => void
}

export default function CustomPriceInputs({ price, monthly, onPriceChange, onMonthlyChange, onCommit }: CustomPriceInputsProps) {

    const [focused, setFocused] = useState<"price" | "monthly" | null>(null);

    const priceActive = price !== "" || focused === "price";
    const monthlyActive = monthly !== "" || focused === "monthly";

    function handleBlur() {
        setFocused(null);
        onCommit();
    }

    return (
        <>
            <div className="m-0 border-b-2 border-gold">
                <p className="mt-5 mr-0 mb-0 ml-5 text-base text-text-dark">Custom Max. Price</p>
                <div className={`flex gap-7.5 px-5 pb-5 leading-8 ${priceActive || monthlyActive ? "pt-5 transition-all duration-300" : ""}`}>
                    <CustomPriceField label="Max Price" value={price} active={priceActive} onChange={onPriceChange} onFocus={() => setFocused("price")} onBlur={handleBlur} />
                    <CustomPriceField label="Repayment p/m" value={monthly} active={monthlyActive} onChange={onMonthlyChange} onFocus={() => setFocused("monthly")} onBlur={handleBlur} />
                </div>
            </div>
        </>
    )
}
