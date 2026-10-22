"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { usePopup } from "./PopupContext"
import AuthPopup from "./AuthPopup"
import AuthForm from "./AuthForm"
import AuthField from "./AuthField"
import { signIn } from "../../lib/backend/actions"
import { callAction } from "../../lib/backend/formFields"

export default function LoginPopup() {

    const { active, open, close } = usePopup();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const sending = useRef(false);

    async function submit() {
        const next: Record<string, string> = {};
        if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Valid email is required";
        if (!password) next.password = "Password is required";
        setErrors(next);
        if (Object.keys(next).length || sending.current) return;
        sending.current = true;
        const result = await callAction(() => signIn(email, password));
        sending.current = false;
        if (!result.ok) {
            setErrors(Object.keys(result.fields).length ? result.fields : { password: result.message });
            return;
        }
        if (result.redirectTo) {
            close();
            router.push(result.redirectTo);
            router.refresh();
        }
    }

    return (
        <AuthPopup open={active === "login"} light>
            <AuthForm
                title="User"
                highlight="Log IN"
                primaryLabel="Sign in"
                light
                onPrimary={submit}
                onClose={close}
                links={[
                    { label: "Forgot Password?", strong: "Reset", onClick: () => open("forgot") },
                    { label: "Dont have an account?", strong: "Register", onClick: () => open("register") },
                ]}
            >
                <AuthField light label="Email" type="email" value={email} error={errors.email} onChange={setEmail} />
                <AuthField light label="Password" type="password" value={password} error={errors.password} onChange={setPassword} />
            </AuthForm>
        </AuthPopup>
    )
}
