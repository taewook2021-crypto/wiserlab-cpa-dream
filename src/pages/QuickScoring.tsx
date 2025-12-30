import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServiceAccess } from "@/hooks/useServiceAccess";

interface AnswerGroup {
  startNum: number;
  endNum: number;
  value: string;
}

interface ScoringResult {
  questionNumber: number;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

interface ExistingResult {
  id: string;
  correct_count: number;
  total_questions: number;
  score_percentage: number;
}

const subjects = [
  { id: "financial", name: "재무회계", dbValue: "financial_accounting" },
  { id: "tax", name: "세법", dbValue: "tax_law" },
];

const exams = [
  { id: "summit-1", name: "SUMMIT 1회", round: 1 },
  { id: "summit-2", name: "SUMMIT 2회", round: 2 },
];

const TOTAL_QUESTIONS = 35;

const QuickScoring = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading, refetch: refetchAccess } = useServiceAccess();
  
  // 무료 코드 등록
  const [freeCodeInput, setFreeCodeInput] = useState("");
  const [freeCodeError, setFreeCodeError] = useState("");
  const [registeringCode, setRegisteringCode] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [results, setResults] = useState<ScoringResult[] | null>(null);
  const [resultSaved, setResultSaved] = useState(false);
  const [existingResult, setExistingResult] = useState<ExistingResult | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [answers, setAnswers] = useState<AnswerGroup[]>(() => {
    const groups: AnswerGroup[] = [];
    for (let i = 0; i < 7; i++) {
      const startNum = i * 5 + 1;
      const endNum = Math.min(i * 5 + 5, TOTAL_QUESTIONS);
      groups.push({
        startNum,
        endNum,
        value: "",
      });
    }
    return groups;
  });
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 무료 코드 등록
  const registerFreeCode = async () => {
    const trimmed = freeCodeInput.trim().toUpperCase();
    if (!trimmed) {
      setFreeCodeError("코드를 입력해주세요");
      return;
    }

    if (!user) {
      setFreeCodeError("로그인이 필요합니다");
      return;
    }

    setRegisteringCode(true);
    setFreeCodeError("");

    const { data, error } = await supabase
      .from("exam_numbers")
      .select("id, exam_number, is_used, user_id")
      .eq("exam_number", trimmed)
      .maybeSingle();

    if (error || !data) {
      setFreeCodeError("유효하지 않은 코드입니다");
    } else if (data.is_used && data.user_id !== user.id) {
      setFreeCodeError("이미 다른 계정에서 사용된 코드입니다");
    } else if (data.user_id === user.id) {
      // 이미 내 계정에 연결된 코드
      toast.success("이미 등록된 코드입니다");
      await refetchAccess();
    } else {
      // 미사용 코드 - 내 계정에 영구 연결
      const { error: updateError } = await supabase
        .from("exam_numbers")
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString(),
          user_id: user.id 
        })
        .eq("id", data.id);

      if (updateError) {
        console.error("Error linking code:", updateError);
        setFreeCodeError("코드 등록에 실패했습니다. 다시 시도해주세요.");
      } else {
        toast.success("코드가 등록되었습니다! SUMMIT 서비스를 이용하실 수 있습니다.");
        setFreeCodeInput("");
        await refetchAccess();
      }
    }

    setRegisteringCode(false);
  };

  // 기존 채점 결과 확인
  useEffect(() => {
    const checkExisting = async () => {
      if (!user || !selectedSubject || !selectedExam || !hasAccess) {
        setExistingResult(null);
        return;
      }

      const subject = subjects.find((s) => s.id === selectedSubject);
      const exam = exams.find((e) => e.id === selectedExam);
      if (!subject || !exam) return;

      setCheckingExisting(true);
      const { data, error } = await supabase
        .from("scoring_results")
        .select("id, correct_count, total_questions, score_percentage")
        .eq("user_id", user.id)
        .eq("subject", subject.dbValue)
        .eq("exam_round", exam.round)
        .maybeSingle();

      if (!error && data) {
        setExistingResult(data);
      } else {
        setExistingResult(null);
      }
      setCheckingExisting(false);
    };

    checkExisting();
  }, [user, selectedSubject, selectedExam, hasAccess]);

  const handleAnswerChange = (index: number, value: string) => {
    const group = answers[index];
    const maxLength = group.endNum - group.startNum + 1;
    const numericValue = value.replace(/[^0-5]/g, "").slice(0, maxLength);
    setAnswers((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, value: numericValue } : g
      )
    );
    if (results) setResults(null);
    
    // 입력이 완료되면 다음 입력칸으로 자동 이동
    if (numericValue.length === maxLength && index < answers.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const subject = subjects.find((s) => s.id === selectedSubject);
    const exam = exams.find((e) => e.id === selectedExam);

    if (!subject || !exam) {
      toast.error("과목과 회차를 선택해주세요");
      return;
    }

    if (!hasAccess) {
      toast.error("서비스 이용 권한이 없습니다");
      return;
    }

    setIsScoring(true);

    try {
      // Fetch answer keys
      const { data: answerKeys, error } = await supabase
        .from("exam_answer_keys")
        .select("question_number, correct_answer")
        .eq("exam_name", "SUMMIT")
        .eq("exam_round", exam.round)
        .eq("subject", subject.dbValue as "financial_accounting" | "tax_law")
        .order("question_number");

      if (error) throw error;

      if (!answerKeys || answerKeys.length === 0) {
        toast.error("해당 시험의 정답표가 없습니다");
        return;
      }

      // Flatten user answers
      const userAnswers: number[] = [];
      answers.forEach((group) => {
        for (const char of group.value) {
          userAnswers.push(parseInt(char));
        }
      });

      // Compare and generate results
      const scoringResults: ScoringResult[] = answerKeys.map((key) => {
        const userAnswer = userAnswers[key.question_number - 1] || 0;
        return {
          questionNumber: key.question_number,
          userAnswer,
          correctAnswer: key.correct_answer,
          isCorrect: userAnswer === key.correct_answer,
        };
      });

      setResults(scoringResults);

      const correctCount = scoringResults.filter((r) => r.isCorrect).length;
      const scorePercentage = Math.round((correctCount / scoringResults.length) * 100);

      // 결과 저장 (기존 결과가 없을 때만)
      if (user && !existingResult) {
        const { data: insertedResult, error: saveError } = await supabase
          .from("scoring_results")
          .insert({
            user_id: user.id,
            subject: subject.dbValue,
            exam_name: "SUMMIT",
            exam_round: exam.round,
            correct_count: correctCount,
            total_questions: scoringResults.length,
            score_percentage: scorePercentage,
          })
          .select("id")
          .single();

        if (saveError) {
          console.error("Save error:", saveError);
        } else if (insertedResult) {
          // 개별 답안 저장
          const answersToInsert = scoringResults.map((r) => ({
            scoring_result_id: insertedResult.id,
            question_number: r.questionNumber,
            user_answer: r.userAnswer,
            correct_answer: r.correctAnswer,
            is_correct: r.isCorrect,
          }));

          const { error: answersError } = await supabase
            .from("scoring_answers")
            .insert(answersToInsert);

          if (answersError) {
            console.error("Answers save error:", answersError);
          }
          
          setResultSaved(true);
        }
      }

      toast.success(`채점 완료! ${correctCount}/${scoringResults.length}문제 정답`);
    } catch (error) {
      console.error("Scoring error:", error);
      toast.error("채점 중 오류가 발생했습니다");
    } finally {
      setIsScoring(false);
    }
  };

  const isFormValid =
    selectedSubject &&
    selectedExam &&
    selectedUniversity &&
    answers.every((group) => {
      const expectedLength = group.endNum - group.startNum + 1;
      return group.value.length === expectedLength;
    });

  const canSubmit = isFormValid && hasAccess;

  const correctCount = results?.filter((r) => r.isCorrect).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-light mb-4">빠른 채점하기</h1>
                <p className="text-muted-foreground">
                  5문제씩 묶어서 답안을 입력하세요 (예: 54312)
                </p>
              </div>

              {/* 로딩 중 */}
              {accessLoading && (
                <div className="bg-muted/50 border border-border rounded-lg p-8 mb-8 text-center">
                  <p className="text-muted-foreground">권한 확인 중...</p>
                </div>
              )}

              {/* 로그인 안내 */}
              {!accessLoading && !user && (
                <div className="bg-muted border border-border rounded-lg p-8 mb-8 text-center">
                  <p className="text-muted-foreground mb-4">로그인 후 채점 서비스를 이용할 수 있습니다</p>
                  <Button onClick={() => navigate("/auth?redirect=/quick-scoring")} className="h-12 px-8">
                    로그인하기
                  </Button>
                </div>
              )}

              {/* 권한 없음 - 무료 코드 등록 또는 구매 안내 */}
              {!accessLoading && user && !hasAccess && (
                <div className="bg-muted/50 border border-border rounded-lg p-8 mb-8">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground">
                      서비스 이용을 위해 무료 코드를 등록하거나 SUMMIT을 구매해주세요
                    </p>
                  </div>

                  {/* 무료 코드 등록 */}
                  <div className="bg-background border border-border rounded-lg p-6 mb-6">
                    <Label className="mb-3 block font-medium">무료 코드 등록</Label>
                    <div className="flex gap-3">
                      <Input
                        value={freeCodeInput}
                        onChange={(e) => {
                          setFreeCodeInput(e.target.value.toUpperCase());
                          setFreeCodeError("");
                        }}
                        placeholder="WLP-XXXX"
                        className="font-mono text-center tracking-wider"
                        maxLength={8}
                      />
                      <Button
                        onClick={registerFreeCode}
                        disabled={registeringCode || !freeCodeInput.trim()}
                        variant="outline"
                      >
                        {registeringCode ? "등록 중..." : "등록하기"}
                      </Button>
                    </div>
                    {freeCodeError && (
                      <p className="text-destructive text-sm mt-2">{freeCodeError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      * 무료 코드는 계정에 영구 연결되며, 이후 로그인만으로 서비스를 이용할 수 있습니다.
                    </p>
                  </div>

                  {/* 구분선 */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-sm text-muted-foreground">또는</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* 구매 버튼 */}
                  <Button 
                    onClick={() => navigate("/summit")} 
                    className="w-full h-12"
                  >
                    SUMMIT 구매하기
                  </Button>
                </div>
              )}

              {/* 권한 있음 - 채점 UI */}
              {!accessLoading && user && hasAccess && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-12">
                    <div className="space-y-2">
                      <Label>과목 선택 <span className="text-destructive">*</span></Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={(v) => {
                          setSelectedSubject(v);
                          setResults(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="과목" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>회차 선택 <span className="text-destructive">*</span></Label>
                      <Select
                        value={selectedExam}
                        onValueChange={(v) => {
                          setSelectedExam(v);
                          setResults(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="회차" />
                        </SelectTrigger>
                        <SelectContent>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>출신대학 <span className="text-destructive">*</span></Label>
                      <Select
                        value={selectedUniversity}
                        onValueChange={setSelectedUniversity}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="대학 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="snu">서울대학교</SelectItem>
                          <SelectItem value="yonsei">연세대학교</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 이미 채점한 시험 알림 */}
                  {existingResult && !results && (
                    <div className="bg-muted border border-border rounded-lg p-6 mb-8 text-center">
                      <p className="text-muted-foreground mb-2">이전 채점 기록 (통계 반영됨)</p>
                      <p className="text-2xl font-light mb-2">
                        <span className="text-primary font-medium">{existingResult.correct_count}</span>
                        <span className="text-muted-foreground"> / {existingResult.total_questions}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        정답률 {existingResult.score_percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground mb-6">
                        * 재채점은 가능하지만 통계에는 최초 채점 결과만 반영됩니다
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={() => navigate(`/statistics?subject=${selectedSubject}&exam=${selectedExam}&score=${existingResult.correct_count}&total=${existingResult.total_questions}`)}
                        >
                          통계 확인하기
                        </Button>
                        <Button
                          className="flex-1 h-12"
                          onClick={async () => {
                            const { data, error } = await supabase
                              .from("scoring_answers")
                              .select("question_number")
                              .eq("scoring_result_id", existingResult.id)
                              .eq("is_correct", false)
                              .order("question_number");

                            if (error) {
                              toast.error("오답 정보를 불러오지 못했습니다");
                              return;
                            }

                            const wrongQuestions = (data || []).map((d) => d.question_number);
                            if (wrongQuestions.length === 0) {
                              toast.info("틀린 문제가 없어 Edge를 생성할 수 없습니다");
                              return;
                            }

                            navigate(
                              `/edge?subject=${selectedSubject}&exam=${selectedExam}&wrong=${wrongQuestions.join(",")}`
                            );
                          }}
                        >
                          Edge
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 답안 입력 */}
                  <div className="space-y-6 mb-12">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      {answers.map((group, index) => {
                        const groupResults = results?.filter(
                          (r) =>
                            r.questionNumber >= group.startNum &&
                            r.questionNumber <= group.endNum
                        );

                        return (
                          <div key={index} className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              {group.startNum}번 ~ {group.endNum}번
                            </Label>
                            <Input
                              ref={(el) => (inputRefs.current[index] = el)}
                              type="text"
                              inputMode="numeric"
                              placeholder="54312"
                              value={group.value}
                              onChange={(e) =>
                                handleAnswerChange(index, e.target.value)
                              }
                              className="text-center text-lg tracking-[0.5em] font-mono"
                              maxLength={group.endNum - group.startNum + 1}
                            />
                            {groupResults && groupResults.length > 0 && (
                              <div className="flex justify-center gap-1 pt-1">
                                {groupResults.map((r) => (
                                  <span
                                    key={r.questionNumber}
                                    className={`text-lg font-bold w-6 text-center ${
                                      r.isCorrect
                                        ? "text-blue-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {r.isCorrect ? "○" : "✕"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 채점 결과 요약 */}
                  {results && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-center">
                      <p className="text-2xl font-light mb-2">
                        <span className="text-primary font-medium">{correctCount}</span>
                        <span className="text-muted-foreground"> / {results.length}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        정답률 {Math.round((correctCount / results.length) * 100)}%
                      </p>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={() => navigate(`/statistics?subject=${selectedSubject}&exam=${selectedExam}&score=${correctCount}&total=${results.length}`)}
                        >
                          통계 확인하기
                        </Button>
                        <Button
                          className="flex-1 h-12"
                          onClick={() => {
                            const wrongQuestions = results
                              .filter(r => !r.isCorrect)
                              .map(r => r.questionNumber)
                              .join(',');
                            navigate(`/edge?subject=${selectedSubject}&exam=${selectedExam}&wrong=${wrongQuestions}`);
                          }}
                        >
                          Edge
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 안내 문구 */}
                  <div className="bg-muted/50 rounded-lg p-6 mb-8">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      * 각 칸에 해당 문제의 답을 순서대로 입력하세요.
                      <br />* 1~5번 문제의 답이 5, 4, 3, 1, 2번이면 "54312"를 입력합니다.
                      <br />* 답은 0~5 사이의 숫자만 입력 가능합니다. (0 = 미응답)
                    </p>
                  </div>

                  {/* 채점 버튼 */}
                  <Button
                    onClick={handleSubmit}
                    className="w-full h-14 text-base font-normal"
                    disabled={!canSubmit || isScoring || checkingExisting}
                  >
                    {isScoring ? "채점 중..." : checkingExisting ? "확인 중..." : "채점하기"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default QuickScoring;
