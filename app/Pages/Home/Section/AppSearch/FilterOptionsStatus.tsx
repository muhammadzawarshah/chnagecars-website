export default function FilterOptionsStatus({ loading, error, empty, onRetry }: { loading?: boolean; error?: boolean; empty: boolean; onRetry?: () => void }) {
    if (loading) return <p role="status" className="px-5 py-3 text-sm text-[#757575]">Loading filter options…</p>;
    if (error) return <p role="alert" className="px-5 py-3 text-sm text-red-700">Could not load filter options. {onRetry && <button type="button" onClick={onRetry} className="ml-2 underline">Retry</button>}</p>;
    if (empty) return <p role="status" className="px-5 py-3 text-sm text-[#757575]">No source values are available for these filters.</p>;
    return null;
}
