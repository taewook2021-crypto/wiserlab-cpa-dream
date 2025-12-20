import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Summit from "./pages/Summit";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import QuickScoring from "./pages/QuickScoring";
import Edge from "./pages/Edge";
import Statistics from "./pages/Statistics";
import QuestionAnalysis from "./pages/QuestionAnalysis";
import MyPage from "./pages/MyPage";
import Cart from "./pages/Cart";
import Notice from "./pages/Notice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/summit" element={<Summit />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/quick-scoring" element={<QuickScoring />} />
            <Route path="/edge" element={<Edge />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/question-analysis" element={<QuestionAnalysis />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/notice" element={<Notice />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
