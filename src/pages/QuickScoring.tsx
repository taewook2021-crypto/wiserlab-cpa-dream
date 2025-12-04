import { useState } from "react";
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

const TOTAL_QUESTIONS = 35;

const QuickScoring = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [results, setResults] = useState<ScoringResult[] | null>(null);
  const [answers, setAnswers] = useState<AnswerGroup[]>(() => {
    // 35문제: 7개 그룹 (5문제씩)
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

  const handleAnswerChange = (index: number, value: string) => {
    const group = answers[index];
    const maxLength = group.endNum - group.startNum + 1;
    const numericValue = value.replace(/[^0-5]/g, "").slice(0, maxLength);
    setAnswers((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, value: numericValue } : g
      )
    );
    // 답안 변경시 결과 초기화
    if (results) setResults(null);
  };

  const handleSubmit = async () => {
    const subject = subjects.find((s) => s.id === selectedSubject);
    const exam = exams.find((e) => e.id === selectedExam);

    if (!subject || !exam) {
      toast.error("과목과 회차를 선택해주세요");
      return;
    }

    setIsScoring(true);

    try {
      // Fetch answer keys from database
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

  const correctCount = results?.filter((r) => r.isCorrect).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-3xl font-light mb-4">빠른 채점하기</h1>
                <p className="text-muted-foreground">
                  5문제씩 묶어서 답안을 입력하세요 (예: 54312)
                </p>
              </div>

              {/* 과목 및 회차 선택 */}
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

              {/* 답안 입력 및 결과 */}
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
                        {/* O/X 결과 표시 */}
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
                      onClick={() => navigate("/statistics")}
                    >
                      통계 확인하기
                    </Button>
                    <Button
                      className="flex-1 h-12"
                      onClick={() => navigate("/edge")}
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
                  <br />* 1~5번 문제의 답이 5, 4, 3, 1, 2번이면 "54312"를
                  입력합니다.
                  <br />* 답은 0~5 사이의 숫자만 입력 가능합니다. (0 = 미응답)
                </p>
              </div>

              {/* 채점 버튼 */}
              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-base font-normal"
                disabled={!isFormValid || isScoring}
              >
                {isScoring ? "채점 중..." : "채점하기"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default QuickScoring;