import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useServiceAccess } from "@/hooks/useServiceAccess";

// Mock 문항별 정답률 데이터
const generateMockQuestionStats = () => {
  return Array.from({ length: 35 }, (_, i) => ({
    questionNumber: i + 1,
    correctRate: Math.round(30 + Math.random() * 60), // 30% ~ 90%
  }));
};

const mockQuestionStats = generateMockQuestionStats();

const QuestionAnalysis = () => {
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useServiceAccess();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const subjectFromUrl = searchParams.get("subject");
  const examFromUrl = searchParams.get("exam");
  
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFromUrl || "financial");
  const [selectedExam, setSelectedExam] = useState<string>(examFromUrl || "summit-1");

  // 정답률 낮은 순으로 정렬 (어려운 문제)
  const sortedByDifficulty = [...mockQuestionStats].sort((a, b) => a.correctRate - b.correctRate);
  const hardestQuestions = sortedByDifficulty.slice(0, 5);

  // 접근 권한 체크
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="container mx-auto px-6 py-20 text-center">
            <p className="text-muted-foreground animate-pulse">접근 권한 확인 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-6">
              <div className="max-w-md mx-auto text-center">
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h1 className="text-2xl font-light mb-4">접근 권한이 필요합니다</h1>
                <p className="text-muted-foreground mb-8">
                  문항분석 서비스는 상품 구입자 또는 무료 배포본 수험번호 인증자만 이용할 수 있습니다.
                </p>
                <div className="space-y-3">
                  {!user && (
                    <Button 
                      onClick={() => navigate("/auth?redirect=/question-analysis")} 
                      className="w-full"
                    >
                      로그인하기
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/quick-scoring")}
                    className="w-full"
                  >
                    빠른 채점에서 코드 인증하기
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/summit")}
                    className="w-full"
                  >
                    상품 구매하기
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              {/* 뒤로가기 */}
              <Link 
                to="/statistics" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                통계로 돌아가기
              </Link>

              {/* 헤더 */}
              <div className="text-center mb-12">
                <h1 className="text-3xl font-light mb-2">문항별 정답률</h1>
                <p className="text-muted-foreground text-sm">
                  전체 응시자 기준 문항별 정답률
                </p>
              </div>

              {/* 과목/회차 선택 */}
              <div className="grid grid-cols-2 gap-4 mb-12 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">과목</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">재무회계</SelectItem>
                      <SelectItem value="tax">세법</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">회차</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summit-1">SUMMIT 1회</SelectItem>
                      <SelectItem value="summit-2">SUMMIT 2회</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 어려운 문제 TOP 5 */}
              <div className="mb-12">
                <h3 className="text-sm font-medium text-muted-foreground mb-6">어려운 문제 TOP 5</h3>
                <div className="grid grid-cols-5 gap-4">
                  {hardestQuestions.map((q) => (
                    <div 
                      key={q.questionNumber}
                      className="text-center py-3"
                    >
                      <p className="text-xs text-muted-foreground mb-1">{q.questionNumber}번</p>
                      <p className="text-sm font-mono">{q.correctRate}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전체 문항 정답률 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-6">전체 문항</h3>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-4">
                  {mockQuestionStats.map((q) => (
                    <div 
                      key={q.questionNumber}
                      className="text-center py-3"
                    >
                      <p className="text-xs text-muted-foreground mb-1">{q.questionNumber}번</p>
                      <p className="text-sm font-mono">{q.correctRate}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default QuestionAnalysis;
