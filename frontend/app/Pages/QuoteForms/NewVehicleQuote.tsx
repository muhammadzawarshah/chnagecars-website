import QuoteShell from "./Section/QuoteShell"
import PhotoPanel from "./Section/PhotoPanel"
import { DropSelect, FloatInput, MessageBox, RobotCheck, SubmitButton } from "./Section/Fields"
import { hearAbout, provinces } from "./Data/options"

export default function NewVehicleQuote() {

    const half = "h-11.25 w-[48%] mb-6.25 max-[841px]:mb-5";
    const dropdown = "h-18.75 w-[48%] mb-6.25 max-[841px]:mb-5";

    return (
        <>
            <QuoteShell background="/img/quote-forms/keep-it-or-cc-bg-image.jpg" cardClass="flex max-w-275 max-[841px]:block">
                <PhotoPanel image="/img/quote-forms/help-me-find-bg.png" className="min-h-177 w-2/5 shrink-0 bg-position-[left_center] max-[841px]:hidden" logoClass="bottom-40 w-[calc(100%-50px)] gap-3" />
                <div className="relative flow-root w-3/5 self-start px-17.5 pt-11 pb-8 max-[951px]:px-7.5 max-[841px]:w-full max-[841px]:px-6.25">
                    <h4 className="m-0 mb-7.5 text-[32px] leading-7.25 font-bold text-[#fcfcfc] uppercase">Brand New Vehicle Quote</h4>
                    <p className="m-0 mb-3.25 w-[84%] text-sm leading-4.5 font-medium text-[#f5f5f5] max-[841px]:text-lg">Let us know what it is that you are looking for and our team will do their best to assist. Please provide as much information in the box below to help us assist you</p>
                    <ul className="m-0 list-none p-0">
                        <FloatInput label="Name" variant="inline" className={`float-left ${half}`} />
                        <FloatInput label="Surname" variant="inline" className={`float-right ${half}`} />
                        <FloatInput label="Mobile number" type="tel" variant="inline" className={`float-left ${half}`} />
                        <FloatInput label="Email" type="email" variant="inline" className={`float-right ${half}`} />
                        <DropSelect label="Your province" placeholder="Select your province" options={provinces} className={`float-left ${dropdown}`} />
                        <DropSelect label="How did you hear about us?" placeholder="Select your option" options={hearAbout} className={`float-right ${dropdown}`} />
                        <MessageBox label="Message" labelClass="-top-2.5" textareaClass="mb-3.25 h-26.75" className="float-left mb-6.25 h-31.25 w-full" />
                        <RobotCheck className="absolute bottom-5.75 left-17.5 h-11.25 w-2/5 max-[951px]:left-7.5 max-[841px]:relative max-[841px]:left-auto max-[841px]:float-left max-[841px]:mt-8.5 max-[841px]:w-[48%] max-[841px]:pt-2.75" />
                        <li className="float-left h-11.25 w-full max-[841px]:float-right max-[841px]:mt-2.75 max-[841px]:mb-6.25 max-[841px]:w-[37%]">
                            <SubmitButton className="float-right ml-3.75 bg-ink font-medium" />
                        </li>
                    </ul>
                </div>
            </QuoteShell>
        </>
    )
}
