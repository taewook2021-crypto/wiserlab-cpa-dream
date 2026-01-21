import { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ScanLine, CheckCircle, XCircle, RotateCcw, Save, Trophy, Download, Trash2 } from "lucide-react";

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

interface SavedResult {
  id: string;
  participant_number: number;
  subject: string;
  exam_round: number;
  correct_count: number;
  total_questions: number;
  score_percentage: number;
  created_at: string;
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

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<ScoringResult[] | null>(null);
  const [answers, setAnswers] = useState<AnswerGroup[]>(() => createAnswerGroups(35));

  // 저장된 결과 목록
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterRound, setFilterRound] = useState<string>("all");

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

  // 저장된 결과 불러오기
  const fetchSavedResults = async () => {
    const { data, error } = await supabase
      .from("omr_scoring_results")
      .select("*")
      .order("participant_number", { ascending: true });

    if (error) {
      console.error("Error fetching saved results:", error);
      return;
    }

    setSavedResults(data || []);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSavedResults();
    }
  }, [isAdmin]);

  // 필터된 결과
  const filteredResults = useMemo(() => {
    return savedResults.filter((r) => {
      const subjectMatch = filterSubject === "all" || r.subject === filterSubject;
      const roundMatch = filterRound === "all" || r.exam_round === parseInt(filterRound);
      return subjectMatch && roundMatch;
    });
  }, [savedResults, filterSubject, filterRound]);

  // 등수 계산 (같은 과목/회차 내에서)
  const resultsWithRank = useMemo(() => {
    const sorted = [...filteredResults].sort((a, b) => b.score_percentage - a.score_percentage);
    return sorted.map((r, index) => ({
      ...r,
      rank: index + 1,
    }));
  }, [filteredResults]);

  // 통계 계산
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return null;
    const scores = filteredResults.map((r) => r.score_percentage);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { count: filteredResults.length, avg, max, min };
  }, [filteredResults]);

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
    const subject = subjects.find((s) => s.id === selectedSubject);
    const exam = exams.find((e) => e.id === selectedExam);

    if (!subject || !exam) {
      toast.error("과목과 회차를 선택해주세요");
      return;
    }

    setIsScoring(true);

    try {
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
      toast.success(`채점 완료! ${correctCount}/${scoringResults.length}문제 정답`);
    } catch (error) {
      console.error("Scoring error:", error);
      toast.error("채점 중 오류가 발생했습니다");
    } finally {
      setIsScoring(false);
    }
  };

  const handleSaveResult = async () => {
    if (!results) return;

    const subject = subjects.find((s) => s.id === selectedSubject);
    const exam = exams.find((e) => e.id === selectedExam);

    if (!subject || !exam) return;

    setIsSaving(true);

    try {
      // 다음 참가자 번호 가져오기
      const { data: existingResults } = await supabase
        .from("omr_scoring_results")
        .select("participant_number")
        .eq("subject", subject.dbValue)
        .eq("exam_round", exam.round)
        .order("participant_number", { ascending: false })
        .limit(1);

      const nextNumber = existingResults && existingResults.length > 0 
        ? existingResults[0].participant_number + 1 
        : 1;

      const correctCount = results.filter((r) => r.isCorrect).length;
      const totalQuestions = results.length;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

      const { error } = await supabase.from("omr_scoring_results").insert({
        participant_number: nextNumber,
        subject: subject.dbValue,
        exam_round: exam.round,
        correct_count: correctCount,
        total_questions: totalQuestions,
        score_percentage: scorePercentage,
      });

      if (error) throw error;

      toast.success(`응시자 #${nextNumber} 결과가 저장되었습니다`);
      fetchSavedResults();
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm("이 결과를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("omr_scoring_results")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("삭제되었습니다");
      fetchSavedResults();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleDownloadCSV = () => {
    if (resultsWithRank.length === 0) return;

    const headers = ["등수", "응시자번호", "과목", "회차", "정답수", "총문항", "정답률(%)"];
    const subjectNames: Record<string, string> = {
      financial_accounting: "재무회계",
      tax_law: "세법",
    };

    const rows = resultsWithRank.map((r) => [
      r.rank,
      r.participant_number,
      subjectNames[r.subject] || r.subject,
      r.exam_round,
      r.correct_count,
      r.total_questions,
      r.score_percentage,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omr_ranking_${filterSubject}_${filterRound}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setResults(null);
    setAnswers(createAnswerGroups(getQuestionCount(selectedSubject || "financial")));
  };

  const isFormValid =
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

          <div className="max-w-5xl mx-auto">
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
              <div className="space-y-6 mb-12">
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

                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 mb-6">
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

                    {/* 저장 버튼 */}
                    <Button
                      onClick={handleSaveResult}
                      disabled={isSaving}
                      className="w-full"
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "저장 중..." : "결과 저장하기"}
                    </Button>
                  </div>
                )}

                {/* 채점 버튼 */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isScoring}
                  className="w-full h-12"
                >
                  {isScoring ? "채점 중..." : results ? "다시 채점하기" : "채점하기"}
                </Button>
              </div>
            )}

            {/* 저장된 결과 및 등수 */}
            <div className="border-t border-border pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light flex items-center gap-3">
                  <Trophy className="w-5 h-5" />
                  응시자 등수 현황
                </h2>
                <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={resultsWithRank.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV 다운로드
                </Button>
              </div>

              {/* 필터 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="과목 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 과목</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.dbValue}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterRound} onValueChange={setFilterRound}>
                  <SelectTrigger>
                    <SelectValue placeholder="회차 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 회차</SelectItem>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.round.toString()}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 통계 */}
              {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                    <p className="text-2xl font-light">{stats.count}</p>
                    <p className="text-xs text-muted-foreground">응시자 수</p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                    <p className="text-2xl font-light">{stats.avg.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">평균</p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                    <p className="text-2xl font-light">{stats.max}%</p>
                    <p className="text-xs text-muted-foreground">최고점</p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                    <p className="text-2xl font-light">{stats.min}%</p>
                    <p className="text-xs text-muted-foreground">최저점</p>
                  </div>
                </div>
              )}

              {/* 결과 테이블 */}
              {resultsWithRank.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">등수</TableHead>
                        <TableHead className="w-24 text-center">응시자번호</TableHead>
                        <TableHead className="text-center">과목</TableHead>
                        <TableHead className="w-20 text-center">회차</TableHead>
                        <TableHead className="w-24 text-center">정답</TableHead>
                        <TableHead className="w-24 text-center">정답률</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultsWithRank.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-center font-medium">
                            {r.rank <= 3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                r.rank === 1 ? "bg-yellow-500/20 text-yellow-600" :
                                r.rank === 2 ? "bg-gray-400/20 text-gray-600" :
                                "bg-orange-500/20 text-orange-600"
                              }`}>
                                {r.rank}
                              </span>
                            ) : r.rank}
                          </TableCell>
                          <TableCell className="text-center">#{r.participant_number}</TableCell>
                          <TableCell className="text-center">
                            {r.subject === "financial_accounting" ? "재무회계" : "세법"}
                          </TableCell>
                          <TableCell className="text-center">{r.exam_round}회</TableCell>
                          <TableCell className="text-center">{r.correct_count}/{r.total_questions}</TableCell>
                          <TableCell className="text-center">{r.score_percentage}%</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteResult(r.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  저장된 채점 결과가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OmrScoringAdmin;
