"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { submitWebsiteForm } from "../../../lib/backend/actions"
import { callAction, firstMessage, lastPathPart } from "../../../lib/backend/formFields"
import FormAlert from "../../../components/AppForm/FormAlert"

const fields = [
    { key: "firstName", label: "First Name", type: "text" },
    { key: "surname", label: "Surname", type: "text" },
    { key: "email", label: "Email address", type: "email" },
    { key: "contact", label: "Contact number", type: "tel" },
] as const;

type FieldKey = typeof fields[number]["key"]

export default function SpecialForm() {

    const [values, setValues] = useState<Record<FieldKey, string>>({ firstName: "", surname: "", email: "", contact: "" });
    const [focused, setFocused] = useState<FieldKey | null>("firstName");
    const [sent, setSent] = useState(false);
    const firstField = useRef<HTMLInputElement>(null);
    const sending = useRef(false);
    const [formError, setFormError] = useState("");

    // Like the live page: open scrolled 150px down, with First Name focused and its label raised.
    useEffect(() => {
        window.scrollTo(0, 150);
        firstField.current?.focus({ preventScroll: true });
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (sending.current) return;
        const message = event.currentTarget.querySelector("textarea")?.value.trim();
        sending.current = true;
        setFormError("");
        const result = await callAction(() => submitWebsiteForm("special", {
            ...values,
            special: lastPathPart(),
            specialTitle: document.querySelector("main h1")?.textContent?.trim(),
            message,
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
            <form onSubmit={submit} className="relative font-sans">
                <h4 className="m-0 mb-3.25 pb-10 text-[22px] leading-5.5 font-light text-white uppercase">
                    I&rsquo;m interested in this
                    <span className="mt-2.5 block text-[31px] leading-[31px] font-bold">special offer!</span>
                </h4>
                {sent ? (
                    <p className="m-0 text-lg leading-6 text-white">Thank you for your interest. The dealer will be in touch with you shortly.</p>
                ) : (
                    <ul className="m-0 list-none p-0">
                        {fields.map((field) => {
                            const active = focused === field.key || values[field.key] !== "";
                            return (
                                <li key={field.key} className="relative mb-4 h-11.25">
                                    <label htmlFor={`special-${field.key}`} className={`pointer-events-none absolute left-0 font-light text-white transition-all duration-300 ${active ? "bottom-[80%] text-xs leading-[13.8px] max-[676px]:text-sm max-[676px]:leading-[16.1px]" : "bottom-8.25 text-sm leading-[16.1px] max-[676px]:text-base max-[676px]:leading-[18.4px]"}`}>{field.label}</label>
                                    <input
                                        id={`special-${field.key}`}
                                        ref={field.key === "firstName" ? firstField : undefined}
                                        type={field.type}
                                        required
                                        value={values[field.key]}
                                        onFocus={() => setFocused(field.key)}
                                        onBlur={() => setFocused(null)}
                                        onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                                        className="block h-11.25 w-full cursor-pointer border-0 border-b border-white/60 bg-transparent px-3.75 font-sans text-base text-white outline-none"
                                    />
                                </li>
                            );
                        })}
                        <li className="mb-4 h-39.25">
                            <label htmlFor="special-message" className="mt-px block text-sm leading-[17px] font-light text-white max-[676px]:text-base">Message</label>
                            <textarea id="special-message" className="mt-4 mb-3.25 block h-26.75 w-full resize-none overflow-hidden rounded-[5px] border border-transparent bg-white p-2.5 font-sans text-base leading-4 text-ink outline-none"></textarea>
                        </li>
                        <li className="flex items-start max-[406px]:block">
                            <label className="mt-2 flex w-1/2 cursor-pointer items-center max-[406px]:mt-0 max-[406px]:w-full">
                                <input type="checkbox" required className="mr-2.5 size-5.5 cursor-pointer appearance-none rounded-[5px] bg-white outline-none checked:bg-[url(/img/specials/close-gold-hover.svg)] checked:bg-size-[14px] checked:bg-center checked:bg-no-repeat" />
                                <span className="text-xs leading-5.5 font-medium text-[#f5f5f5]">I`m not a robot</span>
                            </label>
                            <span className="ml-[3.5px] block w-[49%] max-[406px]:mt-3.25 max-[406px]:-ml-1 max-[406px]:w-full">
                                <button type="submit" className="float-right -mr-0.75 h-10 w-38 max-[406px]:float-none cursor-pointer rounded-[5px] border-0 bg-[#212121] font-sans text-sm leading-10 font-medium text-white shadow-[0_3px_6px_rgba(0,0,0,0.07)] transition duration-300 hover:opacity-80 active:opacity-80 max-[676px]:text-base">Submit form</button>
                            </span>
                        </li>
                        {formError && <li className="clear-both pt-4"><FormAlert tone="dark" message={formError} /></li>}
                    </ul>
                )}
            </form>
        </>
    )
}
