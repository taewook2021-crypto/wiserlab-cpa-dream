import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ArrowLeft, Download, X } from "lucide-react";

const subjects: Record<string, string> = {
  financial: "재무회계",
  tax: "세법",
};

const exams: Record<string, string> = {
  "summit-1": "SUMMIT 1회",
  "summit-2": "SUMMIT 2회",
};

// 목업 취약 영역 데이터
const mockWeakAreas = [
  { id: 1, name: "재고자산", wrongCount: 3, relatedCount: 12 },
  { id: 2, name: "유형자산", wrongCount: 2, relatedCount: 8 },
  { id: 3, name: "금융상품", wrongCount: 2, relatedCount: 15 },
  { id: 4, name: "수익인식", wrongCount: 1, relatedCount: 6 },
];

// 목업 추천 기출문제 데이터
const initialPastQuestions = [
  { id: 1, year: 2024, round: 1, number: 12, topic: "재고자산 - 저가법 적용" },
  { id: 2, year: 2024, round: 2, number: 8, topic: "재고자산 - 매출원가 계산" },
  { id: 3, year: 2023, round: 1, number: 15, topic: "유형자산 - 감가상각" },
  { id: 4, year: 2023, round: 2, number: 22, topic: "금융상품 - 공정가치 측정" },
  { id: 5, year: 2022, round: 1, number: 18, topic: "금융상품 - 손상차손" },
  { id: 6, year: 2022, round: 2, number: 11, topic: "수익인식 - 계약변경" },
];

const Edge = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([1, 2, 3]);
  const [showPreview, setShowPreview] = useState(false);

  const subject = searchParams.get("subject") || "";
  const exam = searchParams.get("exam") || "";
  const wrongParam = searchParams.get("wrong") || "";

  const wrongQuestions = wrongParam
    ? wrongParam.split(",").map(Number).filter(Boolean)
    : [];

  const hasData = subject && exam && wrongQuestions.length > 0;

  const toggleQuestion = (id: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedQuestions.length === initialPastQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(initialPastQuestions.map((q) => q.id));
    }
  };

  const selectedPastQuestions = initialPastQuestions.filter((q) =>
    selectedQuestions.includes(q.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              {/* 헤더 */}
              <div className="text-center mb-16">
                <h1 className="text-3xl font-light mb-4">Edge</h1>
                <p className="text-muted-foreground">
                  틀린 문제 기반 맞춤형 복습 시험지 생성
                </p>
              </div>

              {!hasData ? (
                /* 데이터 없음 상태 */
                <div className="bg-muted/50 rounded-lg p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">
                    채점 결과가 없습니다.<br />
                    빠른 채점을 먼저 진행해주세요.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/quick-scoring")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    빠른 채점으로 이동
                  </Button>
                </div>
              ) : (
                <>
                  {/* 과목/회차 정보 */}
                  <div className="flex items-center justify-center gap-4 mb-12 text-sm text-muted-foreground">
                    <span className="px-3 py-1 bg-muted rounded-full">
                      {subjects[subject]}
                    </span>
                    <span className="px-3 py-1 bg-muted rounded-full">
                      {exams[exam]}
                    </span>
                  </div>

                  {/* 틀린 문제 목록 */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <h2 className="text-lg font-light mb-6">
                      틀린 문제{" "}
                      <span className="text-primary">{wrongQuestions.length}개</span>
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {wrongQuestions.map((num) => (
                        <div
                          key={num}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive text-sm font-medium"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 취약 영역 분석 */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <h2 className="text-lg font-light mb-6">취약 영역 분석</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {mockWeakAreas.map((area) => (
                        <div
                          key={area.id}
                          className="p-4 bg-muted/50 rounded-lg text-center"
                        >
                          <p className="font-medium mb-1">{area.name}</p>
                          <p className="text-sm text-muted-foreground">
                            오답 {area.wrongCount}개
                          </p>
                          <p className="text-xs text-muted-foreground">
                            관련 기출 {area.relatedCount}문제
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 추천 기출문제 */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-light">추천 관련 기출문제</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={toggleAll}
                      >
                        {selectedQuestions.length === initialPastQuestions.length
                          ? "전체 해제"
                          : "전체 선택"}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {initialPastQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <Checkbox
                            checked={selectedQuestions.includes(q.id)}
                            onCheckedChange={() => toggleQuestion(q.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{q.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {q.year}년 {q.round}회 {q.number}번
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 시험지 생성 버튼 */}
                  <div className="text-center">
                    <Button
                      size="lg"
                      className="w-full max-w-md h-14 text-base font-normal"
                      disabled={selectedQuestions.length === 0}
                      onClick={() => setShowPreview(true)}
                    >
                      맞춤형 시험지 생성 ({selectedQuestions.length}문제)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* PDF 미리보기 모달 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>시험지 미리보기</span>
            </DialogTitle>
          </DialogHeader>

          {/* 시험지 미리보기 컨텐츠 */}
          <div className="bg-white text-black p-8 rounded-lg border">
            {/* 시험지 헤더 */}
            <div className="text-center border-b-2 border-black pb-6 mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {subjects[subject]} 맞춤형 복습 시험지
              </h1>
              <p className="text-sm text-gray-600">
                Wiser Lab Edge | {exams[exam]} 기반 | {selectedQuestions.length}문제
              </p>
            </div>

            {/* 수험 정보 */}
            <div className="flex gap-8 mb-8 pb-4 border-b border-gray-300">
              <div className="flex-1">
                <span className="text-sm text-gray-500">성명</span>
                <div className="border-b border-gray-400 h-8 mt-1"></div>
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-500">수험번호</span>
                <div className="border-b border-gray-400 h-8 mt-1"></div>
              </div>
            </div>

            {/* 문제 목록 */}
            <div className="space-y-8">
              {selectedPastQuestions.map((q, idx) => (
                <div key={q.id} className="pb-6 border-b border-gray-200 last:border-0">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.topic}</p>
                      <p className="text-xs text-gray-500 mb-4">
                        출처: {q.year}년 {q.round}회 {q.number}번
                      </p>
                      {/* 목업 문제 내용 */}
                      <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 mb-4">
                        [문제 내용이 여기에 표시됩니다]
                      </div>
                      {/* 보기 */}
                      <div className="space-y-2 text-sm">
                        <p>① 보기 1</p>
                        <p>② 보기 2</p>
                        <p>③ 보기 3</p>
                        <p>④ 보기 4</p>
                        <p>⑤ 보기 5</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 답안 표기란 */}
            <div className="mt-8 pt-6 border-t-2 border-black">
              <h3 className="font-bold mb-4">답안 표기란</h3>
              <div className="grid grid-cols-5 gap-4">
                {selectedPastQuestions.map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{idx + 1}.</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="w-6 h-6 border border-gray-400 rounded-full flex items-center justify-center text-xs"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-4 h-4 mr-2" />
              닫기
            </Button>
            <Button className="flex-1" disabled>
              <Download className="w-4 h-4 mr-2" />
              PDF 다운로드 (준비중)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Edge;
