"use client"

import { FormEvent, useRef, useState } from "react"
import { useLanguage } from "../../components/Language/LanguageContext"
import { submitWebsiteForm } from "../../lib/backend/actions"
import { callAction, firstMessage } from "../../lib/backend/formFields"
import { AppBanner, FieldError, FieldLabel, fieldBox } from "../../components/AppForm/AppFormParts"

const emptyForm = { name: "", surname: "", email: "" };

type Field = keyof typeof emptyForm

const fields: { key: Field, label: string, type: string, autoComplete: string }[] = [
    { key: "name", label: "Name", type: "text", autoComplete: "given-name" },
    { key: "surname", label: "Surname", type: "text", autoComplete: "family-name" },
    { key: "email", label: "E-Mail Address", type: "email", autoComplete: "email" },
];

// Copies the app's "Sign up to our Newsletter" screen.
export default function Newsletter() {

    const { language } = useLanguage();
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [sent, setSent] = useState(false);
    const sending = useRef(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        const next: Partial<Record<Field, string>> = {
            name: form.name.trim() ? "" : "Name is required",
            surname: form.surname.trim() ? "" : "Surname is required",
            email: !form.email.trim() ? "E-mail address is required" : /^\S+@\S+\.\S+$/.test(form.email) ? "" : "Please enter a valid e-mail address",
        };
        setErrors(next);
        if (!Object.values(next).every((error) => !error) || sending.current) return;
        sending.current = true;
        const result = await callAction(() => submitWebsiteForm("newsletter", { ...form, source: "web:newsletter" }));
        sending.current = false;
        if (!result.ok) {
            setErrors(Object.keys(result.fields).length ? result.fields : { email: firstMessage(result) });
            return;
        }
        setSent(true);
    }

    return (
        <>
            <main className="bg-white pb-15 font-roboto min-[982px]:max-[1111px]:pt-15">
                <AppBanner src={`/img/newsletter/newsletter-banner-${language}.jpg`} alt="Be the first to know. Subscribe for CHANGECARS updates" />
                <div className="mx-auto w-full max-w-150 px-3.75 pb-10 min-[981px]:px-0 min-[981px]:pb-0">
                    <h1 className="mt-5.5 mb-0 text-center text-xl leading-6 font-normal text-[#957e4e] uppercase min-[981px]:mt-12.5 min-[981px]:text-[32px] min-[981px]:leading-10">
                        Sign up to our <strong className="font-bold">Newsletter</strong>
                    </h1>
                    <p className="mt-1.5 mb-0 text-center text-[13.5px] leading-4.25 text-black min-[981px]:mt-4 min-[981px]:text-base min-[981px]:leading-6">
                        Get motoring news, reviews<br />and advice in your inbox
                    </p>

                    {sent ? (
                        <div className="mt-7.5 rounded-[5px] border border-[#e0e0e0] bg-[#f5f5f5] px-5 py-7.5 text-center">
                            <p className="m-0 text-lg font-bold text-[#957e4e]">Thank you for signing up!</p>
                            <p className="mt-2 mb-0 font-sans text-sm text-black">We will be in touch soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} noValidate className="mt-4.75 flex flex-col gap-4.5 min-[981px]:mt-7.5 min-[981px]:gap-6">
                            {fields.map((field) => (
                                <div key={field.key}>
                                    <FieldLabel>{field.label}</FieldLabel>
                                    <input
                                        type={field.type}
                                        autoComplete={field.autoComplete}
                                        value={form[field.key]}
                                        onChange={(event) => {
                                            setForm({ ...form, [field.key]: event.target.value });
                                            setErrors({ ...errors, [field.key]: "" });
                                        }}
                                        className={`${fieldBox} h-9.25 text-black min-[981px]:h-11`}
                                    />
                                    <FieldError message={errors[field.key]} />
                                </div>
                            ))}
                            <button type="submit" className="mx-auto h-9.75 w-45.5 cursor-pointer rounded-[5px] border-0 bg-[#957e4d] text-[13px] font-bold text-white transition hover:opacity-90 min-[981px]:mt-2 min-[981px]:h-11 min-[981px]:w-55 min-[981px]:text-base">Submit</button>
                        </form>
                    )}
                </div>
            </main>
        </>
    )
}
