import type { ReactElement } from "react";
import { ChecksSection } from "@/site/checks/checks-section";
import { CommandSection } from "@/site/command/command-section";
import { DeviceSizesSection } from "@/site/device-sizes/device-sizes-section";
import { EstimatesSection } from "@/site/estimates/estimates-section";
import { HeroSection } from "@/site/hero/hero-section";
import { ToolStrip } from "@/site/hero/tool-strip";
import { ProofSection } from "@/site/proof/proof-section";
import { WorkflowsSection } from "@/site/workflows/workflows-section";
import { ClosingSection } from "./closing-section";
import { CloudSection } from "./cloud-section";
import { FaqSection } from "./faq-section";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StepsSection } from "./steps-section";

export const LandingPage = (): ReactElement => (
  <div className="min-h-screen overflow-x-clip bg-paper text-ink">
    <SiteHeader />
    <main id="top">
      <HeroSection />
      <ToolStrip />
      <CommandSection />
      <ChecksSection />
      <ProofSection />
      <WorkflowsSection />
      <DeviceSizesSection />
      <EstimatesSection />
      <StepsSection />
      <CloudSection />
      <FaqSection />
      <ClosingSection />
    </main>
    <SiteFooter />
  </div>
);
