import { publicGet } from '@/app/lib/backend/client'
export async function GET(request: Request) {
    try {
        const query = new URL(request.url).searchParams.toString();
        const result = await publicGet(`/vehicles/facets?${query}`, { fresh: true });
        return Response.json(result ?? {}, { status: result ? 200 : 404 });
    } catch {
        return Response.json({ message: 'Could not load filter options' }, { status: 502 });
    }
}
