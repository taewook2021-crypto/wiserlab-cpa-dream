import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
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
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import Notice from "./pages/Notice";
import NoticeDetail from "./pages/NoticeDetail";
import NoticeAdmin from "./pages/NoticeAdmin";
import OrderAdmin from "./pages/OrderAdmin";
import ExamNumbersAdmin from "./pages/ExamNumbersAdmin";
import StatisticsAdmin from "./pages/StatisticsAdmin";
import FreeCodesAdmin from "./pages/FreeCodesAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
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
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
            <Route path="/notice" element={<Notice />} />
            <Route path="/notice/:id" element={<NoticeDetail />} />
            <Route path="/noticeadmin" element={<NoticeAdmin />} />
            <Route path="/orderadmin" element={<OrderAdmin />} />
            <Route path="/exam-numbers-admin" element={<ExamNumbersAdmin />} />
            <Route path="/statistics-admin" element={<StatisticsAdmin />} />
            <Route path="/free-codes-admin" element={<FreeCodesAdmin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
