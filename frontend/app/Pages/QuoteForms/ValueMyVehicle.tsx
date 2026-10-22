"use client"

import { useState } from "react"
import { makes } from "../Home/Data/makes"
import QuoteShell from "./Section/QuoteShell"
import { DropSelect, FloatInput, MessageBox, RobotCheck, SubmitButton } from "./Section/Fields"
import { hearAbout, provinces } from "./Data/options"

export default function ValueMyVehicle() {

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const models = makes.find((item) => item.name === make)?.models ?? [];
    const variants = models.find((item) => item.name === model)?.variants ?? [];

    const half = "h-11.25 w-[48%] mb-6.25";
    const dropdown = "h-18.75 w-[48%] mb-3.5 max-[841px]:mb-6.25";

    return (
        <>
            <QuoteShell background="/img/quote-forms/vmv-bg.jpg" cardClass="max-w-275 min-h-166.75" narrowGutter>
                <div className="relative flow-root w-full px-17.5 pt-11 pb-8 max-[951px]:px-7.5 max-[501px]:px-5">
                    <h1 className="m-0 mb-7.5 text-[32px] leading-7.25 font-medium text-[#fcfcfc] uppercase">Value my vehicle</h1>
                    <p className="m-0 mb-3.25 text-sm leading-4.5 font-medium text-[#f5f5f5] max-[841px]:text-lg">Not sure if you want to sell! Let us give you an indicative value and we would love to do business when you are ready!</p>
                    <ul className="m-0 list-none p-0">
                        <FloatInput label="Name" variant="raised" autoFocus className={`float-left ${half}`} />
                        <FloatInput label="Surname" variant="raised" className={`float-right ${half}`} />
                        <FloatInput label="Mobile number" type="tel" variant="raised" className={`float-left ${half}`} />
                        <FloatInput label="Email" type="email" variant="raised" className={`float-right ${half}`} />
                        <DropSelect label="Your province" placeholder="Select your province" options={provinces} className={`float-left ${dropdown}`} />
                        <DropSelect label="How did you hear about us?" placeholder="Select your option" options={hearAbout} className={`float-right ${dropdown}`} />
                        <DropSelect label="Make" placeholder="Select your option" options={makes.map((item) => item.name)} value={make} onChange={(value) => { setMake(value); setModel(""); }} className={`float-left ${dropdown}`} />
                        <DropSelect key={`model-${make}`} label="Model" placeholder="Select your option" options={models.map((item) => item.name)} disabled={!make} value={model} onChange={setModel} className={`float-right ${dropdown}`} />
                        <DropSelect key={`variant-${make}-${model}`} label="Variant" placeholder="Select your option" options={variants} disabled={!model} className={`float-left ${dropdown}`} />
                        <FloatInput label="Expected price" variant="raised" labelClass="top-1.5" inputClass="relative top-4.75" className="float-right mb-6.25 h-16 w-[48%] max-[841px]:h-18.75" />
                        <FloatInput label="VIN number" variant="raised" className="float-left mr-[4%] mb-10 h-11.25 w-[22%] max-[841px]:mb-6.25 max-[841px]:w-[48%]" />
                        <FloatInput label="Mileage (km)" variant="raised" className="float-left mb-10 h-11.25 w-[22%] max-[841px]:mb-6.25 max-[841px]:w-[48%]" />
                        <FloatInput label="Year" variant="raised" className="float-right mb-6.25 h-11.25 w-[48%] max-[841px]:float-left max-[841px]:mr-[4%]" />
                        <MessageBox label="Please provide us with details about your vehicle, including mileage and any other relevant information!" labelClass="-top-2.5" textareaClass="mb-3.75 h-26.75" className="float-left mb-6.25 h-35 w-full max-[551px]:mt-3.75" />
                        <RobotCheck className="absolute bottom-5.75 left-17.5 h-11.25 w-1/5 max-[951px]:left-7.5 max-[841px]:relative max-[841px]:left-auto max-[841px]:float-left max-[841px]:mt-8.5 max-[841px]:w-[48%] max-[841px]:pt-2.75" />
                        <li className="float-left h-11.25 w-full max-[841px]:float-right max-[841px]:mt-2.75 max-[841px]:mb-6.25 max-[841px]:w-[37%]">
                            <SubmitButton className="float-right ml-3.75 bg-[#212121] font-medium" />
                        </li>
                    </ul>
                </div>
            </QuoteShell>
        </>
    )
}
