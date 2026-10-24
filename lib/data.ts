import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Branch, PublicReview } from "@/lib/types";

export type Result<T> = { data: T; error: null } | { data: null; error: string };

function failure(error: unknown): { data: null; error: string } {
  return { data: null, error: error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้" };
}

export async function getBranches(): Promise<Result<Branch[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("branches")
      .select("id, name, lat, lng, open_time, close_time, phone")
      .order("id");
    if (error) return failure(new Error(error.message));
    return { data: data as Branch[], error: null };
  } catch (error) {
    return failure(error);
  }
}

export async function getLatestReviews(limit = 6): Promise<Result<PublicReview[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("latest_reviews", { max_rows: limit });
    if (error) return failure(new Error(error.message));
    return {
      data: (data as PublicReview[]).map((review) => ({ ...review, rating: Number(review.rating) })),
      error: null,
    };
  } catch (error) {
    return failure(error);
  }
}
