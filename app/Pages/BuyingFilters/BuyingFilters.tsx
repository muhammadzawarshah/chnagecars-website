"use client"

import { useRouter } from "next/navigation"
import AdBanner from "../../components/AdBanner"
import { heroAd } from "../Home/Data/ads"
import useAppFilters, { rangeKeys } from "../Home/Section/AppSearch/useAppFilters"
import { BuyingCategory, buyingResultsHref } from "./Data/categories"
import BuyingField from "./Section/BuyingField"

// Copies the app's "Filters" screen that opens from the Buying links; Apply searches within that category.
export default function BuyingFilters({ category }: { category: BuyingCategory }) {

    const router = useRouter();
    const { t, monthly, setMonthly, values, extraFilters, openSheet, rangeLabel, makesLabel, bodyTypesLabel, choiceLabel, reset, searchUrl, sheets } = useAppFilters(category.preset);

    const toggle = "h-9 flex-1 cursor-pointer rounded-[3px] border-0 text-[14.5px]";
    const choice = (key: string, wide = false) => <BuyingField key={key} wide={wide} label={choiceLabel(key)} active={!!extraFilters[key]?.length} onClick={() => openSheet(key)} />;

    // The category is part of the results address, so only the chosen filters go in the query.
    function resultsQuery() {
        const params = new URLSearchParams(searchUrl().split("?")[1] ?? "");
        for (const key of Object.keys(category.preset)) params.delete(key);
        return params.toString();
    }

    function back() {
        if (window.history.length > 1) router.back();
        else router.push("/");
    }

    return (
        <>
            <main className="bg-white max-[981px]:-mt-14 max-[981px]:min-h-svh">
                <div className="relative mx-auto w-full max-w-150 min-[982px]:pt-10 min-[982px]:pb-15">
                    <button onClick={back} aria-label="Back" className="absolute top-2.75 left-5 flex size-5.5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 min-[982px]:hidden">
                        <svg width="17.5" height="15" viewBox="0 0 18 15" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 7.5H1.5M7.5 1.2L1.2 7.5l6.3 6.3" />
                        </svg>
                    </button>
                    <img src="/img/site_logo_dark.svg" alt="CHANGECARS logo" className="mx-auto block h-auto w-36.5 pt-14.5 min-[982px]:pt-0" />
                    <p className="mt-5.5 mb-0 text-center text-[17px] leading-[1.2] text-black capitalize">
                        {t.taglineStart.toLowerCase()} <span className="text-[#957e4e]">{t.taglineHighlight.toLowerCase()}</span>
                    </p>
                    <AdBanner ad={heroAd} className="mx-auto mt-3 block w-[49%] min-w-68" />
                    <h1 className="mt-3.5 mb-0 text-center text-xl leading-[1.2] font-normal text-black">Filters</h1>

                    <div className="px-4.25 pt-6.75 pb-7.5 max-[981px]:pb-20">
                        <div className="flex h-11 rounded-[5px] border border-[#ededed] p-1">
                            <button onClick={() => setMonthly(false)} className={`${toggle} ${monthly ? "bg-transparent text-[#8a8a8a]" : "bg-[#957e4e] text-white"}`}>{t.cashPrice}</button>
                            <button onClick={() => setMonthly(true)} className={`${toggle} ${monthly ? "bg-[#957e4e] text-white" : "bg-transparent text-[#8a8a8a]"}`}>{t.monthlyPayment}</button>
                        </div>
                        <div className="mt-5.25 grid grid-cols-2 gap-x-2.25 gap-y-4.25">
                            {rangeKeys.map((key) => (
                                <BuyingField key={key} label={rangeLabel(key)} active={values[key] !== null} onClick={() => openSheet(key)} />
                            ))}
                            {choice("transmission")}
                            {choice("fuelType")}
                            <BuyingField wide label={bodyTypesLabel()} active={values.bodyTypes.length > 0} onClick={() => openSheet("bodyTypes")} />
                            <BuyingField wide label={makesLabel()} active={values.makes.length > 0} onClick={() => openSheet("makes")} />
                            {choice("drive", true)}
                            {choice("colour", true)}
                        </div>
                    </div>

                    {/* Phones: the app's joined bottom bar. Desktop: two separate buttons under the filter columns. */}
                    <div className="sticky bottom-0 z-10 flex h-11.75 border-t border-[#f3f4f5] bg-white max-[981px]:fixed max-[981px]:inset-x-0 min-[982px]:mx-4.25 min-[982px]:gap-2.25 min-[982px]:border-0">
                        <button onClick={() => router.push(buyingResultsHref(category.slug, resultsQuery()))} className="w-1/2 cursor-pointer border-0 bg-[#957e4e] text-[17px] text-white min-[982px]:flex-1 min-[982px]:rounded-[5px]">Apply</button>
                        <button onClick={reset} className="w-1/2 cursor-pointer border-0 bg-white text-[17px] text-black min-[982px]:flex-1 min-[982px]:rounded-[5px] min-[982px]:border min-[982px]:border-[#ececec]">Reset</button>
                    </div>
                </div>
            </main>
            {sheets}
        </>
    )
}
