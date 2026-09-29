"use client"

import { ReactNode } from "react"
import { addCompare, CompareCar } from "./compareStore"

export default function CompareButton({ car, className, children }: { car: CompareCar, className: string, children: ReactNode }) {
    return (
        <>
            <button type="button" onClick={() => addCompare(car)} className={`cursor-pointer border-0 font-sans ${className}`}>{children}</button>
        </>
    )
}
