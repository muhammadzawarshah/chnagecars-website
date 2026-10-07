"use client"

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react"
import { submitWebsiteForm } from "../../../lib/backend/actions"
import { FieldValues, callAction, checkFiles, firstMessage, pickedFiles, readFields, uploadFiles, uploadProblem } from "../../../lib/backend/formFields"
import FormAlert from "../../../components/AppForm/FormAlert"

const text = (values: FieldValues, label: string) => (typeof values[label] === "string" ? values[label] as string : undefined);

const contact = (values: FieldValues) => ({
    name: text(values, "Name"),
    surname: text(values, "Surname"),
    mobile: text(values, "Mobile number"),
    email: text(values, "Email"),
    province: text(values, "Your province"),
    hearAbout: text(values, "How did you hear about us?"),
});

// Each enquiry page (by its URL) → the API form and its fields, read by the inputs' labels.
const quoteForms: Record<string, { form: string, values: (values: FieldValues) => Record<string, string | undefined> }> = {
    "beat-my-quote": {
        form: "beat-my-quote",
        values: (values) => ({
            ...contact(values),
            buyingStage: text(values, "Are you"),
            quoteFileName: text(values, "Upload your quote here"),
            details: text(values, "Tell us more about your quote and requirements"),
        }),
    },
    "keep-it-or-changecars": {
        form: "keep-it",
        values: (values) => ({ ...contact(values), story: text(values, "Tell us your story") }),
    },
    "new-vehicle-quote": {
        form: "new-vehicle-quote",
        values: (values) => ({ ...contact(values), message: text(values, "Message") }),
    },
    "value-my-vehicle": {
        form: "value-my-vehicle",
        values: (values) => ({
            ...contact(values),
            make: text(values, "Make"),
            model: text(values, "Model"),
            variant: text(values, "Variant"),
            expectedPrice: text(values, "Expected price"),
            vin: text(values, "VIN number"),
            mileage: text(values, "Mileage (km)"),
            year: text(values, "Year"),
            details: text(values, "Please provide us with details about your vehicle, including mileage and any other relevant information!"),
        }),
    },
};

type QuoteShellProps = {
    background: string
    cardClass: string
    // Value my vehicle and Keep it narrow the page gutter to 10px on tablets; the photo pages keep 20px.
    narrowGutter?: boolean
    children: ReactNode
}

// Fixed photo behind a 60% black layer, with the gold card centred on top — the live enquiry pages.
export default function QuoteShell({ background, cardClass, narrowGutter = false, children }: QuoteShellProps) {

    const [sent, setSent] = useState(false);
    const sending = useRef(false);
    const [formError, setFormError] = useState("");
    const [uploadNote, setUploadNote] = useState("");

    // Like the live pages: open scrolled to 80px below the header.
    useEffect(() => {
        const width = window.innerWidth;
        window.scrollTo(0, width >= 1201 ? 188 : width >= 1111 ? 218 : 140);
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (sending.current) return;
        const page = window.location.pathname.replace(/\/+$/, "").split("/").pop() ?? "";
        const toValues = quoteForms[page];
        if (!toValues) {
            setSent(true);
            return;
        }
        // Beat My Quote: the quote document is checked before sending and uploaded once the enquiry exists.
        const files = toValues.form === "beat-my-quote" ? pickedFiles(event.currentTarget) : [];
        const fileProblem = checkFiles(files, "document");
        if (fileProblem) {
            setFormError(fileProblem);
            return;
        }
        sending.current = true;
        setFormError("");
        const values = toValues.values(readFields(event.currentTarget));
        const result = await callAction(() => submitWebsiteForm(toValues.form, values));
        if (!result.ok) {
            sending.current = false;
            setFormError(firstMessage(result));
            return;
        }
        const upload = await uploadFiles("uploadToken" in result ? result.uploadToken : undefined, files, "document");
        sending.current = false;
        setUploadNote(uploadProblem(upload.failed, files.length, "document", upload.message));
        setSent(true);
    }

    return (
        <>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})` }}></div>
            <div aria-hidden="true" className="fixed inset-0 -z-10 bg-black/60"></div>
            <main className={`relative px-5 font-sans ${narrowGutter ? "max-[841px]:px-2.5" : ""}`}>
                <div className="flex flex-col items-center pt-12.5 pb-17.5 max-[1111px]:pt-25 max-[1111px]:pb-10 max-[981px]:pt-11">
                    <form data-form-card onSubmit={submit} className={`w-full overflow-hidden rounded-xl bg-gold ${cardClass}`}>
                        {sent ? (
                            <div className="flex min-h-100 flex-col items-center justify-center px-5 py-12.5 text-center">
                                <h2 className="m-0 text-[32px] font-bold text-white uppercase">Thank you</h2>
                                <p className="mx-auto my-6.25 max-w-85 text-xl font-extralight text-white">Your enquiry has been sent. Our team will be in touch with you shortly.</p>
                                {uploadNote && <p className="mx-auto mt-0 mb-0 max-w-110 text-sm leading-5 text-white">{uploadNote}</p>}
                            </div>
                        ) : children}
                    </form>
                    {!sent && <FormAlert tone="dark" message={formError} className="mt-4 w-full max-w-150" />}
                </div>
            </main>
        </>
    )
}
