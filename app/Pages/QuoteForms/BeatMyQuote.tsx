"use client"

import { useState } from "react"
import QuoteShell from "./Section/QuoteShell"
import PhotoPanel from "./Section/PhotoPanel"
import { DropSelect, FloatInput, MessageBox, RobotCheck, SubmitButton } from "./Section/Fields"
import { hearAbout, provinces } from "./Data/options"

export default function BeatMyQuote() {

    const [file, setFile] = useState("");

    const left = "float-left mb-5 h-11.25 w-[54%] max-[601px]:float-none max-[601px]:w-full";
    const right = "float-right mb-5 h-11.25 w-[43%] max-[601px]:float-none max-[601px]:w-full";
    const inputFont = { restFont: "text-sm max-[676px]:text-base", activeFont: "text-xs max-[676px]:text-sm" };
    const dropFont = "text-sm max-[676px]:top-0.75 max-[676px]:text-base";
    const selectFont = "max-[676px]:h-[34.39px] max-[676px]:text-base";

    return (
        <>
            <QuoteShell background="/img/quote-forms/keep-it-or-cc-bg-image.jpg" cardClass="flex h-205.5 max-w-300 min-[842px]:max-[1195px]:h-210 max-[842px]:block max-[601px]:my-15 max-[601px]:h-auto">
                <PhotoPanel image="/img/quote-forms/Beat_my_quote_bg.jpg" className="min-h-201.25 w-2/5 shrink-0 bg-position-[80%_75%] max-[842px]:hidden" logoClass="bottom-40 w-[calc(100%-50px)] gap-3" />
                <div className="relative flow-root w-3/5 self-start px-17.5 pt-11 pb-8 min-[841px]:max-[951px]:px-7.5 max-[842px]:w-full max-[601px]:px-7.5 max-[601px]:pb-7.5">
                    <h4 className="m-0 mb-3.75 text-[32px] leading-9.75 font-bold text-[#fcfcfc] uppercase">
                        Beat-my-quote<sup className="relative -top-3 -left-1 text-sm leading-0 font-normal">®</sup>
                    </h4>
                    <p className="m-0 mb-3.5 text-sm leading-4.5 font-normal text-[#f5f5f5] [&_a]:font-bold [&_a]:text-inherit [&_a]:underline">
                        Through our relationships with manufacturer approved dealerships on our site, <b>CHANGECARS</b> will endeavour to beat ANY quote received on your BRAND NEW VEHICLE OF CHOICE from any Dealership <strong>Not on our site</strong>. Kindly visit “<a href="https://www.changecars.co.za/dealer-listing">Our Dealers</a>” tab to see our preferred Dealer list!
                        <br />
                        <br />
                        Please note: Exclusive brands such as Aston Martin, Bentley, Ferrari, Lamborghini, McLaren, Maserati and Porsche are not part of the program
                    </p>
                    <ul className="m-0 list-none p-0">
                        <FloatInput label="Name" variant="inline" className={left} {...inputFont} />
                        <FloatInput label="Surname" variant="inline" className={right} {...inputFont} />
                        <FloatInput label="Mobile number" type="tel" variant="inline" className={right} {...inputFont} />
                        <FloatInput label="Email" type="email" variant="inline" className={left} {...inputFont} />
                        <DropSelect label="Are you" required={false} placeholder="Just starting to see what is available" options={["Ready to buy immediately"]} labelClass={dropFont} selectClass={selectFont} className="float-left mb-6.25 h-11.25 w-full" />
                        <li className="relative float-left mb-7.5 h-11.25 w-full">
                            <span className={`relative top-1.25 block w-fit leading-4.5 font-light text-white ${dropFont}`}>Upload your quote here</span>
                            <label className="my-3.75 block h-8.5 cursor-pointer rounded-[5px] border-3 border-transparent bg-white p-0.75">
                                <input type="file" aria-label="Upload your quote here" onChange={(event) => setFile(event.target.files?.[0]?.name ?? "")} className="sr-only" />
                                <span className="float-left block h-5.5 max-w-full truncate text-[14.4px] leading-5.5 font-medium text-gold max-[676px]:text-base">{file}</span>
                            </label>
                        </li>
                        <MessageBox label="Tell us more about your quote and requirements" labelClass="top-1 text-sm max-[676px]:text-base" textareaClass="mt-3.75 mb-4.5 h-20" className="float-left mb-2.75 h-28.75 w-full" />
                        <DropSelect label="How did you hear about us?" placeholder="Select your option" options={hearAbout} labelClass={dropFont} selectClass={selectFont} className="float-left mt-2.5 mb-1.25 w-[54%] max-[601px]:float-none max-[601px]:clear-both max-[601px]:mb-5 max-[601px]:w-full" />
                        <DropSelect label="Your province" placeholder="Select your option" options={provinces} labelClass={dropFont} selectClass={selectFont} className="relative top-2.5 float-right mb-5 w-[43%] max-[601px]:float-none max-[601px]:clear-both max-[601px]:-mt-5 max-[601px]:mb-6 max-[601px]:w-full" />
                        <RobotCheck spanClass="text-xs max-[676px]:text-sm" className="absolute bottom-6.25 left-17.5 h-11.25 w-2/5 pt-1.75 min-[841px]:max-[951px]:left-7.5 max-[842px]:relative max-[842px]:bottom-auto max-[842px]:left-auto max-[842px]:float-left max-[842px]:-mb-11 max-[842px]:w-[48%] max-[601px]:left-auto" />
                        <li className="float-left mb-6.25 h-11.25 w-full">
                            <SubmitButton className="float-right mt-7.5 bg-ink font-bold max-[841px]:relative max-[841px]:top-4.5 max-[841px]:mt-0 max-[676px]:text-base" />
                        </li>
                    </ul>
                </div>
            </QuoteShell>
        </>
    )
}
