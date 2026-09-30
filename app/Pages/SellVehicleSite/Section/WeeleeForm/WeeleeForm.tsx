"use client"

import { ReactNode, useState } from "react"
import StepHeader from "./StepHeader"
import DxSelect from "./DxSelect"
import DxText from "./DxText"
import DxButton from "./DxButton"
import ChoiceGroup from "./ChoiceGroup"
import YesNo from "./YesNo"
import PhotoUpload from "./PhotoUpload"
import { MissingGlyph } from "./Icons"
import { conditions, fuelTypes, gearTypes, makes, mileages, modelsFor, ownedFor, photoTimings, sellTimes, serviceHistories, variantsFor, years } from "../../Data/sellForm"

const emptyCar = { fuel: "", gears: "", variant: "", mileage: "", condition: "", damage: "", service: "", owned: "", registration: "", regNumber: "", warranty: "", financed: "", settlementKnown: "", settlement: "", owner: "" };
const emptyAbout = { firstname: "", surname: "", suburb: "", cellphone: "", altnumber: "", email: "", price: "", sellTime: "", photos: "" };

const container = "rounded-[10px] border border-[#212529] bg-white @min-[768px]:border-0 @min-[768px]:bg-transparent";
const panel = "@min-[768px]:rounded-[6px] @min-[768px]:border @min-[768px]:border-[#212529] @min-[768px]:bg-white";
const panelActive = "rounded-[10px] bg-white @min-[768px]:rounded-[6px] @min-[768px]:border @min-[768px]:border-[#212529]";
const stepLine = "absolute top-[46px] left-10 z-1 h-20 border-l-[5px] border-gold @min-[768px]:top-[60px] @min-[768px]:left-[55px] @min-[768px]:h-28";

function Heading({ className, children }: { className: string, children: ReactNode }) {
    return <h6 className={`mt-0 mb-2 text-base leading-[1.2] font-semibold text-[#212529] ${className}`}>{children}</h6>
}

// Step 2 wraps its rows in a padded tab-pane on the live form; step 3 centres a full-width row whose margins overflow.
function StepContent({ pane = false, children }: { pane?: boolean, children: ReactNode }) {
    const rows = (
        <div className={`flex flex-wrap p-4 @min-[768px]:m-6 @min-[768px]:p-6 ${pane ? "" : "w-full shrink-0"}`}>
            <div className="w-full shrink-0 @min-[768px]:px-12">{children}</div>
        </div>
    );
    return (
        <div className={`flex rounded-[10px] border-3 border-gold bg-white @min-[768px]:mt-6 ${pane ? "" : "justify-center"}`}>
            {pane ? <div className="w-full shrink-0 px-3">{rows}</div> : rows}
        </div>
    )
}

