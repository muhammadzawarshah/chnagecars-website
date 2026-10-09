import { parseCarSearch } from "@/app/lib/cars/search"
import { countCars } from "@/app/lib/cars/api"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
        params[key] = value
    })
    const search = parseCarSearch(params)
    const result = await countCars(search)
    return Response.json(result)
}

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const search = parseCarSearch(body as Record<string, string | string[] | undefined>)
        const result = await countCars(search)
        return Response.json(result)
    } catch {
        return Response.json({ total: 0, count: 0, formatted: "0" }, { status: 400 })
    }
}
