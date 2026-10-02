"use client"

import { useLanguage } from "../../components/Language/LanguageContext"
import ContactInfo from "./Section/ContactInfo"
import ContactForm from "./Section/ContactForm"
import { AppBanner } from "../../components/AppForm/AppFormParts"

// Copies the app's "Get in touch" screen; on desktop the contact list and form sit side by side.
export default function Contact() {

    const { language } = useLanguage();

    return (
        <>
            <main className="bg-white pb-15 font-roboto">
                <AppBanner src={`/img/contact/contact-banner-${language}.jpg`} alt="Need assistance? Get in touch. CHANGECARS is here to help" />
                <div className="mx-auto w-full max-w-150 pb-10 min-[981px]:max-w-300 min-[981px]:pb-0">
                    <div className="px-4.5 min-[981px]:grid min-[981px]:grid-cols-2 min-[981px]:gap-15 min-[981px]:px-10">
                        <ContactInfo />
                        <ContactForm />
                    </div>
                </div>
            </main>
        </>
    )
}
