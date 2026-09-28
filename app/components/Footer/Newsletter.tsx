"use client"

import { useState } from "react"

const fields = [
    { name: "name", label: "Name", type: "text", error: "Name is required" },
    { name: "surname", label: "Surname", type: "text", error: "Surname is required" },
    { name: "email", label: "E-mail Address", type: "email", error: "E-mail is required", wide: true },
]

export default function Newsletter() {

    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [success, setSuccess] = useState(false);

    function handleSubmit() {
        const nextErrors: Record<string, boolean> = {};
        fields.forEach((field) => {
            if (!values[field.name]?.trim()) nextErrors[field.name] = true;
        });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) setSuccess(true);
    }

    return (
        <>
            <div id="newsletter" className="float-left w-full border-t-2 border-white/10 pt-15 pb-25 max-[899px]:pb-15 max-[866px]:pt-12.5 max-[866px]:pb-5">
                <h3 className="mx-auto mb-2 w-[64%] text-3xl font-bold text-white max-[981px]:mb-1.5 max-[981px]:w-full max-[981px]:text-center max-[981px]:text-[16.5px] max-[981px]:leading-6 max-[981px]:font-normal max-[981px]:text-[#957e4e] max-[981px]:uppercase">Sign up to our <strong className="font-bold">Newsletter</strong></h3>
                <p className="mx-auto mt-0 mb-7.5 w-[64%] text-base leading-6 text-[#cfcfcf] max-[981px]:mb-6.5 max-[981px]:w-auto max-[981px]:max-w-50 max-[981px]:text-center max-[981px]:text-[12.5px] max-[981px]:leading-4.5">Get motoring news, reviews and advice in your inbox</p>
                {success ? (
                    <p className="w-full text-center text-[19pt] text-gold">Thank you for signing up! We will be in touch soon!</p>
                ) : (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mx-auto flex w-full max-w-220 justify-center gap-6.25 max-[981px]:max-w-150 max-[981px]:flex-col max-[981px]:items-center max-[981px]:gap-5 max-[981px]:px-4">
                            <div className="flex items-start gap-6.25 max-[981px]:grid max-[981px]:w-full max-[981px]:grid-cols-2 max-[981px]:gap-x-3 max-[981px]:gap-y-5">
                                {fields.map((field) => (
                                    <div key={field.name} className={`max-[981px]:w-full ${field.wide ? "max-[981px]:col-span-2" : ""}`}>
                                        <label className="mb-0.75 block text-base font-bold text-white max-[981px]:mb-2 max-[981px]:text-[11px] max-[981px]:leading-3.5">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={values[field.name] ?? ""}
                                            onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                                            className="h-10 w-full rounded-t-[3px] border-0 border-b border-white bg-[rgba(245,245,245,0.05)] px-3.75 text-base leading-8.75 text-white outline-none max-[981px]:h-9.25 max-[981px]:rounded-[4px] max-[981px]:border-b-0 max-[981px]:bg-[#2a2a2a] max-[981px]:px-3 max-[981px]:text-sm"
                                        />
                                        {errors[field.name] && <span className="block text-xs leading-4 text-[#ff3030]">{field.error}</span>}
                                    </div>
                                ))}
                            </div>
                            <a onClick={handleSubmit} className="mt-6 block h-10 cursor-pointer rounded-[5px] bg-gold px-15 text-center text-sm leading-10 font-normal text-snow no-underline transition min-[1085px]:hover:opacity-80 max-[981px]:m-0 max-[981px]:h-9.25 max-[981px]:w-52 max-[981px]:max-w-full max-[981px]:px-0 max-[981px]:text-[12.5px] max-[981px]:leading-9.25 max-[981px]:font-bold">
                                Submit
                            </a>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}
