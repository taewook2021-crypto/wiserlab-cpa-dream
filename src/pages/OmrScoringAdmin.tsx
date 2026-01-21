import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
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
import { ScanLine, CheckCircle, XCircle, RotateCcw } from "lucide-react";

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

const subjects = [
  { id: "financial", name: "재무회계", dbValue: "financial_accounting" },
  { id: "tax", name: "세법", dbValue: "tax_law" },
];

const exams = [
  { id: "summit-1", name: "SUMMIT 1회", round: 1 },
  { id: "summit-2", name: "SUMMIT 2회", round: 2 },
];

const getQuestionCount = (subjectId: string) => {
  return subjectId === "tax" ? 40 : 35;
};

const createAnswerGroups = (totalQuestions: number): AnswerGroup[] => {
  const groups: AnswerGroup[] = [];
  const groupCount = Math.ceil(totalQuestions / 5);
  for (let i = 0; i < groupCount; i++) {
    const startNum = i * 5 + 1;
    const endNum = Math.min(i * 5 + 5, totalQuestions);
    groups.push({
      startNum,
      endNum,
      value: "",
    });
  }
  return groups;
};

const OmrScoringAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const [examNumber, setExamNumber] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [results, setResults] = useState<ScoringResult[] | null>(null);
  const [answers, setAnswers] = useState<AnswerGroup[]>(() => createAnswerGroups(35));
  const [foundUser, setFoundUser] = useState<{ id: string; email: string } | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      setIsAdmin(data === true);
      setIsCheckingAdmin(false);
    };

    checkAdmin();
  }, [user]);

  // 수험번호로 사용자 찾기
  const searchUserByExamNumber = async () => {
    if (!examNumber.trim()) {
      toast.error("수험번호를 입력해주세요");
      return;
    }

    setSearchingUser(true);
    setFoundUser(null);

    // profiles 테이블에서 수험번호로 검색
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("exam_number", examNumber.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("Search error:", error);
      toast.error("사용자 검색 중 오류가 발생했습니다");
    } else if (profile) {
      setFoundUser({ id: profile.id, email: profile.email || "이메일 없음" });
      toast.success("사용자를 찾았습니다");
    } else {
      // exam_numbers 테이블에서도 검색
      const { data: examNumberData, error: examError } = await supabase
        .from("exam_numbers")
        .select("user_id")
        .eq("exam_number", examNumber.trim().toUpperCase())
        .eq("is_used", true)
        .maybeSingle();

      if (examError) {
        console.error("Exam number search error:", examError);
        toast.error("검색 중 오류가 발생했습니다");
      } else if (examNumberData?.user_id) {
        // user_id로 profiles에서 이메일 가져오기
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", examNumberData.user_id)
          .maybeSingle();

        if (userProfile) {
          setFoundUser({ id: userProfile.id, email: userProfile.email || "이메일 없음" });
          toast.success("사용자를 찾았습니다");
        } else {
          toast.error("해당 수험번호의 사용자를 찾을 수 없습니다");
        }
      } else {
        toast.error("해당 수험번호의 사용자를 찾을 수 없습니다");
      }
    }

    setSearchingUser(false);
  };

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

    if (numericValue.length === maxLength && index < answers.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!foundUser) {
      toast.error("먼저 수험번호로 사용자를 검색해주세요");
      return;
    }

    const subject = subjects.find((s) => s.id === selectedSubject);
    const exam = exams.find((e) => e.id === selectedExam);

    if (!subject || !exam) {
      toast.error("과목과 회차를 선택해주세요");
      return;
    }

    setIsScoring(true);

    try {
      // 기존 결과 확인
      const { data: existingResult } = await supabase
        .from("scoring_results")
        .select("id")
        .eq("user_id", foundUser.id)
        .eq("subject", subject.dbValue)
        .eq("exam_round", exam.round)
        .maybeSingle();

      if (existingResult) {
        toast.error("해당 사용자는 이미 이 시험을 채점한 기록이 있습니다");
        setIsScoring(false);
        return;
      }

      // 정답표 가져오기
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
        setIsScoring(false);
        return;
      }

      // 사용자 답안 펼치기
      const userAnswers: number[] = [];
      answers.forEach((group) => {
        for (const char of group.value) {
          userAnswers.push(parseInt(char));
        }
      });

      // 채점
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

      // 결과 저장
      const { data: insertedResult, error: saveError } = await supabase
        .from("scoring_results")
        .insert({
          user_id: foundUser.id,
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
        toast.error("결과 저장 중 오류가 발생했습니다");
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

        toast.success(`채점 완료 및 저장! ${correctCount}/${scoringResults.length}문제 정답`);
      }
    } catch (error) {
      console.error("Scoring error:", error);
      toast.error("채점 중 오류가 발생했습니다");
    } finally {
      setIsScoring(false);
    }
  };

  const resetForm = () => {
    setExamNumber("");
    setFoundUser(null);
    setResults(null);
    setAnswers(createAnswerGroups(getQuestionCount(selectedSubject || "financial")));
  };

  const isFormValid =
    foundUser &&
    selectedSubject &&
    selectedExam &&
    answers.every((group) => {
      const expectedLength = group.endNum - group.startNum + 1;
      return group.value.length === expectedLength;
    });

  const correctCount = results?.filter((r) => r.isCorrect).length || 0;

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <p className="text-muted-foreground">권한 확인 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-6 text-center">
            <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6">
          <AdminNav />

          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-light flex items-center gap-3">
                <ScanLine className="w-6 h-6" />
                OMR 빠른채점
              </h1>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </div>

            {/* 수험번호 검색 */}
            <div className="bg-muted/50 border border-border rounded-lg p-6 mb-8">
              <Label className="mb-3 block font-medium">수험번호로 사용자 찾기</Label>
              <div className="flex gap-3">
                <Input
                  value={examNumber}
                  onChange={(e) => setExamNumber(e.target.value.toUpperCase())}
                  placeholder="WLS-XXXX"
                  className="font-mono text-center tracking-wider max-w-[200px]"
                  maxLength={8}
                />
                <Button
                  onClick={searchUserByExamNumber}
                  disabled={searchingUser || !examNumber.trim()}
                  variant="outline"
                >
                  {searchingUser ? "검색 중..." : "검색"}
                </Button>
              </div>
              {foundUser && (
                <div className="mt-4 p-4 bg-background border border-border rounded-lg">
                  <p className="text-sm">
                    <span className="text-muted-foreground">사용자: </span>
                    <span className="font-medium">{foundUser.email}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 과목/회차 선택 */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label>과목 선택</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={(v) => {
                    setSelectedSubject(v);
                    setResults(null);
                    setAnswers(createAnswerGroups(getQuestionCount(v)));
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
                    setAnswers(createAnswerGroups(getQuestionCount(selectedSubject)));
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

            {/* 답안 입력 */}
            {selectedSubject && selectedExam && (
              <div className="space-y-6">
                <div className="bg-muted/30 border border-border rounded-lg p-6">
                  <Label className="mb-4 block font-medium">
                    OMR 답안 입력 (5문제씩 입력)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {answers.map((group, index) => (
                      <div key={index} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {group.startNum}-{group.endNum}번
                        </Label>
                        <Input
                          ref={(el) => (inputRefs.current[index] = el)}
                          value={group.value}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          placeholder="12345"
                          className="font-mono text-center tracking-widest"
                          maxLength={group.endNum - group.startNum + 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 채점 결과 */}
                {results && (
                  <div className="bg-muted/30 border border-border rounded-lg p-6">
                    <div className="text-center mb-6">
                      <p className="text-3xl font-light mb-2">
                        <span className="text-primary font-medium">{correctCount}</span>
                        <span className="text-muted-foreground"> / {results.length}</span>
                      </p>
                      <p className="text-muted-foreground">
                        정답률 {Math.round((correctCount / results.length) * 100)}%
                      </p>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                      {results.map((r) => (
                        <div
                          key={r.questionNumber}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border ${
                            r.isCorrect
                              ? "bg-primary/10 border-primary/30"
                              : "bg-destructive/10 border-destructive/30"
                          }`}
                        >
                          <span className="text-xs text-muted-foreground mb-1">
                            {r.questionNumber}
                          </span>
                          {r.isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 채점 버튼 */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isScoring || !!results}
                  className="w-full h-12"
                >
                  {isScoring ? "채점 중..." : results ? "채점 완료" : "채점하기"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OmrScoringAdmin;
