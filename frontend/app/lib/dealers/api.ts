import { backendEnabled, publicGet, queryString, softly } from "../backend/client"

// The public dealer directory and car brands, read from the API (dealers, catalogue).

export type DirectoryDealer = { id: string, name: string, slug: string, description: string | null, logoUrl: string | null, phone: string | null, email: string | null, province: string, city: string, address: string | null, whatsappNumber?: string | null }
export type DealerDirectory = { dealers: DirectoryDealer[], page: number, pageCount: number, total: number }
export type CarMake = { id: string, name: string, slug: string, logoUrl: string | null }

export const DIRECTORY_PAGE_SIZE = 24

export async function getDealerDirectory(search: { q?: string, province?: string, page?: number }): Promise<DealerDirectory> {
    const empty: DealerDirectory = { dealers: [], page: 1, pageCount: 1, total: 0 }
    if (!backendEnabled()) return empty
    return softly("dealer directory", async () => {
        const result = await publicGet<{ data: DirectoryDealer[], meta: { page: number, pageCount: number, total: number } }>(`/dealers${queryString({ q: search.q, province: search.province, page: search.page, pageSize: DIRECTORY_PAGE_SIZE })}`, { revalidate: 300 })
        return result ? { dealers: result.data, page: result.meta.page, pageCount: result.meta.pageCount, total: result.meta.total } : empty
    }, empty)
}

export async function getMakes(): Promise<CarMake[]> {
    if (!backendEnabled()) return []
    return softly("car brands", async () => (await publicGet<CarMake[]>("/catalogue/makes", { revalidate: 3600 })) ?? [], [])
}
