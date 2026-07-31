import { createFileRoute } from "@tanstack/react-router";

import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { AIFeatures, Analytics, Features } from "@/components/landing/features";
import { FAQ, FinalCTA, Footer, Pricing, Testimonials } from "@/components/landing/sections";

const title = "Orbit — Manage Projects at the Speed of Thought";
const description =
  "Orbit is an AI-powered project management platform that helps teams organize work, collaborate effortlessly, and make smarter decisions with intelligent insights.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <AIFeatures />
        <Analytics />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
