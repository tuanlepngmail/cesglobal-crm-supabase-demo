"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import type { InteractionType } from "@/lib/types/database";

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const me = await getCurrentUser();

  const leadId = String(formData.get("leadId") ?? "");
  const type = String(formData.get("type") ?? "call") as InteractionType;
  const title = String(formData.get("title") ?? "");
  const occurredAt = String(formData.get("occurredAt") ?? "");

  if (!leadId || !title || !occurredAt) {
    return { error: "Thiếu thông tin bắt buộc." };
  }

  const { error } = await supabase.from("interactions").insert({
    lead_id: leadId,
    user_id: me.id,
    type,
    title,
    occurred_at: occurredAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/calendar", "page");
  return { success: true };
}

export async function moveCalendarEvent(
  interactionId: string,
  newDate: string,
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("interactions")
    .update({ occurred_at: newDate })
    .eq("id", interactionId);

  if (error) return { error: error.message };

  revalidatePath("/calendar", "page");
  return { success: true };
}
