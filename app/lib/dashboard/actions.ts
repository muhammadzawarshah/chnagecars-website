"use server"

import { revalidatePath } from "next/cache"
import { updateDealerStatus } from "./api"
import { DealerStatus } from "./types"

const statuses: DealerStatus[] = ["active", "pending", "suspended"];

// Server Actions are public POST endpoints: validate input here, and once login exists,
// check the caller has "dealers.manage" before changing anything.
export async function setDealerStatus(dealerId: string, status: DealerStatus) {
    if (!statuses.includes(status) || !/^[\w-]+$/.test(dealerId)) throw new Error("Invalid dealer update");
    await updateDealerStatus(dealerId, status);
    revalidatePath("/dashboard", "layout");
}
