"use client"

import { useState } from "react"
import { appTotalCars } from "../../Data/appSearch"
import HeroAd from "../HeroAd"
import PaymentToggle from "./PaymentToggle"
import AppField from "./AppField"
import FiltersPage from "./FiltersPage"
import FilterField from "./FilterField"
import useAppFilters, { rangeKeys } from "./useAppFilters"

export default function AppSearch() {

    const { t, monthly, setMonthly, values, extraFilters, openSheet, rangeLabel, makesLabel, bodyTypesLabel, choiceLabel, reset, searchUrl, sheets } = useAppFilters();
    const [showMore, setShowMore] = useState(false);

    function choiceField(key: string, wide: boolean) {
        return <FilterField key={key} wide={wide} label={choiceLabel(key)} active={!!extraFilters[key]?.length} onClick={() => openSheet(key)} />;
    }

    function clearSearch() {
        setMonthly(false);
        reset();
    }

    return (
        <>
            <section className="hidden bg-black px-5 pt-10 pb-[29.67px] max-[981px]:block max-[301px]:px-2.5">
                <img src="/img/site_logo.svg" alt="CHANGECARS logo" className="mx-auto block h-auto w-[209.33px] max-w-full" />
                <p className="mt-[17.2px] mb-0 text-center text-[15.2px] leading-[1.15] text-white uppercase">
                    {t.taglineStart} <span className="text-[#957e4e]">{t.taglineHighlight}</span>
                </p>

                <div className="mt-3.5">
                    <PaymentToggle monthly={monthly} cashLabel={t.cashPrice} monthlyLabel={t.monthlyPayment} onChange={setMonthly} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-5 max-[301px]:grid-cols-1 max-[301px]:gap-y-3">
                    {rangeKeys.map((key) => (
                        <AppField key={key} label={rangeLabel(key)} onClick={() => openSheet(key)} />
                    ))}
                    <AppField wide className="col-span-2 max-[301px]:col-span-1" label={bodyTypesLabel()} onClick={() => openSheet("bodyTypes")} />
                    <AppField wide className="col-span-2 max-[301px]:col-span-1" label={makesLabel()} onClick={() => openSheet("makes")} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
                    <button onClick={() => setShowMore(true)} className="flex cursor-pointer items-center border-0 bg-transparent p-0 pl-1 text-[13.8px] text-white">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.5">
                            <path d="M5 0v10M0 5h10" />
                        </svg>
                        <span className="ml-[9.33px]">{t.moreFilters}</span>
                    </button>
                    <a href={searchUrl()} className="flex h-10 min-w-[min(31vw,190px)] items-center justify-center rounded bg-[#957e4e] px-2.5 text-sm whitespace-nowrap text-white no-underline max-[251px]:h-auto max-[251px]:min-h-10 max-[251px]:py-2 max-[251px]:text-center max-[251px]:whitespace-normal">
                        {t.searchCars.replace("{count}", appTotalCars)}
                    </a>
                    <button onClick={clearSearch} className="cursor-pointer border-0 bg-transparent p-0 pl-[9.34px] text-[13.8px] text-white">{t.clearSearch}</button>
                </div>
            </section>

            <HeroAd className="max-[601px]:block" />

            {showMore && (
                <FiltersPage onBack={() => setShowMore(false)} onApply={() => setShowMore(false)} onReset={reset}>
                    {rangeKeys.map((key) => (
                        <FilterField key={key} label={rangeLabel(key)} active={values[key] !== null} onClick={() => openSheet(key)} />
                    ))}
                    {choiceField("transmission", false)}
                    {choiceField("fuelType", false)}
                    <FilterField wide label={bodyTypesLabel()} active={values.bodyTypes.length > 0} onClick={() => openSheet("bodyTypes")} />
                    <FilterField wide label={makesLabel()} active={values.makes.length > 0} onClick={() => openSheet("makes")} />
                    {choiceField("drive", true)}
                    {choiceField("colour", true)}
                </FiltersPage>
            )}
            {sheets}
        </>
    )
}
