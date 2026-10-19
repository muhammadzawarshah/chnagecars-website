import type { Dealer } from './types'

export function dealerContact(dealer: Pick<Dealer, 'phone' | 'whatsappNumber'>, title: string) {
    const phone = dealer.phone?.trim();
    const raw = dealer.whatsappNumber?.trim() ?? '';
    const digits = raw.replace(/\D/g, '');
    const international = digits.startsWith('00') ? digits.slice(2) : digits;
    return {
        phone: phone && /^[+\d\s().-]+$/.test(phone) ? `tel:${phone.replace(/[^+\d]/g, '')}` : null,
        whatsapp: international.length >= 8 && international.length <= 15 && !international.startsWith('0')
            ? `https://wa.me/${international}?text=${encodeURIComponent(`Hi, I'm interested in the ${title}.`)}` : null,
    };
}
