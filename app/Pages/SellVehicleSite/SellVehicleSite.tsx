import PageScroll from "./Section/PageScroll"
import HowItWorks from "./Section/HowItWorks"
import WeeleeForm from "./Section/WeeleeForm/WeeleeForm"

// The live /sell-your-vehicle page: intro and steps on the left, the WeeLee sell form on the right.
export default function SellVehicleSite() {
    return (
        <>
            <PageScroll />
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[#48484a] bg-[url(/img/sell-vehicle-bg.jpg)] bg-cover bg-top bg-no-repeat"></div>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-black/60"></div>
            <main className="relative min-h-[calc(84vh+50px)] px-2.5 pt-[58px] pb-12.5 font-sans max-[1111px]:pt-25 max-[981px]:pt-11">
                <div className="mx-auto flex max-w-340 flex-col overflow-hidden rounded-xl">
                    <div className="relative rounded-t-[11px] bg-black/40 p-7.5 before:absolute before:bottom-0 before:left-0 before:w-4/5 before:border-t-[30px] before:border-l-[950px] before:border-t-transparent before:border-l-gold/60 before:content-[''] after:absolute after:right-0 after:bottom-0 after:w-4/5 after:border-t-[30px] after:border-r-[950px] after:border-t-transparent after:border-r-gold/60 after:content-[''] max-[657px]:before:border-t-[28px] max-[657px]:before:border-l-[420px] max-[657px]:after:border-t-[28px] max-[657px]:after:border-r-[420px]">
                        <h1 className="m-0 mb-7.5 text-left text-[32px] leading-8 font-light tracking-[0.02em] text-white uppercase max-[852px]:text-center">
                            Sell your <strong className="font-bold text-gold">vehicle</strong>
                        </h1>
                    </div>
                    <div className="flex min-h-150 gap-3.75 bg-white/30 p-3.75 max-[901px]:flex-col max-[501px]:px-5 max-[501px]:py-7.5">
                        <div className="h-fit w-full rounded-[15px] bg-white px-7.5 py-5">
                            <p className="m-0 mb-5.5 text-left text-[17px] leading-7 tracking-[0.02em] text-[#2f2f2f]">
                                <strong>CHANGECARS</strong> makes it easy to sell your vehicle with confidence. Our trusted dealer network connects you to serious buyers, giving your vehicle maximum exposure and increasing your chances of receiving competitive offers. We’ve streamlined the entire process to be simple, transparent, and hassle-free, so you can move forward with clarity and peace of mind from start to finish
                            </p>
                            <HowItWorks />
                        </div>
                        <div className="w-full rounded-[15px] max-[901px]:pb-[3px]">
                            <WeeleeForm />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
