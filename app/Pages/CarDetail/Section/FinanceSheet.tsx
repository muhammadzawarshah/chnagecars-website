"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { formatRand, monthlyPayment } from "../../Home/Data/cars"
import FinanceSlider from "./FinanceSlider"

export default function FinanceSheet({ price, onClose }: { price: number, onClose: () => void }) {

    const [vehiclePrice, setVehiclePrice] = useState(price);
    const [deposit, setDeposit] = useState(0);
    const [balloon, setBalloon] = useState(0);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    const depositAmount = (vehiclePrice * deposit) / 100;
    const balloonAmount = (vehiclePrice * balloon) / 100;
    const financed = vehiclePrice - depositAmount;
    const r = 0.125 / 12;
    const monthly = Math.max(monthlyPayment(financed) - (balloonAmount * r) / (Math.pow(1 + r, 72) - 1), 0);

    return createPortal(
        <>
            <div onClick={onClose} className="fixed inset-0 z-900 bg-black/54"></div>
            <div className="fixed bottom-0 left-1/2 z-901 flex max-h-[85vh] w-full max-w-150 -translate-x-1/2 flex-col overflow-hidden rounded-t-[26px] bg-white font-roboto min-[981px]:bottom-1/2 min-[981px]:translate-y-1/2 min-[981px]:rounded-[20px]">
                <div className="relative shrink-0 border-b border-[#eeeeee] py-4 text-center">
                    <h3 className="m-0 text-lg font-normal text-gold min-[981px]:text-[22px]">Finance Calculator</h3>
                    <p className="mt-1 mb-0 text-[13px] text-[#9e9e9e]">Price: {formatRand(price)}</p>
                    <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#333" strokeWidth="1.6"><path d="M1 1l10 10M11 1L1 11" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-6">
                    <FinanceSlider label="Vehicle Price" display={formatRand(vehiclePrice)} min={50000} max={2000000} step={1000} value={vehiclePrice} minLabel="R50,000" maxLabel="R2,000,000" onChange={setVehiclePrice} />
                    <FinanceSlider label="Down Payment" display={`${formatRand(depositAmount)} (${deposit}%)`} min={0} max={100} step={1} value={deposit} minLabel="R0" maxLabel={formatRand(vehiclePrice)} onChange={setDeposit} />
                    <FinanceSlider label="Deposit (%)" display={`${deposit}%`} min={0} max={100} step={1} value={deposit} minLabel="0%" maxLabel="100%" onChange={setDeposit} />
                    <FinanceSlider label="Balloon Payment" display={`${formatRand(balloonAmount)} (${balloon}%)`} min={0} max={40} step={1} value={balloon} minLabel="R0" maxLabel={formatRand(vehiclePrice * 0.4)} onChange={setBalloon} />
                    <FinanceSlider label="Balloon (%)" display={`${balloon}%`} min={0} max={40} step={1} value={balloon} minLabel="0%" maxLabel="40%" onChange={setBalloon} />
                </div>
                <div className="flex h-16 shrink-0 items-center justify-center bg-gold text-white">
                    <span className="text-[28px] font-medium">{formatRand(monthly)}</span>
                    <span className="ml-1 self-end pb-4 text-sm">/Month</span>
                </div>
            </div>
        </>,
        document.body
    )
}
