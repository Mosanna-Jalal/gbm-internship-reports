import { Background } from "@/components/background";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { ReportFinder } from "@/components/report-finder";

export default function Home() {
  return (
    <>
      <Background />
      <Hero />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-8 sm:pt-10">
        <ReportFinder />
      </main>
      <Footer />
    </>
  );
}
