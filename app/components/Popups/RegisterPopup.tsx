"use client"

import { useState } from "react"
import { usePopup } from "./PopupContext"
import AuthPopup from "./AuthPopup"
import AuthForm from "./AuthForm"
import AuthField from "./AuthField"
import AuthSuccess from "./AuthSuccess"

const emptyForm = {
    name: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
}

export default function RegisterPopup() {

    const { active, open, close } = usePopup();
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    function update(key: keyof typeof emptyForm, value: string) {
        setForm({ ...form, [key]: value });
    }

    function submit() {
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = "Dealer name is required";
        if (!form.contactPerson.trim()) next.contactPerson = "Contact person name is required";
        if (!form.contactNumber.trim()) next.contactNumber = "Contact number name is required";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Valid email is required";
        if (!form.address.trim()) next.address = "Address name is required";
        if (!form.password) next.password = "Password name is required";
        if (form.password !== form.confirmPassword) next.confirmPassword = "Password does not match";
        setErrors(next);
        if (Object.keys(next).length === 0) setSuccess(true);
    }

    return (
        <AuthPopup open={active === "register"} light>
            {success ? (
                <AuthSuccess light message="Your account is ready! Please check your mail to activate your account" onClose={close} onLogin={() => open("login")} />
            ) : (
                <AuthForm
                    title="Dealer"
                    highlight="REGISTRATION"
                    compact
                    light
                    description={<p className="text-sm leading-4.5 text-[#555]">CHANGECARS is a platform for <strong className="text-[#957e4e]">Franchised approved dealers</strong> only</p>}
                    primaryLabel="Register"
                    onPrimary={submit}
                    onClose={close}
                    links={[{ label: "Already have an account?", strong: "Sign in", onClick: () => open("login") }]}
                >
                    <AuthField light label="Dealer name" value={form.name} error={errors.name} onChange={(value) => update("name", value)} />
                    <AuthField light label="Contact person" value={form.contactPerson} error={errors.contactPerson} className="mt-2.5 w-[53%]!" onChange={(value) => update("contactPerson", value)} />
                    <AuthField light label="Contact number" type="tel" value={form.contactNumber} error={errors.contactNumber} className="float-right! mt-2.5 w-[43%]!" onChange={(value) => update("contactNumber", value.replace(/[^\d+ ]/g, "").slice(0, 12))} />
                    <AuthField light label="Email" type="email" value={form.email} error={errors.email} onChange={(value) => update("email", value)} />
                    <AuthField light label="Address" value={form.address} error={errors.address} onChange={(value) => update("address", value)} />
                    <AuthField light label="Password" type="password" value={form.password} error={errors.password} className="w-[48%]! max-[841px]:mb-5 max-[601px]:mb-2.5" onChange={(value) => update("password", value)} />
                    <AuthField light label="Retype password" type="password" value={form.confirmPassword} error={errors.confirmPassword} className="float-right! w-[48%]! max-[601px]:mb-2.5" onChange={(value) => update("confirmPassword", value)} />
                </AuthForm>
            )}
        </AuthPopup>
    )
}
