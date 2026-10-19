"use client"


export default function DealerRating({ dealer, rating }: { dealer: string, rating?: number | null }) {

    if (rating == null || !Number.isFinite(rating) || rating < 0 || rating > 5) return null;
    return <span aria-label={`${dealer} rating ${rating} out of 5`} className="text-sm font-semibold text-gold">{rating.toFixed(1)} ★</span>;
}
