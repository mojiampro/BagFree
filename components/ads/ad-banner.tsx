import { PromoSlider } from "@/components/ads/promo-slider";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";
import { getBranches } from "@/lib/data";

/** Home page banner. Slides still render if branches fail to load; the CTA then skips preselecting a branch. */
export async function AdBanner() {
  const { data: branches } = await getBranches();
  const branchIds = Object.fromEntries((branches ?? []).map((branch) => [branch.name, branch.id]));

  return (
    <section id="explore" className="bg-alt px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="เที่ยวไหนดี"
            title="ที่เที่ยวใกล้สาขา Bag Free"
            description="ฝากกระเป๋าไว้ที่สถานี แล้วไปเที่ยวตัวเปล่า"
          />
        </Reveal>
        <Reveal>
          <PromoSlider branchIds={branchIds} interval={5000} />
        </Reveal>
      </div>
    </section>
  );
}
