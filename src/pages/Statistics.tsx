import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServiceAccess } from "@/hooks/useServiceAccess";
import { Lock, Users, TrendingUp, Trophy, BarChart3 } from "lucide-react";

// 상위 40% 컷라인 점수 (35문제 기준)
const SAFE_ZONE_CUTOFF = 28; // 80점
const COMPETITIVE_ZONE_CUTOFF = 22; // 약 63점

interface BillboardEntry {
  rank: number;
  examNumber: string;
  score: number;
  isMe: boolean;
}

interface OverallStats {
  totalParticipants: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  safeZoneCount: number;
  competitiveZoneCount: number;
  redLineCount: number;
}

interface WeekOption {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

const getZoneInfo = (score: number) => {
  if (score >= SAFE_ZONE_CUTOFF) {
    return {
      zone: "안정권",
      description: "상위 40% 이내",
      intensity: "high",
    };
  } else if (score >= COMPETITIVE_ZONE_CUTOFF) {
    return {
      zone: "경합권",
      description: "상위 40% ~ 70%",
      intensity: "medium",
    };
  } else {
    return {
      zone: "레드라인",
      description: "상위 70% 이하",
      intensity: "low",
    };
  }
};

// subject 파라미터를 DB 값으로 변환
const getSubjectDbValue = (subject: string): string => {
  if (subject === "financial") return "financial_accounting";
  if (subject === "tax") return "tax_law";
  return subject;
};

// 주차 옵션 생성 (데이터 기반)
const generateWeekOptions = (dates: Date[]): WeekOption[] => {
  if (dates.length === 0) return [];
  
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  
  // 첫 번째 날짜가 속한 주의 월요일 찾기
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  
  const weeks: WeekOption[] = [];
  let currentMonday = getMonday(firstDate);
  let weekNum = 1;
  
  while (currentMonday <= lastDate) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // 해당 주에 데이터가 있는지 확인
    const hasData = dates.some(d => d >= currentMonday && d <= weekEnd);
    
    if (hasData) {
      weeks.push({
        value: `week-${weekNum}`,
        label: `${weekNum}주차`,
        startDate: new Date(currentMonday),
        endDate: new Date(weekEnd),
      });
    }
    
    currentMonday.setDate(currentMonday.getDate() + 7);
    weekNum++;
  }
  
  return weeks;
};

