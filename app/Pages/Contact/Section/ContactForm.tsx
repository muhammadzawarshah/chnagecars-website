"use client"

import { FormEvent, useRef, useState } from "react"
import { hearAbout, provinces } from "../../QuoteForms/Data/options"
import { submitWebsiteForm } from "../../../lib/backend/actions"
import { callAction, firstMessage } from "../../../lib/backend/formFields"
import { FieldError, FieldLabel, fieldBox, SelectChevron } from "../../../components/AppForm/AppFormParts"

const emptyForm = { name: "", email: "", phone: "", province: "", hearAbout: "", message: "" };

type Field = keyof typeof emptyForm

export default function ContactForm() {

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [sent, setSent] = useState(false);
    const sending = useRef(false);

    const set = (field: Field) => (value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: "" }));
    };

    async function submit(event: FormEvent) {
        event.preventDefault();
        const next: Partial<Record<Field, string>> = {
            name: form.name.trim() ? "" : "Full name is required",
            email: !form.email.trim() ? "Email address is required" : /^\S+@\S+\.\S+$/.test(form.email) ? "" : "Please enter a valid email address",
            phone: !form.phone.trim() ? "Contact number is required" : /^[+\d][\d\s]{8,14}$/.test(form.phone.trim()) ? "" : "Please enter a valid contact number",
            province: form.province ? "" : "Please select your province",
            hearAbout: form.hearAbout ? "" : "Please select an option",
            message: form.message.trim() ? "" : "Message is required",
        };
        setErrors(next);
        if (!Object.values(next).every((error) => !error) || sending.current) return;
        sending.current = true;
        const result = await callAction(() => submitWebsiteForm("contact", form));
        sending.current = false;
        if (!result.ok) {
            setErrors(Object.keys(result.fields).length ? result.fields : { message: firstMessage(result) });
            return;
        }
        setSent(true);
    }

    return (
        <>
            <section className="pt-10 min-[981px]:pt-0">
                <p className="mt-0 mb-0 text-center text-[12.5px] leading-4 tracking-[2px] text-black min-[981px]:mt-12.5 min-[981px]:text-base min-[981px]:leading-5">Say Hello</p>
                <h2 className="mt-0.5 mb-0 text-center text-xl leading-6 font-normal text-[#957e4e] uppercase min-[981px]:mt-2 min-[981px]:text-[32px] min-[981px]:leading-10">
                    Contact <strong className="font-bold">us</strong>
                </h2>
                <p className="mt-2 mb-0 text-center font-sans text-[13px] leading-4.25 text-black min-[981px]:mt-4 min-[981px]:text-base min-[981px]:leading-6">
                    Please fill in your information and<br />We will be in touch
                </p>

                {sent ? (
                    <div className="mt-7.5 rounded-[5px] border border-[#e0e0e0] bg-[#f5f5f5] px-5 py-7.5 text-center">
                        <p className="m-0 text-lg font-bold text-[#957e4e]">Thank you!</p>
                        <p className="mt-2 mb-0 font-sans text-sm text-black">Your message has been sent. We will be in touch shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate className="mt-1.5 flex flex-col gap-4.25 min-[981px]:mt-7.5 min-[981px]:gap-6">
                        <div>
                            <FieldLabel>Full Name</FieldLabel>
                            <input type="text" autoComplete="name" value={form.name} onChange={(event) => set("name")(event.target.value)} className={`${fieldBox} h-9.5 text-black min-[981px]:h-11`} />
                            <FieldError message={errors.name} />
                        </div>
                        <div>
                            <FieldLabel>Email Address</FieldLabel>
                            <input type="email" autoComplete="email" value={form.email} onChange={(event) => set("email")(event.target.value)} className={`${fieldBox} h-9.5 text-black min-[981px]:h-11`} />
                            <FieldError message={errors.email} />
                        </div>
                        <div>
                            <FieldLabel>Contact Number</FieldLabel>
                            <input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => set("phone")(event.target.value)} className={`${fieldBox} h-9.5 text-black min-[981px]:h-11`} />
                            <FieldError message={errors.phone} />
                        </div>
                        <div>
                            <FieldLabel>Your Province</FieldLabel>
                            <div className="relative">
                                <select value={form.province} onChange={(event) => set("province")(event.target.value)} className={`${fieldBox} h-10 cursor-pointer appearance-none pr-9 min-[981px]:h-11 ${form.province ? "text-black" : "text-[#999]"}`}>
                                    <option value="" disabled>Select Province</option>
                                    {provinces.map((province) => <option key={province} value={province} className="text-black">{province}</option>)}
                                </select>
                                <SelectChevron />
                            </div>
                            <FieldError message={errors.province} />
                        </div>
                        <div>
                            <FieldLabel>How Did You Hear About Us?</FieldLabel>
                            <div className="relative">
                                <select value={form.hearAbout} onChange={(event) => set("hearAbout")(event.target.value)} className={`${fieldBox} h-10 cursor-pointer appearance-none pr-9 min-[981px]:h-11 ${form.hearAbout ? "text-black" : "text-[#999]"}`}>
                                    <option value="" disabled>Select Your Option</option>
                                    {hearAbout.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                                </select>
                                <SelectChevron />
                            </div>
                            <FieldError message={errors.hearAbout} />
                        </div>
                        <div>
                            <FieldLabel>Message</FieldLabel>
                            <textarea value={form.message} onChange={(event) => set("message")(event.target.value)} className={`${fieldBox} block h-17.25 resize-none py-2 text-black min-[981px]:h-30`}></textarea>
                            <FieldError message={errors.message} />
                        </div>
                        <button type="submit" className="mx-auto -mt-1 h-9.75 w-45.5 cursor-pointer rounded-[5px] border-0 bg-[#957e4d] text-[13px] font-bold text-white transition hover:opacity-90 min-[981px]:mt-0 min-[981px]:h-11 min-[981px]:w-55 min-[981px]:text-base">Submit Form</button>
                    </form>
                )}
            </section>
        </>
    )
}
