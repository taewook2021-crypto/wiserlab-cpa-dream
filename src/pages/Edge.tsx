import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Save,
  FolderOpen
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  { id: 5, name: "리스회계", wrongCount: 2, relatedCount: 9 },
  { id: 6, name: "충당부채", wrongCount: 1, relatedCount: 7 },
  { id: 7, name: "법인세회계", wrongCount: 3, relatedCount: 11 },
  { id: 8, name: "연결재무제표", wrongCount: 2, relatedCount: 14 },
];

interface PastQuestion {
  id: number;
  year: number;
  round: number;
  number: number;
  topic: string;
  areaId: number;
}

// 목업 추천 기출문제 데이터
const initialPastQuestions: PastQuestion[] = [
  { id: 1, year: 2024, round: 1, number: 12, topic: "재고자산 - 저가법 적용", areaId: 1 },
  { id: 2, year: 2024, round: 2, number: 8, topic: "재고자산 - 매출원가 계산", areaId: 1 },
  { id: 3, year: 2023, round: 1, number: 15, topic: "유형자산 - 감가상각", areaId: 2 },
  { id: 4, year: 2023, round: 2, number: 22, topic: "금융상품 - 공정가치 측정", areaId: 3 },
  { id: 5, year: 2022, round: 1, number: 18, topic: "금융상품 - 손상차손", areaId: 3 },
  { id: 6, year: 2022, round: 2, number: 11, topic: "수익인식 - 계약변경", areaId: 4 },
  { id: 7, year: 2024, round: 1, number: 25, topic: "리스회계 - 사용권자산", areaId: 5 },
  { id: 8, year: 2023, round: 2, number: 19, topic: "충당부채 - 측정기준", areaId: 6 },
  { id: 9, year: 2024, round: 2, number: 30, topic: "법인세회계 - 이연법인세", areaId: 7 },
  { id: 10, year: 2022, round: 1, number: 33, topic: "연결재무제표 - 내부거래 제거", areaId: 8 },
];

const STORAGE_KEY = "edge-exam-config";

