import { publicGet } from '@/app/lib/backend/client'
export async function GET(request: Request) {
    try {
        const result = await publicGet('/vehicles?' + new URL(request.url).searchParams.toString(), { fresh: true });
        return Response.json(result ?? {}, { status: result ? 200 : 404 });
    } catch {
        return Response.json({ message: 'Could not load cars' }, { status: 502 });
    }
}
