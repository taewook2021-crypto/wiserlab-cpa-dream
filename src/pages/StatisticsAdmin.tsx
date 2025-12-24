import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, TrendingUp, Award, RefreshCw, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

  // 필터된 결과
  const filteredResults = useMemo(() => {
    if (selectedTab === "all") return scoringResults;
    if (selectedTab === "snu") return scoringResults.filter(r => r.university === "서울대");
    if (selectedTab === "ysu") return scoringResults.filter(r => r.university === "연세대");
    if (selectedTab === "paid") return scoringResults.filter(r => r.university === "유료");
    if (selectedTab === "free") return scoringResults.filter(r => r.university === "무료" || r.university === "기타");
    return scoringResults;
  }, [scoringResults, selectedTab]);

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
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">채점 통계 관리</h1>
          </div>
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
