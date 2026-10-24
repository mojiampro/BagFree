import { Suspense } from "react";
import { AdBanner } from "@/components/ads/ad-banner";
import { BranchDirectory, BranchDirectorySkeleton } from "@/components/landing/branch-directory";
import { Hero } from "@/components/landing/hero";
import { LatestReviews, LatestReviewsSkeleton } from "@/components/landing/latest-reviews";
import { Pricing } from "@/components/landing/pricing";
import { Services } from "@/components/landing/services";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Suspense fallback={null}>
        <AdBanner />
      </Suspense>
      <Pricing />
      <Suspense fallback={<BranchDirectorySkeleton />}>
        <BranchDirectory />
      </Suspense>
      <Suspense fallback={<LatestReviewsSkeleton />}>
        <LatestReviews />
      </Suspense>
    </>
  );
}
