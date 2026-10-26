import { Hero } from "@/components/hero";
import { ReportFinder } from "@/components/report-finder";
import { SiteHeader } from "@/components/site-header";
import { PageGlow } from "@/components/ui";

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <div className="relative isolate flex flex-1 flex-col">
        <PageGlow />
        <Hero />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-9 sm:pt-12">
          <ReportFinder />
        </main>
      </div>
    </>
  );
}
