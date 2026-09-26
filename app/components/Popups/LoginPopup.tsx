"use client"

import { useState } from "react"
import { usePopup } from "./PopupContext"
import AuthPopup from "./AuthPopup"
import AuthForm from "./AuthForm"
import AuthField from "./AuthField"

export default function LoginPopup() {

    const { active, open, close } = usePopup();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    function submit() {
        const next: Record<string, string> = {};
        if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Valid email is required";
        if (!password) next.password = "Password is required";
        setErrors(next);
    }

    return (
        <AuthPopup open={active === "login"}>
            <AuthForm
                title="User"
                highlight="Log IN"
                primaryLabel="Sign in"
                onPrimary={submit}
                onClose={close}
                links={[
                    { label: "Forgot Password?", strong: "Reset", onClick: () => open("forgot") },
                    { label: "Dont have an account?", strong: "Register", onClick: () => open("register") },
                ]}
            >
                <AuthField label="Email" type="email" value={email} error={errors.email} onChange={setEmail} />
                <AuthField label="Password" type="password" value={password} error={errors.password} onChange={setPassword} />
            </AuthForm>
        </AuthPopup>
    )
}
