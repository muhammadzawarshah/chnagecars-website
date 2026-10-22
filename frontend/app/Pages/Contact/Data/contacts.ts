export type ContactPerson = {
    heading?: string
    role: string
    name?: string
    email: string
    phone: string
}

// Contact list as shown on the app's "Get in touch" screen.
export const contacts: ContactPerson[] = [
    { heading: "Contact Customer Support", role: "Operations", name: "Melanie Fourie", email: "melanie@changecars.co.za", phone: "082 892 9630" },
    { role: "Managing Director", name: "Michael Pashut", email: "michael@changecars.co.za", phone: "083 377 5432" },
    { heading: "General Enquiry", role: "National", email: "info@changecars.co.za", phone: "0861 248 248" },
];
