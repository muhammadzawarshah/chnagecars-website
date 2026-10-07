"use client"

import { FormEvent, ReactNode, useRef, useState } from "react"
import { makes } from "../../Home/Data/makes"
import { submitWebsiteForm } from "../../../lib/backend/actions"
import { callAction, checkFiles, firstMessage, pickedFiles, uploadFiles, uploadProblem } from "../../../lib/backend/formFields"
import FormAlert from "../../../components/AppForm/FormAlert"
import { appYears } from "../../Home/Data/appSearch"
import { conditions, fuelTypes, photoTimings, sellTimes, serviceHistories, transmissions, yesNo } from "../Data/sellCar"
import SellField from "./SellField"
import SellInput from "./SellInput"
import SellChoices from "./SellChoices"
import SellFile from "./SellFile"

const emptyForm = {
    name: "", surname: "", email: "", phone: "", altPhone: "", suburb: "",
    make: "", modelGroup: "", modelSpecific: "", year: "", transmission: "", mileage: "", fuel: "", price: "",
    condition: "", service: "", owned: "", damages: "",
    registration: "", warranty: "", financed: "",
    sellTime: "", photoTiming: "Upload Now",
}

type FieldKey = keyof typeof emptyForm

const required: FieldKey[] = [
    "name", "surname", "email", "phone", "suburb",
    "make", "modelGroup", "modelSpecific", "year", "transmission", "mileage", "fuel", "price",
    "condition", "service", "owned", "registration", "warranty", "financed", "sellTime", "photoTiming",
];

function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className="mt-7 mb-2.5 text-[13.5px] leading-5 font-bold text-gold min-[981px]:mt-11 min-[981px]:mb-5 min-[981px]:text-[22px] min-[981px]:leading-7">{children}</h2>;
}

