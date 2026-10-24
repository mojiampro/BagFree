"use client";

import { useId, useState, type FormEvent } from "react";
import { Spinner } from "@/components/icons";
import { Modal } from "@/components/modal";
import { StarRatingInput } from "@/components/review/star-rating-input";
import { buttonClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_LABELS } from "@/lib/status";
import type { Booking } from "@/lib/types";

export type ReviewTarget = Pick<Booking, "id" | "tracking_code" | "service_type">;

const MAX_COMMENT = 500;

function ReviewForm({
  target,
  userId,
  onDone,
  onSkip,
}: {
  target: ReviewTarget;
  userId: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const labelId = useId();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const { error: insertError } = await createClient()
      .from("reviews")
      .insert({ booking_id: target.id, user_id: userId, rating, comment: comment.trim() || null });
    setSaving(false);
    if (insertError && insertError.code !== "23505") {
      setError(insertError.message);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl bg-highlight p-3 text-center text-sm">
        <span className="font-mono font-semibold text-navy">{target.tracking_code}</span>
        <span className="text-muted"> · {SERVICE_LABELS[target.service_type]}</span>
      </div>
      <div className="space-y-1 text-center">
        <p id={labelId} className="text-sm text-muted">
          ให้คะแนนบริการ (แตะครึ่งดาวได้)
        </p>
        <StarRatingInput value={rating} onChange={setRating} labelledBy={labelId} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="text-sm font-medium text-ink">
          ความคิดเห็น (ไม่บังคับ)
        </label>
        <textarea
          id="review-comment"
          rows={3}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm focus:border-navy focus:ring-2 focus:ring-navy/15 focus:outline-none"
          placeholder="เล่าประสบการณ์การใช้บริการของคุณ"
        />
        <p className="text-right text-xs text-muted">
          {comment.length}/{MAX_COMMENT}
        </p>
      </div>
      {error ? (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button type="button" onClick={onSkip} className={buttonClass("ghost", "md", "flex-1")} disabled={saving}>
          ไว้ทีหลัง
        </button>
        <button type="submit" className={buttonClass("primary", "md", "flex-1")} disabled={saving}>
          {saving ? <Spinner /> : null} ส่งรีวิว
        </button>
      </div>
    </form>
  );
}

export function ReviewModal({
  target,
  userId,
  onClose,
  onReviewed,
}: {
  target: ReviewTarget | null;
  userId: string;
  onClose: () => void;
  onReviewed: (bookingId: string) => void;
}) {
  return (
    <Modal open={target !== null} onClose={onClose} title="รีวิวการใช้บริการ" description="ความเห็นของคุณช่วยให้เราพัฒนาบริการได้ดีขึ้น">
      {target ? (
        <ReviewForm
          key={target.id}
          target={target}
          userId={userId}
          onSkip={onClose}
          onDone={() => onReviewed(target.id)}
        />
      ) : null}
    </Modal>
  );
}
