import { useState, useEffect, useRef, useMemo } from "react";
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
import { 
  FileText, 
  ArrowLeft, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Lock,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const subjects: Record<string, string> = {
  financial: "재무회계",
  tax: "세법",
};

const subjectToDbValue: Record<string, string> = {
  financial: "financial_accounting",
  tax: "tax_law",
};

const exams: Record<string, { name: string; round: number }> = {
  "summit-1": { name: "SUMMIT", round: 1 },
  "summit-2": { name: "SUMMIT", round: 2 },
};

interface RelatedQuestion {
  id: string;
  exam_name: string;
  exam_round: number;
  subject: string;
  question_number: number;
  related_year: number;
  related_question_number: number;
  image_path: string;
  topic: string;
}

interface WeakArea {
  id: string;
  name: string;
  wrongCount: number;
  relatedCount: number;
  questionNumbers: number[];
}

const Edge = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useServiceAccess();
  
  // 상태
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeAreaFilter, setActiveAreaFilter] = useState<string | null>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const subject = searchParams.get("subject") || "";
  const exam = searchParams.get("exam") || "";
  const wrongParam = searchParams.get("wrong") || "";

  const wrongQuestions = wrongParam
    ? wrongParam.split(",").map(Number).filter(Boolean)
    : [];

  const examInfo = exams[exam];
  const dbSubject = subjectToDbValue[subject] as "financial_accounting" | "tax_law" | undefined;

  // 틀린 문제에 해당하는 관련 기출문제 조회
  const { data: relatedQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["related-questions", examInfo?.name, examInfo?.round, dbSubject, wrongQuestions],
    queryFn: async () => {
      if (!examInfo || !dbSubject || wrongQuestions.length === 0) return [];
      
      const { data, error } = await supabase
        .from("related_questions")
        .select("*")
        .eq("exam_name", examInfo.name)
        .eq("exam_round", examInfo.round)
        .eq("subject", dbSubject)
        .in("question_number", wrongQuestions);

      if (error) throw error;
      return data as RelatedQuestion[];
    },
    enabled: !!examInfo && !!dbSubject && wrongQuestions.length > 0,
  });

  // 취약 영역 분석 (토픽별 그룹화)
  const weakAreas: WeakArea[] = useMemo(() => {
    if (relatedQuestions.length === 0) return [];

    const topicMap = new Map<string, WeakArea>();

    relatedQuestions.forEach((q) => {
      // topic에서 주요 카테고리 추출 (예: "충당부채 - 제품보증충당부채" -> "충당부채")
      const mainTopic = q.topic.split(" - ")[0];
      
      if (!topicMap.has(mainTopic)) {
        topicMap.set(mainTopic, {
          id: mainTopic,
          name: mainTopic,
          wrongCount: 0,
          relatedCount: 0,
          questionNumbers: [],
        });
      }

      const area = topicMap.get(mainTopic)!;
      if (!area.questionNumbers.includes(q.question_number)) {
        area.questionNumbers.push(q.question_number);
        area.wrongCount += 1;
      }
      area.relatedCount += 1;
    });

    return Array.from(topicMap.values());
  }, [relatedQuestions]);

  // 선택된 모든 문제 초기화
  useEffect(() => {
    if (relatedQuestions.length > 0 && selectedQuestions.length === 0) {
      // 처음 로드시 모든 문제 선택
      setSelectedQuestions(relatedQuestions.map(q => q.id));
    }
  }, [relatedQuestions]);

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
  }, [hasData, weakAreas]);

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
  const filteredQuestions = useMemo(() => {
    if (activeAreaFilter === null) return relatedQuestions;
    return relatedQuestions.filter((q) => q.topic.startsWith(activeAreaFilter));
  }, [relatedQuestions, activeAreaFilter]);

  const toggleQuestion = (id: string) => {
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

  const selectedPastQuestions = relatedQuestions.filter((q) =>
    selectedQuestions.includes(q.id)
  );

  // 인쇄 핸들러
  const handlePrint = () => {
    window.print();
  };

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
                  Edge 서비스는 상품 구입자 또는 무료 배포본 수험번호 인증자만 이용할 수 있습니다.
                </p>
                <div className="space-y-3">
                  {!user && (
                    <Button 
                      onClick={() => navigate("/auth?redirect=/edge")} 
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
    <div className="min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="pt-16 print:pt-0">
        <section className="py-20 md:py-28 print:py-0">
          <div className="container mx-auto px-6 print:px-0">
            <div className="max-w-4xl mx-auto print:max-w-none">
              {/* 헤더 */}
              <div className="text-center mb-16 print:hidden">
                <h1 className="text-3xl font-light mb-4">Edge</h1>
                <p className="text-muted-foreground">
                  틀린 문제 기반 맞춤형 복습 시험지 생성
                </p>
              </div>

              {!hasData ? (
                /* 데이터 없음 상태 */
                <div className="bg-muted/50 rounded-lg p-12 text-center print:hidden">
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
              ) : questionsLoading ? (
                <div className="flex items-center justify-center py-20 print:hidden">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground">관련 기출문제 로딩 중...</span>
                </div>
              ) : relatedQuestions.length === 0 ? (
                <div className="bg-muted/50 rounded-lg p-12 text-center print:hidden">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">
                    틀린 문제({wrongQuestions.join(", ")}번)에 대한<br />
                    관련 기출문제가 아직 등록되지 않았습니다.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/quick-scoring")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    빠른 채점으로 돌아가기
                  </Button>
                </div>
              ) : (
                <div className="print:hidden">
                  {/* 과목/회차 정보 */}
                  <div className="flex items-center justify-center gap-4 mb-12 text-sm text-muted-foreground">
                    <span className="px-3 py-1 bg-muted rounded-full">
                      {subjects[subject]}
                    </span>
                    <span className="px-3 py-1 bg-muted rounded-full">
                      {examInfo?.name} {examInfo?.round}회
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

                  {/* 취약 영역 분석 (스크롤 인디케이터 포함) */}
                  {weakAreas.length > 0 && (
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
                            {weakAreas.map((area) => (
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
                  )}

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
                                {q.related_year}년 {q.related_question_number}번 (SUMMIT {q.exam_round}회 {q.question_number}번 관련)
                              </p>
                            </div>
                          </div>
                        ))
                      )}
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
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* PDF 미리보기 모달 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible p-0">
          <DialogHeader className="print:hidden p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>시험지 미리보기</span>
            </DialogTitle>
          </DialogHeader>

          {/* 시험지 미리보기 컨텐츠 - CPA 시험지 양식 (T자형 2단 레이아웃, 4문제/페이지) */}
          <div className="bg-white text-black" id="print-content">
            {/* 4문제씩 페어로 묶어서 페이지 생성 */}
            {Array.from({ length: Math.ceil(selectedPastQuestions.length / 4) }).map((_, pageIdx) => {
              const topLeftQ = selectedPastQuestions[pageIdx * 4];
              const topRightQ = selectedPastQuestions[pageIdx * 4 + 1];
              const bottomLeftQ = selectedPastQuestions[pageIdx * 4 + 2];
              const bottomRightQ = selectedPastQuestions[pageIdx * 4 + 3];
              const pageNum = pageIdx + 1;
              const totalPages = Math.ceil(selectedPastQuestions.length / 4);
              
              return (
                <div 
                  key={pageIdx} 
                  className="exam-page bg-white mx-4 mb-4"
                  style={{ 
                    width: '210mm',
                    height: '297mm',
                    margin: '0 auto 16px',
                    boxSizing: 'border-box',
                    border: '1px solid #ccc',
                    overflow: 'hidden'
                  }}
                >
                  {/* 시험지 상단 헤더 */}
                  <div 
                    className="flex items-center justify-between px-3 py-1"
                    style={{ borderBottom: '2px solid black', height: '36px' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{pageNum}/{totalPages}</span>
                      <span 
                        className="inline-flex items-center justify-center w-5 h-5 border border-black rounded-full text-sm font-bold"
                        style={{ borderWidth: '1.5px' }}
                      >
                        ①
                      </span>
                      <span className="text-xs">형</span>
                    </div>
                    
                    <div className="text-center flex-1">
                      <h1 
                        className="text-2xl font-bold tracking-widest"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {subject === 'financial' ? '회계학' : '세법학'}
                      </h1>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-bold">제3교시</span>
                    </div>
                  </div>

                  {/* T자형 본문 영역 - 2x2 그리드 */}
                  <div 
                    className="grid grid-cols-2"
                    style={{ height: 'calc(297mm - 36px)' }}
                  >
                    {/* 왼쪽 상단 */}
                    <div 
                      className="p-2 overflow-hidden"
                      style={{ borderRight: '1px solid black', borderBottom: '1px solid black', height: 'calc((297mm - 36px) / 2)' }}
                    >
                      {topLeftQ && (
                        <img 
                          src={topLeftQ.image_path} 
                          alt={`${topLeftQ.related_year}년 ${topLeftQ.related_question_number}번`}
                          className="w-full h-full object-contain object-top"
                        />
                      )}
                    </div>

                    {/* 오른쪽 상단 */}
                    <div 
                      className="p-2 overflow-hidden"
                      style={{ borderBottom: '1px solid black', height: 'calc((297mm - 36px) / 2)' }}
                    >
                      {topRightQ && (
                        <img 
                          src={topRightQ.image_path} 
                          alt={`${topRightQ.related_year}년 ${topRightQ.related_question_number}번`}
                          className="w-full h-full object-contain object-top"
                        />
                      )}
                    </div>

                    {/* 왼쪽 하단 */}
                    <div 
                      className="p-2 overflow-hidden"
                      style={{ borderRight: '1px solid black', height: 'calc((297mm - 36px) / 2)' }}
                    >
                      {bottomLeftQ && (
                        <img 
                          src={bottomLeftQ.image_path} 
                          alt={`${bottomLeftQ.related_year}년 ${bottomLeftQ.related_question_number}번`}
                          className="w-full h-full object-contain object-top"
                        />
                      )}
                    </div>

                    {/* 오른쪽 하단 */}
                    <div 
                      className="p-2 overflow-hidden"
                      style={{ height: 'calc((297mm - 36px) / 2)' }}
                    >
                      {bottomRightQ && (
                        <img 
                          src={bottomRightQ.image_path} 
                          alt={`${bottomRightQ.related_year}년 ${bottomRightQ.related_question_number}번`}
                          className="w-full h-full object-contain object-top"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 답안지 페이지 */}
            <div 
              className="exam-page bg-white mx-4 mb-4"
              style={{ 
                width: '210mm',
                height: '297mm',
                margin: '0 auto',
                boxSizing: 'border-box',
                border: '1px solid #ccc'
              }}
            >
              {/* 답안지 헤더 */}
              <div 
                className="flex items-center justify-between px-3 py-1"
                style={{ borderBottom: '2px solid black', height: '36px' }}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="inline-flex items-center justify-center w-5 h-5 border border-black rounded-full text-sm font-bold"
                    style={{ borderWidth: '1.5px' }}
                  >
                    ①
                  </span>
                  <span className="text-xs">형</span>
                </div>
                <div className="text-center flex-1">
                  <h1 
                    className="text-xl font-bold tracking-widest"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    답안지
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">{subject === 'financial' ? '회계학' : '세법학'}</span>
                </div>
              </div>

              {/* 수험 정보 입력란 */}
              <div className="p-3 border-b border-gray-400">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-bold block mb-1">성명</span>
                    <div className="border-2 border-black h-8 flex items-center px-2">
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div key={n} className="w-5 h-5 border-b border-gray-400"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold block mb-1">수험번호</span>
                    <div className="border-2 border-black h-8 flex items-center px-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <div key={n} className="w-4 h-5 border-b border-gray-400"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 답안 표기란 */}
              <div className="p-3">
                <h3 className="font-bold mb-3 text-center text-sm border-b pb-1">답안 표기란</h3>
                <div className="grid grid-cols-5 gap-x-2 gap-y-1">
                  {selectedPastQuestions.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-1 py-0.5 border-b border-gray-200">
                      <span className="text-xs font-bold w-4 text-right">{idx + 1}.</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className="w-4 h-4 border border-black rounded-full flex items-center justify-center text-[10px] font-medium"
                          >
                            {n === 1 ? '①' : n === 2 ? '②' : n === 3 ? '③' : n === 4 ? '④' : '⑤'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-300 px-3 py-1 text-xs text-gray-500 text-center">
                <span>Wiser Lab Edge | {examInfo?.name} {examInfo?.round}회 기반 맞춤형 복습 시험지</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4 p-6 pt-4 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPreview(false)}
            >
              <X className="w-4 h-4 mr-2" />
              닫기
            </Button>
            <Button className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              인쇄 / PDF 저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 인쇄 전용 스타일 - 개선됨 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #print-content, 
          #print-content * {
            visibility: visible;
          }
          
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            margin: 0;
            padding: 0;
          }
          
          .exam-page {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            page-break-after: always;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          
          .exam-page:last-child {
            page-break-after: auto;
          }
          
          /* Dialog 숨기기 */
          [role="dialog"] {
            position: static !important;
            transform: none !important;
            max-width: none !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Edge;
