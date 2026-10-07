"use server"

import { revalidatePath } from "next/cache"
import { BackendError } from "../backend/client"
import { updateDealerStatus } from "./api"
import { DealerStatus } from "./types"

const statuses: DealerStatus[] = ["active", "pending", "suspended"];

// Server Actions are public POST endpoints: validate input here. With the API connected,
// the API checks the signed-in user may manage dealers before changing anything.
export async function setDealerStatus(dealerId: string, status: DealerStatus) {
    if (!statuses.includes(status) || !/^[\w-]+$/.test(dealerId)) throw new Error("Invalid dealer update");
    try {
        await updateDealerStatus(dealerId, status);
    } catch (error) {
        // A refused change (e.g. another admin changed the dealer first) just reloads the table with the real status.
        if (!(error instanceof BackendError) || error.status >= 500) throw error;
    }
    revalidatePath("/dashboard", "layout");
}
