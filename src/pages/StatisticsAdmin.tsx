import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, TrendingUp, Award, RefreshCw, Download, BookOpen, Hash, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ScoringResult {
  id: string;
  user_id: string;
  exam_name: string;
  exam_round: number;
  subject: string;
  correct_count: number;
  total_questions: number;
  score_percentage: number;
  created_at: string;
  exam_number_id: string | null;
}

interface ExamNumber {
  id: string;
  exam_number: string;
  batch_name: string;
  is_used: boolean;
}

interface ScoringWithExamNumber extends ScoringResult {
  exam_number?: string;
  university?: string;
}

interface ScoringAnswer {
  id: string;
  scoring_result_id: string;
  question_number: number;
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
}

const getUniversity = (examNumber: string | undefined): string => {
  if (!examNumber) return "기타";
  if (examNumber.startsWith("WLP-S")) return "서울대";
  if (examNumber.startsWith("WLP-Y")) return "연세대";
  if (examNumber.startsWith("WLS-")) return "유료";
  if (examNumber.startsWith("WLP-")) return "무료";
  return "기타";
};

const StatisticsAdmin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [scoringResults, setScoringResults] = useState<ScoringWithExamNumber[]>([]);
  const [examNumbers, setExamNumbers] = useState<ExamNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedRound, setSelectedRound] = useState("all");
  const [scoringAnswers, setScoringAnswers] = useState<ScoringAnswer[]>([]);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(data === true);
    };
    checkAdmin();
  }, []);

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    
    // 수험번호 목록 조회
    const { data: examNumbersData } = await supabase
      .from("exam_numbers")
      .select("*");
    
    setExamNumbers(examNumbersData || []);

    // 채점 결과 조회 (관리자 권한으로 모든 결과 조회 필요)
    const { data: scoringData } = await supabase
      .from("scoring_results")
      .select("*")
      .order("created_at", { ascending: false });

    // 개별 답안 조회
    const { data: answersData } = await supabase
      .from("scoring_answers")
      .select("*");

    setScoringAnswers(answersData || []);

    // 수험번호와 매핑
    const examNumberMap = new Map(
      (examNumbersData || []).map((en) => [en.id, en.exam_number])
    );

    const enrichedResults: ScoringWithExamNumber[] = (scoringData || []).map((result) => {
      const examNumber = result.exam_number_id 
        ? examNumberMap.get(result.exam_number_id) 
        : undefined;
      return {
        ...result,
        exam_number: examNumber,
        university: getUniversity(examNumber),
      };
    });

    setScoringResults(enrichedResults);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // 과목 목록
  const subjects = useMemo(() => {
    const subjectSet = new Set(scoringResults.map(r => r.subject));
    return Array.from(subjectSet).sort();
  }, [scoringResults]);

  // 시험 회차 목록
  const examRounds = useMemo(() => {
    const roundSet = new Set(scoringResults.map(r => r.exam_round));
    return Array.from(roundSet).sort((a, b) => a - b);
  }, [scoringResults]);

  // 필터된 결과
  const filteredResults = useMemo(() => {
    let results = scoringResults;
    
    // 대학별 필터
    if (selectedTab === "snu") results = results.filter(r => r.university === "서울대");
    else if (selectedTab === "ysu") results = results.filter(r => r.university === "연세대");
    else if (selectedTab === "paid") results = results.filter(r => r.university === "유료");
    else if (selectedTab === "free") results = results.filter(r => r.university === "무료" || r.university === "기타");
    
    // 과목별 필터
    if (selectedSubject !== "all") {
      results = results.filter(r => r.subject === selectedSubject);
    }
    
    // 회차별 필터
    if (selectedRound !== "all") {
      results = results.filter(r => r.exam_round === parseInt(selectedRound));
    }
    
    return results;
  }, [scoringResults, selectedTab, selectedSubject, selectedRound]);

  // 통계 계산
  const stats = useMemo(() => {
    if (filteredResults.length === 0) {
      return { count: 0, avg: 0, max: 0, min: 0 };
    }
    const scores = filteredResults.map(r => r.correct_count);
    return {
      count: filteredResults.length,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      max: Math.max(...scores),
      min: Math.min(...scores),
    };
  }, [filteredResults]);

  // 점수 분포 데이터
  const distributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    for (let i = 0; i <= 35; i += 5) {
      distribution[`${i}-${i + 4}`] = 0;
    }
    filteredResults.forEach((r) => {
      const score = r.correct_count;
      const bucket = Math.floor(score / 5) * 5;
      const key = `${bucket}-${bucket + 4}`;
      if (distribution[key] !== undefined) {
        distribution[key]++;
      }
    });
    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));
  }, [filteredResults]);

  // 대학별 통계
  const universityStats = useMemo(() => {
    const groups: Record<string, number[]> = {
      "서울대": [],
      "연세대": [],
      "유료": [],
      "무료": [],
      "기타": [],
    };
    scoringResults.forEach((r) => {
      const univ = r.university || "기타";
      if (groups[univ]) {
        groups[univ].push(r.correct_count);
      }
    });
    return Object.entries(groups).map(([name, scores]) => ({
      name,
      count: scores.length,
      avg: scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
        : 0,
    })).filter(g => g.count > 0);
  }, [scoringResults]);

  // 과목별 통계
  const subjectStats = useMemo(() => {
    const groups: Record<string, number[]> = {};
    filteredResults.forEach((r) => {
      if (!groups[r.subject]) groups[r.subject] = [];
      groups[r.subject].push(r.correct_count);
    });
    return Object.entries(groups).map(([name, scores]) => ({
      name,
      count: scores.length,
      avg: scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
        : 0,
      max: scores.length > 0 ? Math.max(...scores) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [filteredResults]);

  // 회차별 통계
  const roundStats = useMemo(() => {
    const groups: Record<number, number[]> = {};
    filteredResults.forEach((r) => {
      if (!groups[r.exam_round]) groups[r.exam_round] = [];
      groups[r.exam_round].push(r.correct_count);
    });
    return Object.entries(groups)
      .map(([round, scores]) => ({
        round: parseInt(round),
        count: scores.length,
        avg: scores.length > 0 
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
          : 0,
      }))
      .sort((a, b) => a.round - b.round);
  }, [filteredResults]);

  // 문항별 정답률 계산
  const questionStats = useMemo(() => {
    // 필터된 결과의 ID 목록
    const filteredResultIds = new Set(filteredResults.map(r => r.id));
    
    // 필터된 결과에 해당하는 답안만 필터링
    const relevantAnswers = scoringAnswers.filter(a => 
      filteredResultIds.has(a.scoring_result_id)
    );

    if (relevantAnswers.length === 0) return [];

    // 문항번호별 통계 계산
    const questionGroups: Record<number, { correct: number; total: number }> = {};
    
    relevantAnswers.forEach((answer) => {
      if (!questionGroups[answer.question_number]) {
        questionGroups[answer.question_number] = { correct: 0, total: 0 };
      }
      questionGroups[answer.question_number].total++;
      if (answer.is_correct) {
        questionGroups[answer.question_number].correct++;
      }
    });

    return Object.entries(questionGroups)
      .map(([qNum, stats]) => ({
        question: parseInt(qNum),
        correctRate: Math.round((stats.correct / stats.total) * 100),
        correct: stats.correct,
        total: stats.total,
      }))
      .sort((a, b) => a.question - b.question);
  }, [filteredResults, scoringAnswers]);

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const headers = ["수험번호", "대학구분", "과목", "정답수", "총문항", "정답률", "응시일"];
    const rows = filteredResults.map((r) => [
      r.exam_number || "-",
      r.university || "-",
      r.subject,
      r.correct_count,
      r.total_questions,
      `${r.score_percentage}%`,
      new Date(r.created_at).toLocaleDateString("ko-KR"),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `채점통계_${selectedTab}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">접근 권한이 없습니다</p>
            <Button className="mt-4" onClick={() => navigate("/")}>
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <AdminNav />
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">채점 통계 관리</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </div>

        {/* 대학별 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {universityStats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}명</div>
                <p className="text-xs text-muted-foreground">
                  평균 {stat.avg}점
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 필터 영역 */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* 과목 필터 */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="과목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 과목</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 회차 필터 */}
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="회차 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 회차</SelectItem>
                {examRounds.map((round) => (
                  <SelectItem key={round} value={round.toString()}>
                    {round}회차
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 탭 필터 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="snu">서울대</TabsTrigger>
            <TabsTrigger value="ysu">연세대</TabsTrigger>
            <TabsTrigger value="paid">유료</TabsTrigger>
            <TabsTrigger value="free">무료/기타</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">응시자 수</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.count}명</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avg}점</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">최고 점수</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.max}점</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">최저 점수</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.min}점</div>
                </CardContent>
              </Card>
            </div>

            {/* 점수 분포 차트 */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>점수 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {distributionData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(var(--primary) / ${0.4 + index * 0.08})`} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 과목별 통계 */}
            {subjectStats.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>과목별 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {subjectStats.map((stat) => (
                      <div key={stat.name} className="p-4 rounded-lg border bg-card">
                        <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                        <p className="text-xl font-bold mt-1">{stat.count}명</p>
                        <p className="text-xs text-muted-foreground">
                          평균 {stat.avg}점 / 최고 {stat.max}점
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avg" name="평균 점수" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="count" name="응시자 수" fill="hsl(var(--muted-foreground) / 0.5)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 회차별 분석 */}
            {roundStats.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>회차별 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {roundStats.map((stat) => (
                      <div key={stat.round} className="p-4 rounded-lg border bg-card">
                        <p className="text-sm font-medium text-muted-foreground">{stat.round}회차</p>
                        <p className="text-xl font-bold mt-1">{stat.count}명</p>
                        <p className="text-xs text-muted-foreground">평균 {stat.avg}점</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={roundStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="round" fontSize={12} tickFormatter={(v) => `${v}회`} />
                        <YAxis fontSize={12} />
                        <Tooltip labelFormatter={(v) => `${v}회차`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="avg" 
                          name="평균 점수" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="응시자 수" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 문항별 정답률 분석 */}
            {questionStats.length > 0 && (
              <Card className="mb-8">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    문항별 정답률 분석
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      총 {questionStats[0]?.total || 0}명 응시 기준
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const headers = ["문항번호", "정답자수", "응시자수", "정답률", "난이도"];
                        const rows = questionStats.map((q) => [
                          q.question,
                          q.correct,
                          q.total,
                          `${q.correctRate}%`,
                          q.correctRate >= 80 ? "쉬움" : q.correctRate >= 60 ? "보통" : q.correctRate >= 40 ? "어려움" : "킬러"
                        ]);
                        const csvContent = [
                          headers.join(","),
                          ...rows.map((row) => row.join(",")),
                        ].join("\n");
                        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        const subjectLabel = selectedSubject === "all" ? "전체과목" : selectedSubject;
                        const roundLabel = selectedRound === "all" ? "전체회차" : `${selectedRound}회차`;
                        link.download = `문항별정답률_${subjectLabel}_${roundLabel}_${new Date().toISOString().split("T")[0]}.csv`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 정답률 차트 */}
                  <div className="h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={questionStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="question" 
                          fontSize={11} 
                          tickFormatter={(v) => `${v}번`}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          fontSize={12} 
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, "정답률"]}
                          labelFormatter={(v) => `${v}번 문항`}
                        />
                        <Bar 
                          dataKey="correctRate" 
                          name="정답률"
                          radius={[4, 4, 0, 0]}
                        >
                          {questionStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.correctRate >= 80 
                                  ? "hsl(142, 76%, 36%)" 
                                  : entry.correctRate >= 60 
                                  ? "hsl(var(--primary))" 
                                  : entry.correctRate >= 40 
                                  ? "hsl(45, 93%, 47%)" 
                                  : "hsl(0, 84%, 60%)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 난이도별 문항 분류 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">쉬움 (80%↑)</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                        {questionStats.filter(q => q.correctRate >= 80).length}문항
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {questionStats.filter(q => q.correctRate >= 80).map(q => `${q.question}번`).join(", ") || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">보통 (60-79%)</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                        {questionStats.filter(q => q.correctRate >= 60 && q.correctRate < 80).length}문항
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {questionStats.filter(q => q.correctRate >= 60 && q.correctRate < 80).map(q => `${q.question}번`).join(", ") || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">어려움 (40-59%)</p>
                      <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                        {questionStats.filter(q => q.correctRate >= 40 && q.correctRate < 60).length}문항
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        {questionStats.filter(q => q.correctRate >= 40 && q.correctRate < 60).map(q => `${q.question}번`).join(", ") || "-"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">킬러 (40%↓)</p>
                      <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                        {questionStats.filter(q => q.correctRate < 40).length}문항
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {questionStats.filter(q => q.correctRate < 40).map(q => `${q.question}번`).join(", ") || "-"}
                      </p>
                    </div>
                  </div>

                  {/* 문항별 상세 테이블 */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">문항</TableHead>
                          <TableHead className="text-right">정답자</TableHead>
                          <TableHead className="text-right">응시자</TableHead>
                          <TableHead className="text-right">정답률</TableHead>
                          <TableHead>난이도</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questionStats.map((q) => (
                          <TableRow key={q.question}>
                            <TableCell className="font-medium">{q.question}번</TableCell>
                            <TableCell className="text-right">{q.correct}명</TableCell>
                            <TableCell className="text-right">{q.total}명</TableCell>
                            <TableCell className="text-right font-medium">{q.correctRate}%</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                q.correctRate >= 80 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : q.correctRate >= 60
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : q.correctRate >= 40
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {q.correctRate >= 80 ? "쉬움" : q.correctRate >= 60 ? "보통" : q.correctRate >= 40 ? "어려움" : "킬러"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 상세 데이터 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle>상세 데이터 ({filteredResults.length}건)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>수험번호</TableHead>
                        <TableHead>대학구분</TableHead>
                        <TableHead>과목</TableHead>
                        <TableHead className="text-right">정답수</TableHead>
                        <TableHead className="text-right">정답률</TableHead>
                        <TableHead>응시일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            데이터가 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResults.slice(0, 100).map((result) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-mono text-sm">
                              {result.exam_number || "-"}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.university === "서울대" 
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
                                  : result.university === "연세대"
                                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                  : result.university === "유료"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }`}>
                                {result.university}
                              </span>
                            </TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell className="text-right font-medium">
                              {result.correct_count}/{result.total_questions}
                            </TableCell>
                            <TableCell className="text-right">
                              {result.score_percentage}%
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString("ko-KR")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filteredResults.length > 100 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    최근 100건만 표시됩니다. 전체 데이터는 CSV로 다운로드하세요.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StatisticsAdmin;
