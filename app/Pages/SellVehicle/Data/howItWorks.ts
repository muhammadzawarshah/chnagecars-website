export type SellStep = {
    icon: string
    title: string
    before?: string
    after: string
}

export const sellSteps: SellStep[] = [
    { icon: "/img/sell/car.svg", title: "List your car in just 2 minutes", before: "Enter a few details about you and your vehicle.", after: "will contact you to arrange a free, no-obligation valuation" },
    { icon: "/img/sell/money.svg", title: "Get paid fast", before: "If", after: "buys your car immediately, payment is usually made before we leave your premises — with no hidden fees" },
    { icon: "/img/sell/handshake.svg", title: "Receive competitive offers", before: "If", after: "doesn’t buy your car straight away, your vehicle is placed on our dealer bidding platform, where verified dealers can submit their offers" },
];

export const sellNotice: SellStep = {
    icon: "/img/sell/info.svg",
    title: "Important to know",
    after: "All offers are subject to a vehicle inspection, and you’re free to accept or decline any offer at any time",
};
