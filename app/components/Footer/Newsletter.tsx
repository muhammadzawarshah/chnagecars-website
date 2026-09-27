"use client"

import { useState } from "react"

const fields = [
    { name: "name", label: "Name", type: "text", error: "Name is required" },
    { name: "surname", label: "Surname", type: "text", error: "Surname is required" },
    { name: "email", label: "E-mail Address", type: "email", error: "E-mail is required" },
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
                <h3 className="mx-auto mb-7.5 w-[64%] text-3xl font-bold text-white max-[899px]:text-center max-[401px]:w-full max-[401px]:text-2xl max-[301px]:text-xl">Sign up to our Newsletter</h3>
                {success ? (
                    <p className="w-full text-center text-[19pt] text-gold">Thank you for signing up! We will be in touch soon!</p>
                ) : (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mx-auto flex w-full max-w-220 justify-center gap-6.25 max-[866px]:max-w-87.5 max-[866px]:flex-col max-[866px]:items-center">
                            <div className="flex items-start gap-6.25 max-[866px]:w-full max-[866px]:flex-col">
                                {fields.map((field) => (
                                    <div key={field.name} className="max-[866px]:w-full">
                                        <label className="mb-0.75 block text-base font-bold text-white">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={values[field.name] ?? ""}
                                            onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                                            className="h-10 w-full rounded-t-[3px] border-0 border-b border-white bg-[rgba(245,245,245,0.05)] px-3.75 text-base leading-8.75 text-white outline-none"
                                        />
                                        {errors[field.name] && <span className="block text-xs leading-4 text-[#ff3030]">{field.error}</span>}
                                    </div>
                                ))}
                            </div>
                            <a onClick={handleSubmit} className="mt-6 block h-10 cursor-pointer rounded-[5px] bg-gold px-15 text-center max-[301px]:px-8 text-sm leading-10 font-normal text-snow no-underline transition min-[1085px]:hover:opacity-80 max-[866px]:m-0">
                                Submit
                            </a>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}
