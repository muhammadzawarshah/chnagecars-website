"use client"

import { ReactNode, useState } from "react"

const periods = [84, 72, 60, 48, 36];

// Matches the live calculator: standard amortisation plus a fixed monthly amount for fees.
const MONTHLY_FEES = 164;

function installment(price: number, deposit: number, balloon: number, months: number, rate: number) {
    const r = rate / 100 / 12;
    const factor = r / (1 - Math.pow(1 + r, -months));
    return Math.max(0, (price - deposit - balloon * Math.pow(1 + r, -months)) * factor + MONTHLY_FEES);
}

const faqs: { title: string, body: ReactNode }[] = [
    {
        title: "Pros & Cons of Balloon Payments",
        body: (
            <>
                <p>A balloon payment amount is a once-off lump sum payment that you must pay to the bank at the end of the loan term (months)</p>
                <p>Financing a car with a Balloon reduces the amount of your monthly repayments, since you are effectively borrowing less money from the bank during the loan term</p>
                <p>Banks generally only consider balloon payments on newer cars, exceptions could be made for exotic older cars</p>
                <p>At the end of the term you&apos;ll owe the balloon payment plus interest</p>
                <p className="font-bold text-[#374151]">Pros of balloon payments</p>
                <ul>
                    <li>You pay a lower monthly installments.</li>
                    <li>No deposit is required (dependant on your risk profile).</li>
                    <li>You can sell your car at the end of the loan term and use the money to pay off the lump sum.</li>
                    <li>Banks, depending on the car, might refinance the balloon payment at the end of the initial term.</li>
                </ul>
                <p className="font-bold text-[#374151]">Cons of balloon payments</p>
                <ul>
                    <li>The balloon amount attracts interest.</li>
                    <li>During the financing term your vehicle (asset) depreciates in value, however the balloon does not.</li>
                    <li>In the event that you want to sell or trade in your car the balloon payment (potentially a large sum of money) must be settled.</li>
                    <li>You need to plan (save money) for the settlement amount at the end of the term.</li>
                </ul>
            </>
        ),
    },
    {
        title: "Why do banks vary the Interest Rate",
        body: (
            <>
                <p>Bank&apos;s assess their risk, in the event that a you do not repay their loan (this is, your credit risk), which determines the lending rate they end up charging you.</p>
                <p>Your personal credit score is important when applying for vehicle finance.</p>
                <p>It is a good idea for you to find out what your score is in advance, which directly influences the rate you will end up getting from the bank.</p>
                <p>You can adjust the rate in the calculator above to get a more accurate calculation.</p>
                <p>The banks use the services of Credit Bureau&apos;s to determine your Credit Score. All your accounts collectively across various lenders, store cards, mobile payments and previous bank loans create your personal profile which indicates your ability to repay the loan.</p>
            </>
        ),
    },
    {
        title: "Trade & Retail Pricing of Cars",
        body: (
            <>
                <p>The Trade Value of a vehicle is based on the year, &quot;the vehicle was manufactured&quot;, and the exact make, model and optional extras. At times this becomes tricky to navigate, for example a dealer sells you a 2020 &quot;manufactured&quot; model in early 2021 and you expect to get the Trade Value of your car as per 2021, but the dealer is offering you the 2020 price. All new vehicles sold in South Africa have a unique <strong className="text-[#374151]">&quot;MM Code&quot;</strong> which is managed by TransUnion.</p>
                <p>TransUnion provides a monthly updated (vehicle pricing) service to motor dealers with 2 values for each year model, namely the &quot;trade&quot; what you can expect when selling and &quot;retail&quot; what you can expect when buying. Both these values are calculated as an average since there are so many other factors to take into account, the mileage, condition, accident damage, spare key, tyres, paint work etc.</p>
            </>
        ),
    },
    {
        title: "Don't forget about the Insurance",
        body: (
            <>
                <p>When financing your car, the bank will require you to take out insurance. They use the vehicle as collateral (repossess and sell it) in the event the loan is not fully paid up.</p>
                <p>First-time car buyers with limited driving experience usually face higher premiums. Insurance companies have extensive statistics on drivers in South Africa, indicating that the risk of accidents is greater for inexperienced drivers compared to more seasoned ones.</p>
                <p>TIP: Contact your insurance company yearly to reduce your premium, each year your car depreciates as such there is no benefit in paying the previous years&apos; higher amount. In the event that your car is stolen or written off in an accident you will get paid out based on the TransUnion Trade/Retail price.</p>
            </>
        ),
    },
];

const toNumber = (value: string) => Number(value) || 0;

