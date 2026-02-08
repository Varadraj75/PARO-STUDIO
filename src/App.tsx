import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ParoOriginals from "./pages/ParoOriginals";
import PromptDetail from "./pages/PromptDetail";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import Saved from "./pages/Saved";
import Liked from "./pages/Liked";
import TopCreators from "./pages/TopCreators";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import EarnWithParo from "./pages/EarnWithParo";
import Feedback from "./pages/Feedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/originals" element={<ParoOriginals />} />
              <Route path="/prompt/:id" element={<PromptDetail />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/liked" element={<Liked />} />
              <Route path="/top-creators" element={<TopCreators />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/earn" element={<EarnWithParo />} />
              <Route path="/feedback" element={<Feedback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