const Edge = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 상태
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([1, 2, 3]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeAreaFilter, setActiveAreaFilter] = useState<number | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const subject = searchParams.get("subject") || "";
  const exam = searchParams.get("exam") || "";
  const wrongParam = searchParams.get("wrong") || "";

  const wrongQuestions = wrongParam
    ? wrongParam.split(",").map(Number).filter(Boolean)
    : [];

  const hasData = subject && exam && wrongQuestions.length > 0;

  // 스크롤 상태 체크
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollState();
      container.addEventListener("scroll", checkScrollState);
      window.addEventListener("resize", checkScrollState);
      return () => {
        container.removeEventListener("scroll", checkScrollState);
        window.removeEventListener("resize", checkScrollState);
      };
    }
  }, [hasData]);

  // 스크롤 핸들러
  const scrollWeakAreas = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 필터링된 문제 목록
  const filteredQuestions = initialPastQuestions.filter((q) => {
    return activeAreaFilter === null || q.areaId === activeAreaFilter;
  });

  const toggleQuestion = (id: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const filteredIds = filteredQuestions.map((q) => q.id);
    const allSelected = filteredIds.every((id) => selectedQuestions.includes(id));
    if (allSelected) {
      setSelectedQuestions((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQuestions((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };


  // 저장/불러오기
  const saveConfig = () => {
    const config = {
      selectedQuestions,
      activeAreaFilter,
      includeNotes,
      includeSolutions,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast({
      title: "구성 저장 완료",
      description: "선택한 문제와 설정이 저장되었습니다.",
    });
  };

  const loadConfig = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setSelectedQuestions(config.selectedQuestions || []);
        setActiveAreaFilter(config.activeAreaFilter ?? null);
        setIncludeNotes(config.includeNotes || false);
        setIncludeSolutions(config.includeSolutions || false);
        toast({
          title: "구성 불러오기 완료",
          description: "저장된 설정이 복원되었습니다.",
        });
      } catch {
        toast({
          title: "불러오기 실패",
          description: "저장된 구성을 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "저장된 구성 없음",
        description: "저장된 구성이 없습니다.",
      });
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
                  {/* 과목/회차 정보 + 저장/불러오기 */}
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-3 py-1 bg-muted rounded-full">
                        {subjects[subject]}
                      </span>
                      <span className="px-3 py-1 bg-muted rounded-full">
                        {exams[exam]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadConfig}
                        aria-label="저장된 구성 불러오기"
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        불러오기
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={saveConfig}
                        aria-label="현재 구성 저장하기"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </Button>
                    </div>
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

                  {/* 취약 영역 분석 (스크롤 인디케이터 포함) */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-light">취약 영역 분석</h2>
                      {activeAreaFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveAreaFilter(null)}
                          className="text-muted-foreground"
                        >
                          필터 초기화
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      {/* 스크롤 인디케이터 - 왼쪽 */}
                      {canScrollLeft && (
                        <button
                          onClick={() => scrollWeakAreas("left")}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
                          aria-label="왼쪽으로 스크롤"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {/* 스크롤 인디케이터 - 오른쪽 */}
                      {canScrollRight && (
                        <button
                          onClick={() => scrollWeakAreas("right")}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
                          aria-label="오른쪽으로 스크롤"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {/* 그라데이션 페이드 */}
                      {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-[5]" />
                      )}
                      {canScrollRight && (
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-[5]" />
                      )}
                      <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto scrollbar-hide -mx-2 px-2 pb-2"
                        role="listbox"
                        aria-label="취약 영역 목록"
                      >
                        <div className="flex gap-4 min-w-max">
                          {mockWeakAreas.map((area) => (
                            <button
                              key={area.id}
                              onClick={() =>
                                setActiveAreaFilter(
                                  activeAreaFilter === area.id ? null : area.id
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setActiveAreaFilter(
                                    activeAreaFilter === area.id ? null : area.id
                                  );
                                }
                              }}
                              className={`p-4 rounded-lg text-center min-w-[140px] transition-all duration-200 ${
                                activeAreaFilter === area.id
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card scale-[1.02]"
                                  : "bg-muted/50 hover:bg-muted hover:scale-[1.01]"
                              }`}
                              role="option"
                              aria-selected={activeAreaFilter === area.id}
                              tabIndex={0}
                            >
                              <p className="font-medium mb-1">{area.name}</p>
                              <p className={`text-sm ${activeAreaFilter === area.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                오답 {area.wrongCount}개
                              </p>
                              <p className={`text-xs ${activeAreaFilter === area.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                관련 기출 {area.relatedCount}문제
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추천 기출문제 */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-light">
                          추천 관련 기출문제
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({filteredQuestions.length}문제 중{" "}
                            {filteredQuestions.filter((q) => selectedQuestions.includes(q.id)).length}개 선택)
                          </span>
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={toggleAll}
                          aria-label={
                            filteredQuestions.every((q) => selectedQuestions.includes(q.id))
                              ? "전체 해제"
                              : "전체 선택"
                          }
                        >
                          {filteredQuestions.every((q) => selectedQuestions.includes(q.id))
                            ? "전체 해제"
                            : "전체 선택"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3" role="listbox" aria-label="기출문제 목록">
                      {filteredQuestions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          필터 조건에 맞는 문제가 없습니다.
                        </p>
                      ) : (
                        filteredQuestions.map((q) => (
                          <div
                            key={q.id}
                            className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                              selectedQuestions.includes(q.id)
                                ? "bg-primary/5 ring-1 ring-primary/20"
                                : "bg-muted/30 hover:bg-muted/50"
                            }`}
                            onClick={() => toggleQuestion(q.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleQuestion(q.id);
                              }
                            }}
                            role="option"
                            aria-selected={selectedQuestions.includes(q.id)}
                            tabIndex={0}
                          >
                            <Checkbox
                              checked={selectedQuestions.includes(q.id)}
                              onCheckedChange={() => toggleQuestion(q.id)}
                              className="transition-transform duration-200 data-[state=checked]:scale-110"
                              aria-label={`${q.topic} 선택`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{q.topic}</p>
                              <p className="text-xs text-muted-foreground">
                                {q.year}년 {q.round}회 {q.number}번
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 시험지 옵션 */}
                  <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <h2 className="text-lg font-light mb-6">시험지 옵션</h2>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-notes" className="cursor-pointer">
                          메모 공간 포함
                          <span className="block text-xs text-muted-foreground">
                            각 문제 아래에 메모할 공간을 추가합니다
                          </span>
                        </Label>
                        <Switch
                          id="include-notes"
                          checked={includeNotes}
                          onCheckedChange={setIncludeNotes}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-solutions" className="cursor-pointer">
                          해설 포함
                          <span className="block text-xs text-muted-foreground">
                            문제 풀이 후 확인할 해설을 추가합니다
                          </span>
                        </Label>
                        <Switch
                          id="include-solutions"
                          checked={includeSolutions}
                          onCheckedChange={setIncludeSolutions}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 시험지 생성 버튼 */}
                  <div className="text-center">
                    <Button
                      size="lg"
                      className="w-full max-w-md h-14 text-base font-normal"
                      disabled={selectedQuestions.length === 0}
                      onClick={() => setShowPreview(true)}
                      aria-label={`맞춤형 시험지 생성 - ${selectedQuestions.length}문제`}
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
          <div className="bg-white text-black p-8 rounded-lg border print:p-0 print:border-0">
            {/* 시험지 헤더 */}
            <div className="text-center border-b-2 border-black pb-6 mb-8">
              <h1 className="text-2xl font-bold mb-2">
                {subjects[subject]} 맞춤형 복습 시험지
              </h1>
              <p className="text-sm text-gray-600">
                Wiser Lab Edge | {exams[exam]} 기반 | {selectedQuestions.length}문제
                {includeNotes && " | 메모 포함"}
                {includeSolutions && " | 해설 포함"}
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
                <div 
                  key={q.id} 
                  className={`pb-6 border-b border-gray-200 last:border-0 ${
                    (idx + 1) % 5 === 0 ? "print:break-after-page" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{q.topic}</p>
                      </div>
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
                      {/* 메모 공간 */}
                      {includeNotes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-400 mb-2">메모</p>
                          <div className="space-y-2">
                            {[1, 2, 3].map((line) => (
                              <div key={line} className="border-b border-gray-200 h-6" />
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 해설 */}
                      {includeSolutions && (
                        <div className="mt-4 pt-4 border-t border-gray-200 bg-yellow-50 p-3 rounded">
                          <p className="text-xs font-medium text-gray-700 mb-1">[해설]</p>
                          <p className="text-sm text-gray-600">
                            이 문제의 정답은 ③번입니다. 해설 내용이 여기에 표시됩니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 답안 표기란 */}
            <div className="mt-8 pt-6 border-t-2 border-black print:break-before-page">
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
