import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
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
import CompleteProfile from "./pages/CompleteProfile";

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
              {/* Complete Profile - accessible to authenticated users with incomplete profiles */}
              <Route path="/complete-profile" element={<CompleteProfile />} />
              
              {/* Public Route - home page accessible to everyone */}
              <Route path="/" element={<Index />} />
              
              {/* Protected Routes - require authentication and username */}
              <Route path="/originals" element={<ProtectedRoute><ParoOriginals /></ProtectedRoute>} />
              <Route path="/prompt/:id" element={<ProtectedRoute><PromptDetail /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
              <Route path="/liked" element={<ProtectedRoute><Liked /></ProtectedRoute>} />
              <Route path="/top-creators" element={<ProtectedRoute><TopCreators /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/earn" element={<ProtectedRoute><EarnWithParo /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