// The WeeLee "sell my car" form the live page embeds, rebuilt because WeeLee only allows its own domains to frame it.
export default function WeeleeForm() {

    const [step, setStep] = useState(1);
    const [make, setMake] = useState("");
    const [year, setYear] = useState("");
    const [model, setModel] = useState("");
    const [goTried, setGoTried] = useState(false);
    const [car, setCar] = useState(emptyCar);
    const [cleared, setCleared] = useState<string[]>([]);
    const [about, setAbout] = useState(emptyAbout);
    const [submitTried, setSubmitTried] = useState(false);
    const [sent, setSent] = useState(false);

    const stateOf = (number: number) => (step === number ? "active" : step > number ? "done" : "idle");
    const setCarField = (field: keyof typeof emptyCar) => (value: string) => setCar((current) => ({ ...current, [field]: value }));
    const setAboutField = (field: keyof typeof emptyAbout) => (value: string) => setAbout((current) => ({ ...current, [field]: value }));
    const red = (group: string) => !cleared.includes(group);

    function go() {
        if (make && year && model) setStep(2);
        else setGoTried(true);
    }

    function carGroups() {
        const groups = ["fuel", "gears", "condition", "service", "registration", "warranty", "financed"];
        if (car.financed === "Yes") groups.push("settlementKnown");
        if (car.financed === "No") groups.push("owner");
        return groups;
    }

    function carContinue() {
        const answered = carGroups().filter((group) => car[group as keyof typeof emptyCar]);
        setCleared(answered);
        const fieldsDone = car.variant && car.mileage && car.owned && (car.registration !== "Yes" || car.regNumber) && (car.settlementKnown !== "Yes" || car.financed !== "Yes" || car.settlement);
        if (answered.length === carGroups().length && fieldsDone) setStep(3);
    }

    const aboutInvalid = {
        firstname: !about.firstname.trim(),
        surname: !about.surname.trim(),
        suburb: !about.suburb.trim(),
        cellphone: !/^\d{10}$/.test(about.cellphone),
        email: !/^\S+@\S+\.\S+$/.test(about.email),
        sellTime: !about.sellTime,
    };

    function submit() {
        setSubmitTried(true);
        if (!Object.values(aboutInvalid).some(Boolean)) setSent(true);
    }

    const shown = (invalid: boolean) => submitTried && invalid;

    return (
        <>
            <div className="relative h-full w-full overflow-hidden rounded-[15px] bg-white [container-type:size] max-[901px]:h-169 max-[818px]:h-134">
                <div data-weelee-scroll className="h-full overflow-y-auto font-poppins text-base leading-[1.5] text-[#212529]">
                    <div className="flow-root p-4">

                        <div className="relative mb-4 pb-4">
                            <div className={container}>
                                {step > 1 && <div className={stepLine}></div>}
                                <div className={panel}>
                                    <StepHeader number={1} title={step > 1 ? `${year} ${model}` : "Your car make & model"} state={stateOf(1)} wide first textClass="mt-1 pt-1 @min-[768px]:mt-0" onEdit={() => setStep(1)} />
                                    {step === 1 && (
                                        <div className="-mx-3 flex flex-wrap justify-center">
                                            <div className="w-full shrink-0 px-6 @min-[768px]:px-12">
                                                <div className="-mx-3 flex flex-wrap">
                                                    <div className="w-full shrink-0 px-3 pt-2 @min-[768px]:pb-4">
                                                        <div className="mb-2.5">
                                                            <DxSelect placeholder="Search Car make (e.g Toyota)" options={makes} value={make} onChange={(value) => { setMake(value); setYear(""); setModel(""); }} searchable validStyle invalid={!make} message="Make is required" />
                                                        </div>
                                                    </div>
                                                    <div className="w-full shrink-0 px-3 pt-2 @min-[768px]:pb-4">
                                                        <div className="mb-2.5">
                                                            <DxSelect key={`years-${make}`} placeholder="Select Registration Year (e.g 2018)" options={years} value={year} onChange={(value) => { setYear(value); setModel(""); }} disabled={!make} validStyle invalid={goTried && !!make && !year} message="Registration Year is required" />
                                                        </div>
                                                    </div>
                                                    <div className="w-2/3 shrink-0 px-3 pt-2 @min-[768px]:pb-4">
                                                        <div className="mb-2.5">
                                                            <DxSelect key={`models-${make}-${year}`} placeholder="Select Model (Corolla)" options={make ? modelsFor(make) : []} value={model} onChange={setModel} disabled={!year} validStyle invalid={goTried && !!year && !model} message="Model is required" />
                                                        </div>
                                                    </div>
                                                    <div className="w-1/3 shrink-0 pt-2 pr-3 @min-[768px]:pb-4">
                                                        <DxButton onClick={go} className="float-right w-full pr-[22px]">GO</DxButton>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="relative mb-4 pb-4">
                            <div className={container}>
                                {step > 2 && <div className={stepLine}></div>}
                                <div className={step === 2 ? panelActive : panel}>
                                    <StepHeader number={2} title="Car Details" state={stateOf(2)} textClass="pt-1" onEdit={() => setStep(2)} />
                                </div>
                                {step === 2 && (
                                    <StepContent pane>
                                        <div className="mb-2.5">
                                            <Heading className="pt-1 pb-1">Fuel type*</Heading>
                                            <ChoiceGroup layout="fuel" options={fuelTypes} value={car.fuel} onChange={setCarField("fuel")} invalid={red("fuel")} />
                                        </div>
                                        <div className="mb-2.5">
                                            <Heading className="pt-6 pb-1">How do you change gears?*</Heading>
                                            <ChoiceGroup options={gearTypes.map((label) => ({ label, disabled: !car.fuel }))} value={car.gears} onChange={setCarField("gears")} invalid={red("gears")} />
                                        </div>
                                        <div className="mb-2.5">
                                            <Heading className="pt-6 pb-1">Model Variant*</Heading>
                                            <DxSelect placeholder="Select Variant (e.g Corolla Quest)" options={variantsFor(make, model)} value={car.variant} onChange={setCarField("variant")} disabled={!car.gears} validStyle invalid={!!car.gears && !car.variant} message="Model Variant is required" />
                                        </div>
                                        <div className="mb-2.5">
                                            <Heading className="pt-6 pb-1">Mileage*</Heading>
                                            <DxSelect placeholder="e.g. 50 000 km" options={mileages} value={car.mileage} onChange={setCarField("mileage")} autoFocus validStyle invalid={!car.mileage} message="Mileage is required" />
                                        </div>
                                        <Heading className="pt-6 pb-1">Condition*</Heading>
                                        <div className="mb-2.5">
                                            <ChoiceGroup layout="condition" options={conditions} value={car.condition} onChange={setCarField("condition")} invalid={red("condition")} />
                                            <div className="mb-2.5">
                                                <DxText textarea placeholder="Any current damages/previous repairs to disclose" value={car.damage} onChange={setCarField("damage")} />
                                            </div>
                                            <div className="mb-2.5">
                                                <Heading className="pt-2 pb-2">Service history*</Heading>
                                                <ChoiceGroup layout="service" options={serviceHistories(make).map((label) => ({ label }))} value={car.service} onChange={setCarField("service")} invalid={red("service")} />
                                            </div>
                                            <div className="mb-2.5">
                                                <Heading className="pt-2 pb-2">How long have you owned your car?*</Heading>
                                                <DxSelect placeholder="How long have you owned your car" options={ownedFor} value={car.owned} onChange={setCarField("owned")} invalid={!car.owned} message="How long have you owned your car is required" />
                                            </div>
                                            <div className="mb-2.5">
                                                <Heading className="pt-2 pb-2">Do you Know your Registration Number?*</Heading>
                                                <YesNo value={car.registration} onChange={setCarField("registration")} invalid={red("registration")} />
                                            </div>
                                            <div className="mb-2.5">
                                                {car.registration === "Yes" && (
                                                    <DxText placeholder="Registration Number* (e.g. WEELEEGP)" value={car.regNumber} onChange={setCarField("regNumber")} invalid={!car.regNumber} message="Registration Number is required" />
                                                )}
                                            </div>
                                            <div className="mb-2.5">
                                                <Heading className="pt-2 pb-2">Is your car under warranty?*</Heading>
                                                <YesNo value={car.warranty} onChange={setCarField("warranty")} invalid={red("warranty")} />
                                            </div>
                                            <div className="mb-2.5">
                                                <Heading className="pt-2 pb-2">Is your car financed?*</Heading>
                                                <YesNo value={car.financed} onChange={setCarField("financed")} invalid={red("financed")} />
                                            </div>
                                            {car.financed === "Yes" && (
                                                <>
                                                    <div className="mb-2.5">
                                                        <Heading className="pt-2 pb-2">Do you know your settlement amount?*</Heading>
                                                        <YesNo value={car.settlementKnown} onChange={setCarField("settlementKnown")} invalid={red("settlementKnown")} />
                                                    </div>
                                                    {car.settlementKnown === "Yes" && (
                                                        <div className="mb-2.5">
                                                            <Heading className="pt-2">Settlement Amount*</Heading>
                                                            <DxText inputMode="decimal" placeholder="Outstanding amount owed on your car" value={car.settlement} onChange={(value) => setCarField("settlement")(value.replace(/[^\d]/g, ""))} invalid={!car.settlement} message="Settlement Amount is required" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {car.financed === "No" && (
                                                <div className="mb-2.5">
                                                    <Heading className="pt-2 pb-2">Are you in possession of the vehicle ownership documentation?*</Heading>
                                                    <YesNo value={car.owner} onChange={setCarField("owner")} invalid={red("owner")} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="float-right mt-4 flex">
                                            <DxButton onClick={carContinue} className="pr-[22px]">Continue</DxButton>
                                        </div>
                                    </StepContent>
                                )}
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <div className={container}>
                                <div className={step === 3 ? panelActive : panel}>
                                    <StepHeader number={3} title="About You" state={stateOf(3)} textClass="pt-2 @min-[768px]:pt-1" />
                                </div>
                                {step === 3 && (
                                    <StepContent>
                                        {sent ? (
                                            <div className="py-6 text-center">
                                                <Heading className="text-xl text-gold">Thank you!</Heading>
                                                <p className="m-0">Your enquiry has been submitted. We will be in touch with you shortly.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="-mx-3 flex flex-wrap">
                                                    <Heading className="w-full shrink-0 px-3 pt-1 pb-1">About You*</Heading>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText placeholder="First Name* (e.g. John)" value={about.firstname} onChange={setAboutField("firstname")} validStyle invalid={shown(aboutInvalid.firstname)} message="First Name is required" /></div>
                                                    </div>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText placeholder="Surname* (e.g. Smith)" value={about.surname} onChange={setAboutField("surname")} validStyle invalid={shown(aboutInvalid.surname)} message="Surname is required" /></div>
                                                    </div>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText placeholder="In which suburb is your car located?" value={about.suburb} onChange={setAboutField("suburb")} location validStyle invalid={shown(aboutInvalid.suburb)} message="Suburb is required" /></div>
                                                    </div>
                                                </div>
                                                <div className="-mx-3 flex flex-wrap">
                                                    <Heading className="w-full shrink-0 px-3 pt-6 pb-2">Contact Details*</Heading>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText type="tel" maxLength={10} placeholder="Cell Phone number* (e.g. 0861 933 533)" value={about.cellphone} onChange={setAboutField("cellphone")} validStyle invalid={shown(aboutInvalid.cellphone)} message="Cell Phone number is required" /></div>
                                                    </div>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText type="tel" maxLength={10} placeholder="Alternative number (e.g. 0861 933 533)" value={about.altnumber} onChange={setAboutField("altnumber")} /></div>
                                                    </div>
                                                    <div className="w-full shrink-0 px-3 @min-[768px]:w-1/2">
                                                        <div className="mb-2.5"><DxText type="email" placeholder="Email* (e.g. JohnSmith@gmail.com)" value={about.email} onChange={setAboutField("email")} validStyle invalid={shown(aboutInvalid.email)} message="Email is required" /></div>
                                                    </div>
                                                </div>
                                                <div className="mb-2.5">
                                                    <Heading className="pt-6 pb-1">Price expectation</Heading>
                                                    <DxText inputMode="decimal" placeholder="Expected price for your car." value={about.price} onChange={(value) => setAboutField("price")(value.replace(/[^\d]/g, ""))} />
                                                </div>
                                                <Heading className="pt-6 pb-1">When do you want to sell?*</Heading>
                                                <div className="mb-2.5">
                                                    <ChoiceGroup layout="sell" options={sellTimes.map((label) => ({ label }))} value={about.sellTime} onChange={setAboutField("sellTime")} invalid={shown(aboutInvalid.sellTime)} />
                                                </div>
                                                <Heading className="pt-6 pb-1">Please upload photos of your vehicle, this will help us to sell your car quicker.</Heading>
                                                <div className="mb-2.5">
                                                    <ChoiceGroup options={photoTimings.map((label) => ({ label }))} value={about.photos} onChange={setAboutField("photos")} />
                                                </div>
                                                {about.photos === "Upload Now" && <PhotoUpload />}
                                                <div className="flex text-xs leading-[1.5] text-black">
                                                    <MissingGlyph className="my-3 me-2 h-3 w-[9px] shrink-0" />
                                                    <span>Your privacy is important to us. Please refer our <a href="https://dhzc82x38ceu.cloudfront.net/Documents/Weelee+Privacy+Policy.pdf" target="_blank" className="text-[#0d6efd] underline hover:text-[#0a58ca]">privacy policy</a> which communicates how we process your personal information.</span>
                                                </div>
                                                <div className="mt-4 flex justify-center">
                                                    <DxButton onClick={submit} className="w-full pr-[18px] font-bold">Submit My Enquiry</DxButton>
                                                </div>
                                                <p className="mt-0 mb-4 pt-6 text-center text-black">
                                                    By clicking “Submit My Enquiry”, I agree to the <a href="https://dhzc82x38ceu.cloudfront.net/Documents/Weelee+Terms+and+Conditions+Selling+a+Car+and+General.pdf" target="_blank" className="text-[#0d6efd] underline hover:text-[#0a58ca]">terms of use</a>.
                                                </p>
                                            </>
                                        )}
                                    </StepContent>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}
