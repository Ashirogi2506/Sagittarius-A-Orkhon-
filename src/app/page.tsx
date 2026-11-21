import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Announcements } from "@/components/Announcements";
import { ReportSection } from "@/components/ReportSection";
import { MapSection } from "@/components/MapSection";
import { ResultsSection } from "@/components/ResultsSection";
import { AppSection } from "@/components/AppSection";
import { MobileTabBar } from "@/components/MobileTabBar";
import { ChatWidget } from "@/components/ChatWidget";
import { Footer, Toast } from "@/components/About";
import { AlertBanner, AlertsSection } from "@/components/Alerts";
import { ServicesSection } from "@/components/ServicesSection";
import { VisitorSection } from "@/components/VisitorSection";

export default function Home() {
  return (
    <StoreProvider>
      <a href="#notices" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:text-navy">Мэдэгдэл рүү шилжих</a>
      <Header />
      <AlertBanner />
      <main>
        <Hero />
        <AlertsSection />
        <Announcements />
        <MapSection />
        <ServicesSection />
        <VisitorSection />
        <ReportSection />
        <ResultsSection />
        <AppSection />
      </main>
      <Footer />
      <MobileTabBar />
      <ChatWidget />
      <Toast />
    </StoreProvider>
  );
}