export default function FinanceCalculator({ price: startPrice }: { price: number }) {

    const [price, setPrice] = useState(String(startPrice));
    const [months, setMonths] = useState(72);
    const [depositRands, setDepositRands] = useState("");
    const [depositPercent, setDepositPercent] = useState("");
    const [balloonPercent, setBalloonPercent] = useState("");
    const [balloonRands, setBalloonRands] = useState("");
    const [rate, setRate] = useState(12.75);
    const [faq, setFaq] = useState<string | null>(null);

    const total = toNumber(price);
    const monthly = installment(total, toNumber(depositRands), toNumber(balloonRands), months, rate);

    function changeDepositRands(value: string) {
        setDepositRands(value);
        setDepositPercent(value && total ? ((toNumber(value) / total) * 100).toFixed(2) : "");
    }

    function changeDepositPercent(value: string) {
        setDepositPercent(value);
        setDepositRands(value ? String(Math.round((total * toNumber(value)) / 100)) : "");
    }

    function changeBalloonPercent(value: string) {
        setBalloonPercent(value);
        setBalloonRands(value ? String(Math.round((total * toNumber(value)) / 100)) : "");
    }

    function changeBalloonRands(value: string) {
        setBalloonRands(value);
        setBalloonPercent(value && total ? String(Math.round((toNumber(value) / total) * 10000) / 100) : "");
    }

    const ring = "shadow-[0_0_0_1px_#957e4d,0_1px_2px_rgba(0,0,0,0.05)]";
    const input = `block h-9.25 w-full rounded-md border-0 bg-white/50 px-3 py-2 text-base leading-4 text-gold outline-none ${ring}`;
    const label = "block text-base leading-6 font-medium";
    const fields: [string, string, (value: string) => void][] = [
        ["Deposit (Rands)", depositRands, changeDepositRands],
        ["Deposit (%)", depositPercent, changeDepositPercent],
        ["Balloon (%)", balloonPercent, changeBalloonPercent],
        ["Balloon (Rands)", balloonRands, changeBalloonRands],
    ];

    return (
        <>
            <div className="h-200 overflow-y-auto px-8 font-[ui-sans-serif,system-ui,sans-serif] text-base leading-6 text-black">
                <div className="mb-4">
                    <div className="grid gap-4 px-2 text-gold">
                        <label>
                            <span className={label}>Vehicle Price</span>
                            <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} className={input} />
                        </label>
                        <label>
                            <span className="block text-sm leading-5 font-medium">Period</span>
                            <span className={`relative mt-1 block rounded-md bg-white/50 ${ring}`}>
                                <select value={months} onChange={(event) => setMonths(Number(event.target.value))} className="block h-9 w-full cursor-default appearance-none rounded-md border-0 bg-white/50 py-2 pr-10 pl-3 text-sm leading-5 text-gold outline-none">
                                    {periods.map((period) => <option key={period} value={period} className="text-[#111827]">{period} months</option>)}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg className="size-5 bg-white/50" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </span>
                            </span>
                        </label>
                        {fields.map(([name, value, onChange]) => (
                            <label key={name}>
                                <span className={label}>{name}</span>
                                <input type="number" value={value} onChange={(event) => onChange(event.target.value)} className={input} />
                            </label>
                        ))}
                        <p className="m-0 px-1 text-xs leading-4">Credit lenders will only consider balloon payments on cars that are a maximum of 4 years old</p>
                        <label className="mt-2 block">
                            <span className="block text-sm leading-5 font-medium">* Interest Rate {rate}%</span>
                            <input
                                type="range"
                                min={8.75}
                                max={18.75}
                                step={0.25}
                                value={rate}
                                onChange={(event) => setRate(Number(event.target.value))}
                                className="mt-2.5 block h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-3 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-gold [&::-moz-range-track]:h-1.25 [&::-moz-range-track]:rounded-[3px] [&::-moz-range-track]:bg-gold [&::-webkit-slider-runnable-track]:h-1.25 [&::-webkit-slider-runnable-track]:rounded-[3px] [&::-webkit-slider-runnable-track]:bg-gold [&::-webkit-slider-thumb]:-mt-1.75 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-gold"
                            />
                        </label>
                        <div className="mb-4 flex justify-center">
                            <p className="m-0 text-2xl leading-8">Monthly Installment R{Math.round(monthly).toLocaleString("en-US").replace(/,/g, " ")}</p>
                        </div>
                    </div>
                    <p className="m-0 px-2 text-xs leading-4 text-gold">All calculations supplied on this site, together with rates quoted, are guidelines only and are subject to confirmation at the time of finalising any transactions.<br />* Current Prime Rate is 10.75%</p>
                    <p className="m-0 py-4 text-lg leading-7">Financing a Vehicle? Common questions answered</p>
                    {faqs.map((item) => (
                        <div key={item.title}>
                            <button type="button" onClick={() => setFaq(faq === item.title ? null : item.title)} aria-expanded={faq === item.title} className="flex w-full cursor-pointer border-0 border-t border-[#e5e7eb] bg-transparent p-2 text-left font-[inherit]">
                                <span className="flex-1 text-base leading-6 font-semibold text-gold">{item.title}</span>
                                <svg className="mx-auto size-5 pt-1" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={faq === item.title ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg>
                            </button>
                            {faq === item.title && (
                                <div className="px-4 py-2 text-[#6b7280] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] [&_li]:py-1 [&_p]:m-0 [&_p]:py-2 [&_ul]:m-0 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:p-0">
                                    {item.body}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
