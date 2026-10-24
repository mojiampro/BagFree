import { Suspense } from "react";
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
