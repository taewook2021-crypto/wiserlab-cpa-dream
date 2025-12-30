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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

interface ExamNumberRecord {
  id: string;
  exam_number: string;
  is_used: boolean;
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
  
  // 접근 방식: "exam-number" | "login"
  const [accessMode, setAccessMode] = useState<"exam-number" | "login">("login");
  const [examNumberInput, setExamNumberInput] = useState("");
  const [examNumberRecord, setExamNumberRecord] = useState<ExamNumberRecord | null>(null);
  const [examNumberError, setExamNumberError] = useState("");
  const [verifyingExamNumber, setVerifyingExamNumber] = useState(false);
  const [hasPurchaseHistory, setHasPurchaseHistory] = useState<boolean | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
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

  // 로그인 모드에서 구입이력 및 관리자 여부 확인
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || accessMode !== "login") {
        setHasPurchaseHistory(null);
        setIsAdmin(false);
        return;
      }

      setCheckingPurchase(true);

      // 관리자 여부 확인
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        setIsAdmin(true);
        setHasPurchaseHistory(true); // 관리자는 구매 없이 접근 가능
        setCheckingPurchase(false);
        return;
      }

      // 일반 사용자: 구입이력 확인
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasPurchaseHistory(true);
      } else {
        setHasPurchaseHistory(false);
      }
      setCheckingPurchase(false);
    };

    checkAccess();
  }, [user, accessMode]);

  // 수험번호 검증 및 계정 연결
  const verifyExamNumber = async () => {
    const trimmed = examNumberInput.trim().toUpperCase();
    if (!trimmed) {
      setExamNumberError("수험번호를 입력해주세요");
      return;
    }

    if (!user) {
      setExamNumberError("로그인이 필요합니다");
      return;
    }

    setVerifyingExamNumber(true);
    setExamNumberError("");

    const { data, error } = await supabase
      .from("exam_numbers")
      .select("id, exam_number, is_used, user_id")
      .eq("exam_number", trimmed)
      .maybeSingle();

    if (error || !data) {
      setExamNumberError("유효하지 않은 수험번호입니다");
      setExamNumberRecord(null);
    } else if (data.is_used && data.user_id !== user.id) {
      setExamNumberError("이미 다른 계정에서 사용된 수험번호입니다.");
      setExamNumberRecord(null);
    } else if (data.user_id === user.id) {
      // 이미 내 계정에 연결된 코드
      setExamNumberRecord(data);
      setHasPurchaseHistory(true); // 코드 연결 = 접근 권한
      toast.success("수험번호가 확인되었습니다");
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
        console.error("Error linking exam number:", updateError);
        setExamNumberError("수험번호 연결에 실패했습니다. 다시 시도해주세요.");
        setExamNumberRecord(null);
      } else {
        setExamNumberRecord({ ...data, is_used: true, user_id: user.id });
        setHasPurchaseHistory(true); // 코드 연결 = 접근 권한
        toast.success("수험번호가 계정에 연결되었습니다");
      }
    }

    setVerifyingExamNumber(false);
  };

  // 로그인 모드: 기존 채점 결과 확인
  useEffect(() => {
    const checkExisting = async () => {
      if (!user || !selectedSubject || !selectedExam || accessMode !== "login") {
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
  }, [user, selectedSubject, selectedExam, accessMode]);

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

    // 수험번호 모드에서 수험번호 확인 필수
    if (accessMode === "exam-number" && !examNumberRecord) {
      toast.error("수험번호를 먼저 확인해주세요");
      return;
    }

    // 로그인 모드에서 구입이력 필수
    if (accessMode === "login" && !hasPurchaseHistory) {
      toast.error("상품 구입 후 이용 가능합니다");
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

      // 수험번호 모드: 결과 저장 + 수험번호 사용 처리
      if (accessMode === "exam-number" && examNumberRecord) {
        // 결과 저장 (exam_number_id 포함)
        const { data: insertedResult, error: saveError } = await supabase
          .from("scoring_results")
          .insert({
            user_id: "00000000-0000-0000-0000-000000000000", // 익명 사용자용 UUID
            subject: subject.dbValue,
            exam_name: "SUMMIT",
            exam_round: exam.round,
            correct_count: correctCount,
            total_questions: scoringResults.length,
            score_percentage: scorePercentage,
            exam_number_id: examNumberRecord.id,
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
        }

        // 수험번호 사용 처리
        const { error: updateError } = await supabase
          .from("exam_numbers")
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq("id", examNumberRecord.id);

        if (updateError) {
          console.error("Update exam number error:", updateError);
        }

        setResultSaved(true);
      }

      // 로그인 모드: 기존 로직
      if (accessMode === "login" && user && !existingResult) {
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
    answers.every((group) => {
      const expectedLength = group.endNum - group.startNum + 1;
      return group.value.length === expectedLength;
    });

  const canSubmit = () => {
    if (!isFormValid) return false;
    if (accessMode === "exam-number") {
      return !!examNumberRecord;
    }
    if (accessMode === "login") {
      return !!user && hasPurchaseHistory === true;
    }
    return false;
  };

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

              {/* 접근 방식 선택 */}
              <div className="bg-muted/50 border border-border rounded-lg p-6 mb-8">
                <Label className="text-base mb-4 block">채점 방식 선택</Label>
                <RadioGroup
                  value={accessMode}
                  onValueChange={(v) => {
                    setAccessMode(v as "exam-number" | "login");
                    setResults(null);
                    setExamNumberRecord(null);
                    setExamNumberError("");
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="exam-number" id="exam-number" />
                    <Label htmlFor="exam-number" className="cursor-pointer">
                      수험번호로 채점 (150명 대상 / 1회만 가능)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="login" id="login" />
                    <Label htmlFor="login" className="cursor-pointer">
                      로그인 후 채점 (유료 구입자)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 수험번호 입력 (수험번호 모드) - 로그인 필수 */}
              {accessMode === "exam-number" && !user && (
                <div className="bg-muted border border-border rounded-lg p-6 mb-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    수험번호 인증을 위해 로그인이 필요합니다
                  </p>
                  <Button onClick={() => navigate("/auth?redirect=/quick-scoring")} className="h-12 px-8">
                    로그인하기
                  </Button>
                </div>
              )}

              {accessMode === "exam-number" && user && (
                <div className="bg-muted/30 border border-border rounded-lg p-6 mb-8">
                  <Label className="mb-2 block">수험번호 입력</Label>
                  <div className="flex gap-3">
                    <Input
                      value={examNumberInput}
                      onChange={(e) => {
                        setExamNumberInput(e.target.value.toUpperCase());
                        setExamNumberError("");
                        setExamNumberRecord(null);
                      }}
                      placeholder="WLP-XXXX"
                      className="font-mono text-center tracking-wider"
                      maxLength={8}
                    />
                    <Button
                      onClick={verifyExamNumber}
                      disabled={verifyingExamNumber || !examNumberInput.trim()}
                      variant="outline"
                    >
                      {verifyingExamNumber ? "확인 중..." : "확인"}
                    </Button>
                  </div>
                  {examNumberError && (
                    <p className="text-destructive text-sm mt-2">{examNumberError}</p>
                  )}
                  {examNumberRecord && (
                    <p className="text-primary text-sm mt-2">✓ 수험번호가 계정에 연결되었습니다</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    * 수험번호는 계정에 영구 연결됩니다. 이후 로그인만으로 서비스를 이용할 수 있습니다.
                  </p>
                </div>
              )}

              {/* 로그인 안내 (로그인 모드) */}
              {accessMode === "login" && !user && (
                <div className="bg-muted border border-border rounded-lg p-6 mb-8 text-center">
                  <p className="text-muted-foreground mb-4">로그인 후 채점 서비스를 이용할 수 있습니다</p>
                  <Button onClick={() => navigate("/auth?redirect=/quick-scoring")} className="h-12 px-8">
                    로그인하기
                  </Button>
                </div>
              )}

              {/* 구입이력 없음 안내 (로그인 모드 - 관리자 제외) */}
              {accessMode === "login" && user && !checkingPurchase && hasPurchaseHistory === false && !isAdmin && (
                <div className="bg-muted border border-border rounded-lg p-6 mb-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    상품 구입 후 빠른 채점을 이용할 수 있습니다
                  </p>
                  <Button onClick={() => navigate("/summit")} className="h-12 px-8">
                    상품 보러가기
                  </Button>
                </div>
              )}

              {/* 과목 및 회차 선택 */}
              {(accessMode === "exam-number" || (accessMode === "login" && user && hasPurchaseHistory)) && (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="space-y-2">
                      <Label>과목 선택</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={(v) => {
                          setSelectedSubject(v);
                          setResults(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="과목을 선택하세요" />
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
                      <Label>회차 선택</Label>
                      <Select
                        value={selectedExam}
                        onValueChange={(v) => {
                          setSelectedExam(v);
                          setResults(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="회차를 선택하세요" />
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
                  </div>

                  {/* 로그인 모드: 이미 채점한 시험 알림 */}
                  {accessMode === "login" && existingResult && !results && (
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
                      {accessMode === "exam-number" && (
                        <p className="text-xs text-muted-foreground mb-4">
                          * 수험번호 채점 결과가 저장되었습니다. 재채점은 불가능합니다.
                        </p>
                      )}
                      {accessMode === "login" && (
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
                      )}
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
                    disabled={!canSubmit() || isScoring || checkingExisting}
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