"use client"

// Cars picked for comparison, kept in the browser so the list follows the visitor between pages.

export type CompareCar = {
    id: string
    title: string
    price: number
    image: string
    href: string
}

const KEY = "changecars-compare";
const EVENT = "compare-change";

export function readCompare(): CompareCar[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
        return [];
    }
}

function write(cars: CompareCar[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(cars));
    } catch {}
    window.dispatchEvent(new Event(EVENT));
}

export function addCompare(car: CompareCar) {
    const cars = readCompare();
    if (!cars.some((item) => item.id === car.id)) write([...cars, car]);
    else window.dispatchEvent(new Event(EVENT));
}

export function removeCompare(id: string) {
    write(readCompare().filter((item) => item.id !== id));
}

export function clearCompare() {
    write([]);
}

export function onCompareChange(listener: () => void) {
    window.addEventListener(EVENT, listener);
    window.addEventListener("storage", listener);
    return () => {
        window.removeEventListener(EVENT, listener);
        window.removeEventListener("storage", listener);
    };
}
