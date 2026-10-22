import QuoteShell from "./Section/QuoteShell"
import { DropSelect, FloatInput, MessageBox, RobotCheck, SubmitButton } from "./Section/Fields"
import { hearAbout, provinces } from "./Data/options"

export default function KeepItOrChangecars() {

    const half = "h-11.25 w-[48%] mb-6.25";
    const dropdown = "h-18.75 w-[48%] mb-6.25";

    return (
        <>
            <QuoteShell background="/img/quote-forms/keep-it-or-cc-bg-image.jpg" cardClass="max-w-275 min-h-166.75" narrowGutter>
                <div className="relative flow-root w-full px-17.5 pt-11 pb-8 max-[951px]:px-7.5 max-[501px]:px-5">
                    <h1 className="m-0 mb-7.5 text-[32px] leading-7.25 font-medium text-[#fcfcfc] uppercase">Keep it or <strong className="inline-block font-bold">Changecars</strong></h1>
                    <p className="m-0 mb-3.25 w-[84%] text-sm leading-4.5 font-medium text-[#f5f5f5] max-[841px]:text-lg">
                        Do I keep my current vehicle or do I <strong>CHANGECARS!</strong>
                        <br />
                        <br />
                        We offer advice to help you make an informed decision as to whether it is time to <strong>CHANGECARS</strong>. Let us assist you make the right decision at the right time
                    </p>
                    <ul className="m-0 list-none p-0">
                        <FloatInput label="Name" variant="raised" autoFocus className={`float-left ${half}`} />
                        <FloatInput label="Surname" variant="raised" className={`float-right ${half}`} />
                        <FloatInput label="Mobile number" type="tel" variant="raised" className={`float-left ${half}`} />
                        <FloatInput label="Email" type="email" variant="raised" className={`float-right ${half}`} />
                        <DropSelect label="Your province" placeholder="Select your province" options={provinces} className={`float-left ${dropdown}`} />
                        <DropSelect label="How did you hear about us?" placeholder="Select your option" options={hearAbout} className={`float-right ${dropdown}`} />
                        <MessageBox label="Tell us your story" labelClass="-top-2.5" textareaClass="mb-3.25 h-26.75" className="float-left mb-6.25 h-31.25 w-full" />
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