export default function SellCarForm() {

    const [form, setForm] = useState(emptyForm);
    const [images, setImages] = useState<string[]>([]);
    const [document, setDocument] = useState<string[]>([]);
    const [errors, setErrors] = useState<Partial<Record<FieldKey | "images", string>>>({});
    const [sent, setSent] = useState(false);
    const sending = useRef(false);
    const [formError, setFormError] = useState("");
    const [uploadNote, setUploadNote] = useState("");

    const make = makes.find((item) => item.name === form.make);

    function update(key: FieldKey, value: string) {
        setForm((current) => ({ ...current, [key]: value, ...(key === "make" ? { modelGroup: "" } : {}) }));
        setErrors((current) => ({ ...current, [key]: "" }));
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // The picked files themselves (the inputs keep them; the form state only holds their names).
        const photoFiles = form.photoTiming === "Upload Now" ? pickedFiles(event.currentTarget, { multiple: true }) : [];
        const documentFiles = pickedFiles(event.currentTarget, { multiple: false });
        const next: Partial<Record<FieldKey | "images", string>> = {};
        required.forEach((key) => { if (!form[key].trim()) next[key] = "This field is required"; });
        if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Please enter a valid email address";
        if (form.photoTiming === "Upload Now" && images.length === 0) next.images = "Please add images of your vehicle";
        const photoProblem = checkFiles(photoFiles, "photo");
        if (photoProblem) next.images = photoProblem;
        setErrors(next);
        const documentProblem = checkFiles(documentFiles, "document");
        setFormError(documentProblem ? "Registration document: " + documentProblem : "");
        if (Object.keys(next).length > 0 || documentProblem || sending.current) return;
        sending.current = true;
        const result = await callAction(() => submitWebsiteForm("sell-vehicle", { ...form, imageCount: photoFiles.length, documentName: document[0] }));
        if (!result.ok) {
            sending.current = false;
            const fieldErrors: Partial<Record<FieldKey | "images", string>> = {};
            for (const [key, message] of Object.entries(result.fields)) if (key in emptyForm) fieldErrors[key as FieldKey] = message;
            if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
            else setFormError(firstMessage(result));
            return;
        }
        const photoUpload = await uploadFiles(result.uploadToken, photoFiles, "photo");
        const documentUpload = await uploadFiles(result.uploadToken, documentFiles, "document");
        sending.current = false;
        setUploadNote([
            uploadProblem(photoUpload.failed, photoFiles.length, "photo", photoUpload.message),
            uploadProblem(documentUpload.failed, documentFiles.length, "document", documentUpload.message),
        ].filter(Boolean).join(" "));
        setSent(true);
    }

    const text = (key: FieldKey, placeholder = "", type = "text") => (
        <SellInput value={form[key]} placeholder={placeholder} type={type} error={!!errors[key]} onChange={(value) => update(key, value)} />
    );

    if (sent) {
        return (
            <>
                <div className="mt-7 rounded-[10px] border-[1.5px] border-[#e7e1d3] px-4 py-8 text-center min-[981px]:mt-11 min-[981px]:py-14">
                    <h2 className="mt-0 mb-2 text-lg font-bold text-gold min-[981px]:mb-3 min-[981px]:text-[28px]">Thank You!</h2>
                    <p className="m-0 text-[12.5px] leading-4.5 text-[#333] min-[981px]:text-base min-[981px]:leading-6.5"><strong>CHANGECARS</strong> will contact you shortly to arrange a free, no-obligation valuation.</p>
                    {uploadNote && <p className="mx-auto mt-3 mb-0 max-w-150 text-[12px] leading-4.5 text-[#666] min-[981px]:text-sm">{uploadNote}</p>}
                </div>
            </>
        )
    }

    return (
        <>
            <form onSubmit={submit} noValidate>
                <SectionTitle>Contact Details</SectionTitle>
                <div className="grid grid-cols-2 min-[981px]:gap-x-6 gap-x-2.25 gap-y-2.5 max-[361px]:grid-cols-1 min-[981px]:gap-y-5">
                    <SellField label="Name" required error={errors.name}>{text("name")}</SellField>
                    <SellField label="Surname" required error={errors.surname}>{text("surname")}</SellField>
                    <SellField label="Email" required error={errors.email}>{text("email", "", "email")}</SellField>
                    <SellField label="Phone Number" required error={errors.phone}>{text("phone", "", "tel")}</SellField>
                    <SellField label="Alternative Phone Number">{text("altPhone", "", "tel")}</SellField>
                    <SellField label="Suburb Or Vehicle Location" required error={errors.suburb}>{text("suburb", "Search suburb or location")}</SellField>
                </div>

                <SectionTitle>Vehicle Details</SectionTitle>
                <div className="grid grid-cols-2 min-[981px]:gap-x-6 gap-x-2.25 gap-y-2.5 max-[361px]:grid-cols-1 min-[981px]:gap-y-5">
                    <SellField label="Make" required error={errors.make}>
                        <SellInput value={form.make} placeholder="Select Make" options={makes.map((item) => item.name)} error={!!errors.make} onChange={(value) => update("make", value)} />
                    </SellField>
                    <SellField label="Model Group" required error={errors.modelGroup}>
                        <SellInput value={form.modelGroup} placeholder="Select Model Group" options={make?.models.map((item) => item.name) ?? []} disabled={!make} error={!!errors.modelGroup} onChange={(value) => update("modelGroup", value)} />
                    </SellField>
                    <SellField label="Model Specific" required error={errors.modelSpecific}>{text("modelSpecific", "e.g., GLi, VTi, S, Sport")}</SellField>
                    <SellField label="Year Of Registration" required error={errors.year}>
                        <SellInput value={form.year} placeholder="Select Year" options={appYears.map(String)} error={!!errors.year} onChange={(value) => update("year", value)} />
                    </SellField>
                    <SellField label="Transmission" required error={errors.transmission}>
                        <SellInput value={form.transmission} placeholder="Select Transmission" options={transmissions} error={!!errors.transmission} onChange={(value) => update("transmission", value)} />
                    </SellField>
                    <SellField label="Mileage" required error={errors.mileage}>{text("mileage", "", "number")}</SellField>
                    <SellField label="Fuel Type" required error={errors.fuel}>
                        <SellInput value={form.fuel} placeholder="Select Fuel Type" options={fuelTypes} error={!!errors.fuel} onChange={(value) => update("fuel", value)} />
                    </SellField>
                    <SellField label="Asking Price" required error={errors.price}>{text("price", "", "number")}</SellField>
                </div>

                <SectionTitle>Condition And History</SectionTitle>
                <div className="grid grid-cols-2 min-[981px]:gap-x-6 gap-x-2.25 gap-y-5 max-[481px]:grid-cols-1">
                    <SellField label="Condition" required error={errors.condition}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={conditions} value={form.condition} onChange={(value) => update("condition", value)} /></div>
                    </SellField>
                    <SellField label="Service History" required error={errors.service}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={serviceHistories} value={form.service} stacked onChange={(value) => update("service", value)} /></div>
                    </SellField>
                    <SellField label="How Long Has The User Owned The Car?" required error={errors.owned}>{text("owned")}</SellField>
                </div>
                <SellField label="Current Damages Or Previous Repairs" className="mt-2.5 min-[981px]:mt-5">
                    <textarea
                        value={form.damages}
                        maxLength={500}
                        onChange={(e) => update("damages", e.target.value)}
                        className="block h-22 w-full resize-none rounded-md border border-[#e0e0e0] bg-[#fafafa] p-3 text-[11.5px] min-[981px]:h-32 min-[981px]:p-4 min-[981px]:text-[15px] text-[#222] outline-none focus:border-gold"
                    />
                    <p className="mt-1 mb-0 text-right text-[11px] text-[#616161] min-[981px]:text-[13px]">{form.damages.length}/500</p>
                </SellField>

                <SectionTitle>Registration And Finance</SectionTitle>
                <div className="grid grid-cols-2 min-[981px]:gap-x-6 gap-x-2.25 gap-y-3 max-[481px]:grid-cols-1">
                    <SellField label="Does The User Know The Registration Number?" required error={errors.registration}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={yesNo} value={form.registration} onChange={(value) => update("registration", value)} /></div>
                    </SellField>
                    <SellField label="Is The Car Under Warranty?" required error={errors.warranty}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={yesNo} value={form.warranty} onChange={(value) => update("warranty", value)} /></div>
                    </SellField>
                    <SellField label="Is The Car Financed?" required error={errors.financed}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={yesNo} value={form.financed} onChange={(value) => update("financed", value)} /></div>
                    </SellField>
                </div>

                <SectionTitle>Selling Preferences</SectionTitle>
                <div className="grid grid-cols-2 min-[981px]:gap-x-6 gap-x-2.25 gap-y-3 max-[481px]:grid-cols-1">
                    <SellField label="When Does The User Want To Sell?" required error={errors.sellTime}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={sellTimes} value={form.sellTime} onChange={(value) => update("sellTime", value)} /></div>
                    </SellField>
                    <SellField label="Photo Upload Timing" required error={errors.photoTiming}>
                        <div className="pt-1.5 min-[981px]:pt-0"><SellChoices options={photoTimings} value={form.photoTiming} onChange={(value) => update("photoTiming", value)} /></div>
                    </SellField>
                </div>

                <SectionTitle>Documents And Photos</SectionTitle>
                <div className="flex flex-col gap-2.5 min-[981px]:gap-5">
                    <SellField label="Images" required={form.photoTiming === "Upload Now"} hint="Add front, left side, rear, right side, dashboard, interior, and engine photos." error={errors.images}>
                        <SellFile
                            placeholder="Add images"
                            multiple
                            accept="image/*"
                            files={images}
                            error={!!errors.images}
                            onChange={(files) => { setImages(files); setErrors((current) => ({ ...current, images: "" })); }}
                            icon={
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="#957e4e">
                                    <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
                                </svg>
                            }
                        />
                    </SellField>
                    <SellField label="Registration Document" hint="Max upload size: 5 MB">
                        <SellFile
                            placeholder="Choose file"
                            accept=".pdf,image/*"
                            files={document}
                            onChange={setDocument}
                            icon={
                                <svg width="13" height="16" viewBox="0 0 13 16" fill="none" stroke="#957e4e" strokeWidth="1.3">
                                    <path d="M8 1H2.5A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h8a1.5 1.5 0 0 0 1.5-1.5V5z" />
                                    <path d="M8 1v4h4M6.5 12V8M4.5 10l2-2 2 2" />
                                </svg>
                            }
                        />
                    </SellField>
                </div>

                <FormAlert message={formError} className="mt-6 min-[981px]:mt-10" />
                <button type="submit" className="mt-6 h-10 w-full cursor-pointer rounded-md border-0 bg-gold text-[13.5px] font-bold min-[981px]:mt-10 min-[981px]:h-13 min-[981px]:text-lg text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition hover:opacity-90">Submit</button>
            </form>
        </>
    )
}
