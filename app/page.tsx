import { Hero } from "@/components/hero";
import { ReportFinder } from "@/components/report-finder";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <Hero />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-9 sm:pt-12">
        <ReportFinder />
      </main>
    </>
  );
}
