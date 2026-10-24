import type { Metadata } from "next";
import { ReportsBrowser, ReportsHeading } from "@/components/reports-browser";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "All reports · GBM Internship Reports",
  description: "Every internship report, with download links and a way to request corrections.",
};

export default function ReportsPage() {
  return (
    <>
      <SiteHeader current="reports" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-10 sm:pt-14">
        <ReportsHeading />
        <div className="mt-8">
          <ReportsBrowser />
        </div>
      </main>
    </>
  );
}
