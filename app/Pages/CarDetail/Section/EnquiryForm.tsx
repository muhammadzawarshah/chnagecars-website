"use client"

import { useRef, useState } from "react"
import CheckSelect from "./CheckSelect"
import { submitWebsiteForm } from "../../../lib/backend/actions"
import { callAction, firstMessage, lastPathPart, readFields } from "../../../lib/backend/formFields"
import FormAlert from "../../../components/AppForm/FormAlert"

const titles = ["Mr", "Mrs", "Miss"];
const sources = ["ALL THINGS MOTORING", "Billboard", "Educar", "Facebook", "Google", "Instagram", "Other", "Podcast", "Radio", "Recommendation", "Tik Tok", "Truecaller", "TV", "Whatsapp", "Word of mouth", "YouTube"];

type EnquiryFormProps = {
    title: string
    dealer: string
    logo: string
    idPrefix?: string
}

export default function EnquiryForm({ title, dealer, logo, idPrefix = "enquiry" }: EnquiryFormProps) {

    const [sent, setSent] = useState(false);
    const sending = useRef(false);
    const [formError, setFormError] = useState("");
    const message = encodeURIComponent(`Hi, I'm interested in the ${title} on CHANGECARS.`);
    const field = "block h-7.75 w-full rounded-[20px] border border-gold bg-black/75 px-2.5 font-sans text-sm text-white outline-none placeholder:text-white";
    const contact = "h-10 rounded-[5px] bg-gold px-2.5 text-sm font-medium text-white no-underline shadow-[0_3px_6px_rgba(0,0,0,0.7)]";

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (sending.current) return;
        const formElement = event.currentTarget;
        const values = readFields(formElement);
        // The car is the one this page shows: its id ends the URL (/car/<title>-<id>).
        const slug = lastPathPart();
        sending.current = true;
        setFormError("");
        const result = await callAction(() => submitWebsiteForm("vehicle-enquiry", {
            carId: slug.slice(slug.lastIndexOf("-") + 1),
            title: values["Title"] as string,
            name: values["Name"] as string,
            surname: values["Surname"] as string,
            email: values["Email address"] as string,
            phone: values["Contact number"] as string,
            hearAbout: values["Where did you hear about CHANGECARS"] as string,
            message: values[`${idPrefix}-message`] as string,
            newsletter: formElement.querySelector<HTMLInputElement>("input[type=checkbox]")?.checked ?? false,
        }));
        sending.current = false;
        if (!result.ok) {
            setFormError(firstMessage(result));
            return;
        }
        setSent(true);
    }

    return (
        <>
            <div className="mx-auto mb-2.5 size-19.25 rounded-full border-2 border-white bg-ink bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${logo})` }}></div>
            <h2 className="m-0 text-center text-base leading-4.75 font-bold text-white">{dealer}</h2>
            <p className="mt-4 mb-5.25 text-center text-base leading-4.75 text-white">Enquire about this vehicle</p>
            <div className="mb-5 flex justify-center gap-2.5">
                <a href="tel:0861248248" className={`${contact} leading-10`}>Call Dealer</a>
                <a href={`https://wa.me/27861248248?text=${message}`} target="_blank" className={`${contact} flex items-center border border-gold`}>
                    <img src="/img/car-detail/orig/icon-whatsapp-logo-green-white.svg" alt="" className="mr-1.5 size-6" />
                    WhatsApp The Dealer
                </a>
            </div>
            {sent ? (
                <p className="m-0 text-center text-base leading-6 text-white">Thank you, {dealer} will be in touch with you shortly.</p>
            ) : (
                <form onSubmit={submit} className="flow-root">
                    <CheckSelect label="Title" options={titles} listHeight="" />
                    <div className="mb-3.25 grid grid-cols-2 gap-x-3.25">
                        <input id={`${idPrefix}-name`} required placeholder="Name" aria-label="Name" className={field} />
                        <input required placeholder="Surname" aria-label="Surname" className={field} />
                    </div>
                    <input type="email" required placeholder="Email address" aria-label="Email address" className={`${field} mb-3.25`} />
                    <input type="tel" required placeholder="Contact number" aria-label="Contact number" className={`${field} mb-3.25`} />
                    <CheckSelect label="Where did you hear about CHANGECARS" options={sources} tall listHeight="max-h-30.25" />
                    <label htmlFor={`${idPrefix}-message`} className="mb-1.5 block text-sm leading-5.5 text-white">Message</label>
                    <textarea
                        id={`${idPrefix}-message`}
                        defaultValue={`I would like you to contact me with regards to the ${title}.`}
                        className="mb-3.25 block h-28 w-full resize-none rounded-[10px] border border-gold bg-black/75 p-2.5 font-sans text-[13px] leading-4.5 text-white outline-none"
                    ></textarea>
                    <button type="submit" className="float-right mt-2.5 h-9.75 w-39 cursor-pointer rounded-[5px] border-0 bg-gold font-sans text-sm leading-9.75 font-medium text-white">Message Dealer</button>
                    <label className="float-left mt-4 flex cursor-pointer items-center text-sm leading-5.5 text-white">
                        <input type="checkbox" className="mr-2.5 size-5.5 cursor-pointer appearance-none rounded-[5px] bg-white checked:bg-[url(/img/check.svg)] checked:bg-size-[14px] checked:bg-center checked:bg-no-repeat" />
                        Newsletter signup
                    </label>
                    <FormAlert tone="dark" message={formError} className="clear-both mt-4" />
                </form>
            )}
        </>
    )
}
