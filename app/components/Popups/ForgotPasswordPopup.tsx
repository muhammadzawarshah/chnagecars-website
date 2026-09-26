"use client"

import { useState } from "react"
import { usePopup } from "./PopupContext"
import AuthPopup from "./AuthPopup"
import AuthForm from "./AuthForm"
import AuthField from "./AuthField"
import AuthSuccess from "./AuthSuccess"

export default function ForgotPasswordPopup() {

    const { active, open, close } = usePopup();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    function submit() {
        const valid = /^\S+@\S+\.\S+$/.test(email);
        setError(valid ? "" : "Valid email is required");
        if (valid) setSuccess(true);
    }

    return (
        <AuthPopup open={active === "forgot"}>
            {success ? (
                <AuthSuccess message="We`ve sent you an email with a temporary link to reset your password." onClose={close} />
            ) : (
                <AuthForm
                    title="User"
                    highlight="Forgot Password"
                    description={<p className="mb-12.5 text-sm leading-4.5 text-white">Fill out your email and click on submit. An email will be sent to this address with a link to reset the password.</p>}
                    primaryLabel="Submit"
                    onPrimary={submit}
                    onClose={close}
                    links={[
                        { label: "Already have an account?", strong: "Sign in", onClick: () => open("login") },
                        { label: "Don`t have an account?", strong: "Register", onClick: () => open("register") },
                    ]}
                >
                    <AuthField label="Email" type="email" value={email} error={error} onChange={setEmail} />
                </AuthForm>
            )}
        </AuthPopup>
    )
}
