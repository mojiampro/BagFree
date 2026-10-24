import { StarDisplay } from "@/components/stars";
import { Reveal } from "@/components/reveal";
import { EmptyState, ErrorState, SectionHeading, Skeleton } from "@/components/ui";
import { getLatestReviews } from "@/lib/data";
import { SERVICE_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/time";

function ReviewSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="reviews" className="bg-page px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading eyebrow="รีวิวล่าสุด" title="เสียงจากผู้ใช้บริการ" />
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export async function LatestReviews() {
  const { data: reviews, error } = await getLatestReviews(6);

  return (
    <ReviewSection>
      {!reviews ? (
        <ErrorState title="โหลดรีวิวไม่สำเร็จ" message={error ?? ""} />
      ) : reviews.length === 0 ? (
        <EmptyState title="ยังไม่มีรีวิว" message="ใช้บริการเสร็จแล้วมาเป็นคนแรกที่รีวิวได้เลย" />
      ) : (
        <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal key={review.id} delay={(index % 3) * 80}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <StarDisplay rating={review.rating} />
                  <span className="text-sm font-semibold text-ink">{review.rating.toFixed(1)}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink">
                  {review.comment?.trim() ? `“${review.comment}”` : <span className="text-muted">ไม่มีความคิดเห็นเพิ่มเติม</span>}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span>
                    คุณ {review.reviewer} · {SERVICE_LABELS[review.service_type]}
                  </span>
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </ReviewSection>
  );
}

export function LatestReviewsSkeleton() {
  return (
    <ReviewSection>
      <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3" aria-label="กำลังโหลดรีวิว">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 bg-white" />
        ))}
      </div>
    </ReviewSection>
  );
}