const Statistics = () => {
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useServiceAccess();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL에서 채점 결과 읽기
  const scoreFromUrl = searchParams.get("score");
  const subjectFromUrl = searchParams.get("subject");
  const examFromUrl = searchParams.get("exam");
  
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFromUrl || "financial");
  const [selectedExam, setSelectedExam] = useState<string>(examFromUrl || "summit-1");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  
  // 실제 데이터 상태
  const [myExamNumber, setMyExamNumber] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [snuYsuParticipants, setSnuYsuParticipants] = useState<number>(0);
  const [billboard, setBillboard] = useState<BillboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 전체 통계 및 주차 옵션
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalParticipants: 0,
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    safeZoneCount: 0,
    competitiveZoneCount: 0,
    redLineCount: 0,
  });
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);

  // 실제 점수
  const userScore = scoreFromUrl ? parseInt(scoreFromUrl, 10) : null;
  const userZone = userScore !== null ? getZoneInfo(userScore) : null;
  const percentile = myRank !== null && snuYsuParticipants > 0 
    ? Math.round((myRank / snuYsuParticipants) * 100) 
    : null;

  // exam 파라미터에서 회차 추출 (예: "summit-1" -> 1)
  const getExamRound = (exam: string): number => {
    const match = exam.match(/summit-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  // 통계 공개 시간 확인
  const getStatsReleaseDate = (exam: string): Date => {
    if (exam === "summit-1") {
      return new Date("2025-01-21T18:00:00+09:00");
    }
    return new Date("2025-01-27T18:00:00+09:00");
  };

  const isStatsReleased = new Date() >= getStatsReleaseDate(selectedExam);
  const releaseTimeText = selectedExam === "summit-1" ? "1/21 오후 6시에 공개됩니다." : "1/27 오후 6시에 공개됩니다.";

  useEffect(() => {
    const fetchData = async () => {
      if (!hasAccess) return;
      
      setLoading(true);
      
      const subjectDbValue = getSubjectDbValue(selectedSubject);
      const examRound = getExamRound(selectedExam);

      // 1. 내 프로필 조회 (수험번호)
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("exam_number")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setMyExamNumber(profile.exam_number);
        }
      }

      // 2. 전체 응시자 데이터 조회 (모든 사용자)
      const { data: allScoringResults } = await supabase
        .from("scoring_results")
        .select("user_id, correct_count, created_at")
        .eq("subject", subjectDbValue)
        .eq("exam_round", examRound)
        .order("correct_count", { ascending: false });

      // 주차 옵션 생성
      if (allScoringResults && allScoringResults.length > 0) {
        const dates = allScoringResults.map(r => new Date(r.created_at));
        const weeks = generateWeekOptions(dates);
        setWeekOptions(weeks);
      } else {
        setWeekOptions([]);
      }

      // 주단위 필터 적용
      let filteredResults = allScoringResults || [];
      if (selectedWeek !== "all" && weekOptions.length > 0) {
        const selectedWeekOption = weekOptions.find(w => w.value === selectedWeek);
        if (selectedWeekOption) {
          filteredResults = filteredResults.filter(r => {
            const resultDate = new Date(r.created_at);
            return resultDate >= selectedWeekOption.startDate && resultDate <= selectedWeekOption.endDate;
          });
        }
      }

      // 전체 통계 계산
      if (filteredResults.length > 0) {
        const scores = filteredResults.map(r => r.correct_count);
        const safeCount = scores.filter(s => s >= SAFE_ZONE_CUTOFF).length;
        const competitiveCount = scores.filter(s => s >= COMPETITIVE_ZONE_CUTOFF && s < SAFE_ZONE_CUTOFF).length;
        const redLineCount = scores.filter(s => s < COMPETITIVE_ZONE_CUTOFF).length;
        
        setOverallStats({
          totalParticipants: filteredResults.length,
          avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          safeZoneCount: safeCount,
          competitiveZoneCount: competitiveCount,
          redLineCount: redLineCount,
        });
      } else {
        setOverallStats({
          totalParticipants: 0,
          avgScore: 0,
          maxScore: 0,
          minScore: 0,
          safeZoneCount: 0,
          competitiveZoneCount: 0,
          redLineCount: 0,
        });
      }

      // 3. 서울대/연세대 수험번호(WLP-S, WLP-Y)를 가진 사용자 조회
      const { data: snuYsuExamNumbers } = await supabase
        .from("exam_numbers")
        .select("id, exam_number, user_id")
        .or("exam_number.like.WLP-S%,exam_number.like.WLP-Y%")
        .not("user_id", "is", null);

      const snuYsuUserIds = (snuYsuExamNumbers || []).map(en => en.user_id).filter(Boolean);

      if (snuYsuUserIds.length === 0) {
        setSnuYsuParticipants(0);
        setMyRank(null);
        setBillboard([]);
        setLoading(false);
        return;
      }

      // 4. 서울대/연세대 채점 결과 (주차 필터 적용)
      let snuYsuResults = filteredResults.filter(r => snuYsuUserIds.includes(r.user_id));
      snuYsuResults = snuYsuResults.sort((a, b) => b.correct_count - a.correct_count);

      if (snuYsuResults.length > 0) {
        setSnuYsuParticipants(snuYsuResults.length);

        // 내 등수 찾기 (서울대/연세대 기준)
        if (user && userScore !== null) {
          const myIndex = snuYsuResults.findIndex(r => r.user_id === user.id);
          if (myIndex !== -1) {
            setMyRank(myIndex + 1);
          } else {
            const isSnuYsu = snuYsuUserIds.includes(user.id);
            if (isSnuYsu) {
              const higherCount = snuYsuResults.filter(r => r.correct_count > userScore).length;
              setMyRank(higherCount + 1);
            } else {
              setMyRank(null);
            }
          }
        }

        // 5. 빌보드 데이터 생성 (안정권 진입자만 - 28점 이상)
        const safeZoneResults = snuYsuResults.filter(r => r.correct_count >= SAFE_ZONE_CUTOFF);
        const topResults = safeZoneResults.slice(0, 15);
        const userIds = topResults.map(r => r.user_id);

        // profiles에서 exam_number 조회
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, exam_number")
          .in("id", userIds);

        const billboardData: BillboardEntry[] = topResults.map((r, i) => ({
          rank: i + 1,
          examNumber: profiles?.find(p => p.id === r.user_id)?.exam_number || "???",
          score: r.correct_count,
          isMe: user?.id === r.user_id,
        }));

        setBillboard(billboardData);
      } else {
        setSnuYsuParticipants(0);
        setMyRank(null);
        setBillboard([]);
      }

      setLoading(false);
    };

    if (!accessLoading) {
      fetchData();
    }
  }, [user, selectedSubject, selectedExam, selectedWeek, userScore, hasAccess, accessLoading]);

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
                  통계 서비스는 상품 구입자 또는 무료 배포본 수험번호 인증자만 이용할 수 있습니다.
                </p>
                <div className="space-y-3">
                  {!user && (
                    <Button 
                      onClick={() => navigate("/auth?redirect=/statistics")} 
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              {/* 헤더 */}
              <div className="text-center mb-12">
                <h1 className="text-3xl font-light mb-2">나의 통계</h1>
                <p className="text-muted-foreground text-sm">
                  서울대 · 연세대 응시자 기준
                </p>
              </div>

              {/* 과목/회차 선택 */}
              <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">과목</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">재무회계</SelectItem>
                      <SelectItem value="tax">세법</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">회차</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summit-1">SUMMIT 1회</SelectItem>
                      <SelectItem value="summit-2">SUMMIT 2회</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 내 점수 & 존 표시 */}
              {userScore !== null && userZone ? (
                <div className="border border-border rounded-none p-8 mb-8 bg-card">
                  <div className="text-center">
                    {/* 내 수험번호 표시 */}
                    {myExamNumber && (
                      <Badge variant="outline" className="font-mono text-sm mb-4">
                        {myExamNumber}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mb-2">내 점수</p>
                    <p className="text-5xl font-light mb-1">
                      <span className="text-foreground">{userScore}</span>
                      <span className="text-muted-foreground text-2xl"> / 35</span>
                    </p>
                    <div className="mt-6 mb-6">
                      <span className={`inline-block px-6 py-2 text-sm font-medium border ${
                        userZone.intensity === "high" 
                          ? "bg-foreground text-background border-foreground" 
                          : userZone.intensity === "medium"
                          ? "bg-muted text-foreground border-border"
                          : "bg-background text-muted-foreground border-muted-foreground"
                      }`}>
                        {userZone.zone}
                      </span>
                    </div>
                    {/* 실제 등수 표시 - 서울대/연세대 기준 */}
                    {snuYsuParticipants > 0 && myRank !== null ? (
                      <p className="text-sm text-muted-foreground">
                        서울대·연세대 {snuYsuParticipants}명 중 <span className="font-medium text-foreground">{myRank}등</span> · 상위 {percentile}%
                      </p>
                    ) : myRank === null && snuYsuParticipants > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        서울대·연세대 응시자 {snuYsuParticipants}명
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {releaseTimeText}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-none p-8 mb-8 bg-card">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      채점 후 통계를 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 전체 응시자 통계 */}
              {isStatsReleased && overallStats.totalParticipants > 0 ? (
                <div className="border border-border rounded-none p-6 mb-8 bg-card">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-light">전체 응시자 통계</h2>
                    {selectedWeek !== "all" && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {weekOptions.find(w => w.value === selectedWeek)?.label}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 주요 지표 */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted/30">
                      <Users className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-light">{overallStats.totalParticipants}</p>
                      <p className="text-xs text-muted-foreground">응시자</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30">
                      <TrendingUp className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-light">{overallStats.avgScore}</p>
                      <p className="text-xs text-muted-foreground">평균</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30">
                      <Trophy className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-light">{overallStats.maxScore}</p>
                      <p className="text-xs text-muted-foreground">최고</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30">
                      <p className="text-2xl font-light mt-6">{overallStats.minScore}</p>
                      <p className="text-xs text-muted-foreground">최저</p>
                    </div>
                  </div>
                  
                  {/* 존별 분포 바 */}
                  <div className="space-y-2">
                    <div className="flex h-3 w-full overflow-hidden bg-muted">
                      <div 
                        className="bg-foreground transition-all" 
                        style={{ width: `${(overallStats.safeZoneCount / overallStats.totalParticipants) * 100}%` }}
                      />
                      <div 
                        className="bg-muted-foreground/50 transition-all" 
                        style={{ width: `${(overallStats.competitiveZoneCount / overallStats.totalParticipants) * 100}%` }}
                      />
                      <div 
                        className="bg-muted-foreground/20 transition-all" 
                        style={{ width: `${(overallStats.redLineCount / overallStats.totalParticipants) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>안정권 {Math.round((overallStats.safeZoneCount / overallStats.totalParticipants) * 100)}%</span>
                      <span>경합권 {Math.round((overallStats.competitiveZoneCount / overallStats.totalParticipants) * 100)}%</span>
                      <span>레드라인 {Math.round((overallStats.redLineCount / overallStats.totalParticipants) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ) : !isStatsReleased ? (
                <div className="border border-border rounded-none p-6 mb-8 bg-card text-center">
                  <p className="text-muted-foreground">{releaseTimeText}</p>
                </div>
              ) : null}

              {/* 존 가이드 */}
              <div className="grid grid-cols-3 gap-px bg-border mb-10">
                <div className="bg-foreground text-background p-6 text-center">
                  <p className="font-medium text-sm mb-1">안정권</p>
                  <p className="text-xs opacity-70">상위 40%</p>
                  <p className="text-xs opacity-70 mt-1">{SAFE_ZONE_CUTOFF}점 이상</p>
                </div>
                <div className="bg-muted text-foreground p-6 text-center">
                  <p className="font-medium text-sm mb-1">경합권</p>
                  <p className="text-xs text-muted-foreground">상위 40~70%</p>
                  <p className="text-xs text-muted-foreground mt-1">{COMPETITIVE_ZONE_CUTOFF}~{SAFE_ZONE_CUTOFF - 1}점</p>
                </div>
                <div className="bg-background text-muted-foreground p-6 text-center border border-border">
                  <p className="font-medium text-sm mb-1">레드라인</p>
                  <p className="text-xs">상위 70% 이하</p>
                  <p className="text-xs mt-1">{COMPETITIVE_ZONE_CUTOFF - 1}점 이하</p>
                </div>
              </div>

              {/* 문항별 정답률 링크 */}
              <Link 
                to={`/question-analysis?subject=${selectedSubject}&exam=${selectedExam}`}
                className="block border border-border p-6 mb-10 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-light mb-1">문항별 정답률</h2>
                    <p className="text-sm text-muted-foreground">전체 응시자 기준 문항별 정답률 확인</p>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>

              {/* 빌보드 차트 - 안정권 진입자만 (공개 시간 이후) */}
              {isStatsReleased ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-light">전국 빌보드</h2>
                      <p className="text-sm text-muted-foreground">안정권 진입자 ({SAFE_ZONE_CUTOFF}점 이상)</p>
                    </div>
                    <span className="text-xs text-muted-foreground border border-border px-3 py-1">
                      {billboard.length}명
                    </span>
                  </div>

                  {loading ? (
                    <div className="border border-border p-8 text-center">
                      <p className="text-muted-foreground animate-pulse">불러오는 중...</p>
                    </div>
                  ) : billboard.length > 0 ? (
                    <div className="border border-border divide-y divide-border">
                      {billboard.map((entry) => (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-4 p-4 transition-colors ${
                            entry.isMe 
                              ? "bg-primary/10 border-l-2 border-l-primary" 
                              : "bg-card hover:bg-muted/50"
                          }`}
                        >
                          {/* 순위 */}
                          <div className="w-10 text-center">
                            <span className={`font-mono text-sm ${entry.isMe ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              {entry.rank}
                            </span>
                          </div>

                          {/* 수험번호 */}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className={`font-mono text-sm truncate ${entry.isMe ? "text-primary font-medium" : "text-foreground/80"}`}>
                              {entry.examNumber}
                            </p>
                            {entry.isMe && (
                              <Badge variant="secondary" className="text-xs">나</Badge>
                            )}
                          </div>

                          {/* 점수 */}
                          <div className="text-right">
                            <p className={`font-mono ${entry.isMe ? "text-primary" : "text-muted-foreground"}`}>
                              {entry.score}
                              <span className="text-xs text-muted-foreground">/35</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-border p-8 text-center">
                      <p className="text-muted-foreground">{releaseTimeText}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-border p-6 mb-8 text-center">
                  <h2 className="text-xl font-light mb-2">전국 빌보드</h2>
                  <p className="text-muted-foreground">{releaseTimeText}</p>
                </div>
              )}

              {/* 안내 */}
              <div className="border border-border p-6 text-center bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  통계는 실제 응시자 데이터를 기반으로 합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Statistics;
