import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Sparkles } from "lucide-react";

export default function EarnWithParo() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center pt-14 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-lg">
          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gold mx-auto mb-4 sm:mb-6" />
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gold mb-3 sm:mb-4">
            Earn With PARO
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl tracking-editorial uppercase">
            Coming Soon
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}