"use client"

import { useState } from "react"
import { makes } from "../../Home/Data/makes"
import { appYears } from "../../Home/Data/appSearch"
import { conditions, fuelTypes, gearTypes, photoTimings, sellTimes, serviceHistories, yesNoQuestions } from "../Data/sellForm"
import StepBox from "./StepBox"
import FormField from "./FormField"
import ChoiceGroup from "./ChoiceGroup"
import YesNo from "./YesNo"

const emptyForm = {
    make: "", year: "", model: "",
    fuel: "", gears: "", variant: "", mileage: "", condition: "", service: "", owned: "",
    registration: "", warranty: "", financed: "", settlementKnown: "", settlement: "", ownership: "",
    firstName: "", surname: "", suburb: "", cellphone: "", altNumber: "", email: "",
    price: "", sellTime: "", photos: "",
}

type SellFormValues = typeof emptyForm
type FieldKey = keyof SellFormValues

const stepFields: FieldKey[][] = [
    ["make", "year", "model"],
    ["fuel", "gears", "variant", "mileage", "condition", "service", "owned", "registration", "warranty", "financed", "ownership"],
    ["firstName", "surname", "suburb", "cellphone", "email", "sellTime", "photos"],
];

export default function SellForm() {

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<SellFormValues>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
    const [files, setFiles] = useState<string[]>([]);
    const [done, setDone] = useState(false);

    const make = makes.find((item) => item.name === form.make);
    const model = make?.models.find((item) => item.name === form.model);

    function update(key: FieldKey, value: string) {
        setForm((current) => {
            const next = { ...current, [key]: value };
            if (key === "make") { next.model = ""; next.variant = ""; }
            if (key === "model") next.variant = "";
            return next;
        });
        setErrors((current) => ({ ...current, [key]: "" }));
    }

    function validate(index: number) {
        const required = [...stepFields[index]];
        if (index === 1 && form.financed === "Yes") required.push("settlementKnown");
        if (index === 1 && form.financed === "Yes" && form.settlementKnown === "Yes") required.push("settlement");
        const next: Partial<Record<FieldKey, string>> = {};
        required.forEach((key) => { if (!form[key].trim()) next[key] = "This field is required"; });
        if (index === 2 && form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Please enter a valid email address";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function next(index: number) {
        if (!validate(index)) return;
        if (index === 2) setDone(true);
        else setStep(index + 1);
    }

    const button = "h-13 cursor-pointer rounded border-0 bg-gold px-6 text-[17px] text-white transition hover:opacity-90";

    if (done) {
        return (
            <>
                <div className="rounded-[10px] border border-[#212529] bg-white px-6 py-10 text-center">
                    <h3 className="mt-0 mb-4 font-poppins text-[28px] font-normal text-gold">Thank You!</h3>
                    <p className="mt-0 mb-3 text-base leading-6.5 text-[#212529]">We’re excited to help you get the best possible price for your car!</p>
                    <p className="mt-0 mb-3 text-base leading-6.5 text-[#212529]">One of our dedicated Sales Consultants will be in touch shortly to confirm your details and guide you through the process.</p>
                    <p className="m-0 text-base leading-6.5 text-[#212529]">Thank you for choosing us—we look forward to helping you make the most of your car’s value.</p>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-8">
                <StepBox number={1} title="Your car make & model" active={step === 0} summary={step > 0 ? `${form.year} ${form.make} ${form.model}` : undefined} onEdit={() => setStep(0)}>
                    <div className="flex flex-col gap-4">
                        <FormField placeholder="Search Car make (e.g Toyota)" value={form.make} error={errors.make} options={makes.map((item) => item.name)} onChange={(value) => update("make", value)} />
                        <FormField placeholder="Select Registration Year (e.g 2018)" value={form.year} error={errors.year} options={appYears.map(String)} onChange={(value) => update("year", value)} />
                        <div className="grid grid-cols-[1fr_171px] gap-3 max-[401px]:grid-cols-1">
                            <FormField placeholder="Select Model (Corolla)" value={form.model} error={errors.model} disabled={!make} options={make?.models.map((item) => item.name) ?? []} onChange={(value) => update("model", value)} />
                            <button type="button" onClick={() => next(0)} className={button}>GO</button>
                        </div>
                    </div>
                </StepBox>

                <StepBox number={2} title="Car Details" active={step === 1} summary={step > 1 ? `${form.fuel} · ${form.gears} · ${form.mileage} km` : undefined} onEdit={step > 1 ? () => setStep(1) : undefined}>
                    <ChoiceGroup label="Fuel type" options={fuelTypes} value={form.fuel} error={errors.fuel} onChange={(value) => update("fuel", value)} />
                    <ChoiceGroup label="How do you change gears?" options={gearTypes} value={form.gears} error={errors.gears} onChange={(value) => update("gears", value)} />
                    <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">Model Variant*</h6>
                    <FormField placeholder="Select Variant" value={form.variant} error={errors.variant} options={model && model.variants.length ? model.variants : undefined} onChange={(value) => update("variant", value)} />
                    <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">Mileage*</h6>
                    <FormField placeholder="Mileage (km)" type="number" value={form.mileage} error={errors.mileage} onChange={(value) => update("mileage", value)} />
                    <ChoiceGroup label="Condition" options={conditions} value={form.condition} error={errors.condition} onChange={(value) => update("condition", value)} />
                    <ChoiceGroup label="Service history" options={serviceHistories} value={form.service} error={errors.service} stacked onChange={(value) => update("service", value)} />
                    <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">How long have you owned your car?*</h6>
                    <FormField placeholder="e.g. 3 years" value={form.owned} error={errors.owned} onChange={(value) => update("owned", value)} />
                    {yesNoQuestions.map((question) => (
                        <YesNo key={question.key} label={question.label} value={form[question.key]} error={errors[question.key]} onChange={(value) => update(question.key, value)} />
                    ))}
                    {form.financed === "Yes" && (
                        <YesNo label="Do you know your settlement amount?" value={form.settlementKnown} error={errors.settlementKnown} onChange={(value) => update("settlementKnown", value)} />
                    )}
                    {form.financed === "Yes" && form.settlementKnown === "Yes" && (
                        <>
                            <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">Settlement Amount*</h6>
                            <FormField placeholder="R" type="number" value={form.settlement} error={errors.settlement} onChange={(value) => update("settlement", value)} />
                        </>
                    )}
                    <YesNo label="Are you in possession of the vehicle ownership documentation?" value={form.ownership} error={errors.ownership} onChange={(value) => update("ownership", value)} />
                    <button type="button" onClick={() => next(1)} className={`${button} mt-6 w-full`}>Continue</button>
                </StepBox>

                <StepBox number={3} title="About You" active={step === 2}>
                    <h6 className="mt-0 mb-2 text-base font-bold text-[#212529]">About You*</h6>
                    <div className="grid grid-cols-2 gap-3 max-[401px]:grid-cols-1">
                        <FormField placeholder="First Name" value={form.firstName} error={errors.firstName} onChange={(value) => update("firstName", value)} />
                        <FormField placeholder="Surname" value={form.surname} error={errors.surname} onChange={(value) => update("surname", value)} />
                    </div>
                    <div className="mt-3">
                        <FormField placeholder="Suburb" value={form.suburb} error={errors.suburb} onChange={(value) => update("suburb", value)} />
                    </div>
                    <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">Contact Details*</h6>
                    <div className="grid grid-cols-2 gap-3 max-[401px]:grid-cols-1">
                        <FormField placeholder="Cellphone Number" type="tel" value={form.cellphone} error={errors.cellphone} onChange={(value) => update("cellphone", value.replace(/[^\d+ ]/g, ""))} />
                        <FormField placeholder="Alternative Number" type="tel" value={form.altNumber} onChange={(value) => update("altNumber", value.replace(/[^\d+ ]/g, ""))} />
                    </div>
                    <div className="mt-3">
                        <FormField placeholder="Email Address" type="email" value={form.email} error={errors.email} onChange={(value) => update("email", value)} />
                    </div>
                    <h6 className="mt-4 mb-2 text-base font-bold text-[#212529]">Price expectation</h6>
                    <FormField placeholder="R" type="number" value={form.price} onChange={(value) => update("price", value)} />
                    <ChoiceGroup label="When do you want to sell?" options={sellTimes} value={form.sellTime} error={errors.sellTime} onChange={(value) => update("sellTime", value)} />
                    <ChoiceGroup label="Please upload photos of your vehicle, this will help us to sell your car quicker." options={photoTimings} value={form.photos} error={errors.photos} onChange={(value) => update("photos", value)} />
                    {form.photos === "Upload Now" && (
                        <div className="mt-3 rounded border border-dashed border-[#bbb] p-4 text-center text-sm text-[#555]">
                            <p className="mt-0 mb-1">We need photos from the front, left, rear and right, as well as the dashboard (switched on), vehicle interior and engine</p>
                            <em className="block text-xs">(max image size 10 MB)</em>
                            <label className="mt-3 inline-block cursor-pointer rounded bg-[#343a40] px-4 py-2 text-white">
                                Select a file
                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles([...(e.target.files ?? [])].map((file) => file.name))} />
                            </label>
                            {files.length > 0 && <p className="mt-2 mb-0 text-xs">{files.join(", ")}</p>}
                        </div>
                    )}
                    <p className="mt-4 mb-0 text-sm text-[#555]">Your privacy is important to us. Please refer to our <a href="https://www.changecars.co.za/privacy_policy" className="text-gold underline">privacy policy</a> which communicates how we process your personal information.</p>
                    <button type="button" onClick={() => next(2)} className={`${button} mt-5 w-full`}>Submit My Enquiry</button>
                    <p className="mt-4 mb-0 text-sm text-[#555]">By clicking “Submit My Enquiry”, I agree to the <a href="https://www.changecars.co.za/terms-of-use" className="text-gold underline">terms of use</a>.</p>
                </StepBox>
            </div>
        </>
    )
}
