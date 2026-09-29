"use client"

import { useState } from "react"
import { usePopup } from "./PopupContext"
import AuthPopup from "./AuthPopup"
import AuthForm from "./AuthForm"
import AuthField from "./AuthField"
import AuthSuccess from "./AuthSuccess"
import SegmentedToggle, { ToggleOption } from "../SegmentedToggle"

type SellerType = "private" | "dealer"

const sellerTypes: [ToggleOption<SellerType>, ToggleOption<SellerType>] = [
    {
        value: "private",
        label: "Private Seller",
        icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="4.5" r="2.8" /><path d="M1.5 13c.6-2.9 2.8-4.3 5.5-4.3s4.9 1.4 5.5 4.3" strokeLinecap="round" /></svg>,
    },
    {
        value: "dealer",
        label: "Dealer",
        icon: <svg width="14" height="13" viewBox="0 0 15 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M1.5 13V5.5L7.5 1.5l6 4V13z" /><path d="M5.5 13V9h4v4" /></svg>,
    },
]

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
    const [sellerType, setSellerType] = useState<SellerType>("private");
    const isPrivate = sellerType === "private";
    const nameLabel = isPrivate ? "Full name" : "Dealer name";

    function update(key: keyof typeof emptyForm, value: string) {
        setForm({ ...form, [key]: value });
    }

    function submit() {
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = `${nameLabel} is required`;
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
                    title={isPrivate ? "Private Seller" : "Dealer"}
                    header={<SegmentedToggle label="Register as" options={sellerTypes} value={sellerType} onChange={setSellerType} className="mb-5 max-[841px]:mr-8" />}
                    highlight="REGISTRATION"
                    compact
                    light
                    description={isPrivate
                        ? <p className="text-sm leading-4.5 text-[#555]">Sell your car <strong className="text-[#957e4e]">directly to buyers</strong> on CHANGECARS</p>
                        : <p className="text-sm leading-4.5 text-[#555]">CHANGECARS is a platform for <strong className="text-[#957e4e]">Franchised approved dealers</strong> only</p>}
                    primaryLabel="Register"
                    onPrimary={submit}
                    onClose={close}
                    links={[{ label: "Already have an account?", strong: "Sign in", onClick: () => open("login") }]}
                >
                    <AuthField light label={nameLabel} value={form.name} error={errors.name} onChange={(value) => update("name", value)} />
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
