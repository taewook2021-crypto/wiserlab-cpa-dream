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

// 기본 컷오프 (DB에서 값이 없을 때 사용)
const DEFAULT_CUTOFFS: Record<string, { safe: number; competitive: number }> = {
  financial_accounting: { safe: 23, competitive: 14 },
  tax_law: { safe: 20, competitive: 16 },
};

const getDefaultCutoffs = (subject: string) => {
  return DEFAULT_CUTOFFS[subject] || { safe: 23, competitive: 14 };
};

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

const getZoneInfo = (score: number, safeCutoff: number, competitiveCutoff: number, isReleased: boolean) => {
  // 지표가 공개되지 않은 경우 존 정보를 숨김
  if (!isReleased) {
    return {
      zone: "채점 완료",
      description: "통계 분석 중",
      intensity: "hidden",
    };
  }
  
  if (score >= safeCutoff) {
    return {
      zone: "안정권",
      description: "상위 40% 이내",
      intensity: "high",
    };
  } else if (score >= competitiveCutoff) {
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

// 과목별 총 문제 수
const getTotalQuestions = (subject: string): number => {
  return subject === "tax" ? 40 : 35;
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
  
  // 실제 데이터 상태
  const [myExamNumber, setMyExamNumber] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [snuYsuParticipants, setSnuYsuParticipants] = useState<number>(0);
  const [billboard, setBillboard] = useState<BillboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState<number | null>(scoreFromUrl ? parseInt(scoreFromUrl, 10) : null);
  
  // 통계 공개 여부 (DB에서 조회)
  const [isZoneMetricsReleased, setIsZoneMetricsReleased] = useState(false);
  
  // 컷오프 (DB에서 조회)
  const [cutoffs, setCutoffs] = useState<{ safe: number; competitive: number }>({ safe: 23, competitive: 14 });
  
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

  // exam 파라미터에서 회차 추출 (예: "summit-1" -> 1)
  const getExamRound = (exam: string): number => {
    const match = exam.match(/summit-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  // 현재 선택된 과목/회차
  const subjectDbValue = getSubjectDbValue(selectedSubject);
  const examRound = getExamRound(selectedExam);

  // 유저 존 계산
  const userZone = userScore !== null 
    ? getZoneInfo(userScore, cutoffs.safe, cutoffs.competitive, isZoneMetricsReleased) 
    : null;
  const percentile = myRank !== null && snuYsuParticipants > 0 
    ? Math.round((myRank / snuYsuParticipants) * 100) 
    : null;

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

      // 공개 설정 및 컷오프 조회
      const { data: settingsData } = await supabase
        .from("statistics_settings")
        .select("is_released, safe_cutoff, competitive_cutoff")
        .eq("subject", subjectDbValue)
        .eq("exam_round", examRound)
        .maybeSingle();
      
      setIsZoneMetricsReleased(settingsData?.is_released ?? false);
      
      // DB에서 컷오프 가져오기, 없으면 기본값 사용
      const defaultCutoffs = getDefaultCutoffs(subjectDbValue);
      const fetchedCutoffs = {
        safe: settingsData?.safe_cutoff ?? defaultCutoffs.safe,
        competitive: settingsData?.competitive_cutoff ?? defaultCutoffs.competitive,
      };
      setCutoffs(fetchedCutoffs);

      // 1. 내 프로필 및 채점 결과 조회
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("exam_number")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setMyExamNumber(profile.exam_number);
        }

        // 내 채점 결과 조회 (선택된 과목/회차)
        const { data: myResult } = await supabase
          .from("scoring_results")
          .select("correct_count")
          .eq("user_id", user.id)
          .eq("subject", subjectDbValue)
          .eq("exam_round", examRound)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (myResult) {
          setUserScore(myResult.correct_count);
        } else {
          setUserScore(null);
        }
      } else {
        setUserScore(null);
      }

      // 2. OMR 채점 결과 조회 (관리자가 입력한 통합 데이터)
      const { data: omrResults } = await supabase
        .from("omr_scoring_results")
        .select("participant_number, correct_count")
        .eq("subject", subjectDbValue)
        .eq("exam_round", examRound)
        .order("correct_count", { ascending: false });

      if (omrResults && omrResults.length > 0) {
        const scores = omrResults.map(r => r.correct_count);
        const safeCount = scores.filter(s => s >= fetchedCutoffs.safe).length;
        const competitiveCount = scores.filter(s => s >= fetchedCutoffs.competitive && s < fetchedCutoffs.safe).length;
        const redLineCount = scores.filter(s => s < fetchedCutoffs.competitive).length;
        
        setOverallStats({
          totalParticipants: omrResults.length,
          avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
          maxScore: Math.max(...scores),
          minScore: Math.min(...scores),
          safeZoneCount: safeCount,
          competitiveZoneCount: competitiveCount,
          redLineCount: redLineCount,
        });

        // 전체 응시자 수 설정
        setSnuYsuParticipants(omrResults.length);

        // 내 등수 계산 (내 점수보다 높은 사람 수 + 1)
        if (userScore !== null) {
          const higherCount = omrResults.filter(r => r.correct_count > userScore).length;
          setMyRank(higherCount + 1);
        } else {
          setMyRank(null);
        }

        // 빌보드 데이터 생성 (안정권 진입자만)
        const safeZoneResults = omrResults.filter(r => r.correct_count >= fetchedCutoffs.safe);
        const topResults = safeZoneResults.slice(0, 15);

        const billboardData: BillboardEntry[] = topResults.map((r, i) => ({
          rank: i + 1,
          examNumber: `응시자 ${r.participant_number}`,
          score: r.correct_count,
          isMe: false, // OMR 데이터에는 user_id 매핑 없음
        }));

        setBillboard(billboardData);
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
        setSnuYsuParticipants(0);
        setMyRank(null);
        setBillboard([]);
      }

      setLoading(false);
    };

    if (!accessLoading) {
      fetchData();
    }
  }, [user, selectedSubject, selectedExam, hasAccess, accessLoading, subjectDbValue, examRound]);

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
                      <span className="text-muted-foreground text-2xl"> / {getTotalQuestions(selectedSubject)}</span>
                    </p>
                    <div className="mt-6 mb-6">
                      <span className={`inline-block px-6 py-2 text-sm font-medium border ${
                        userZone.intensity === "hidden"
                          ? "bg-muted text-foreground border-border"
                          : userZone.intensity === "high" 
                          ? "bg-foreground text-background border-foreground" 
                          : userZone.intensity === "medium"
                          ? "bg-muted text-foreground border-border"
                          : "bg-background text-muted-foreground border-muted-foreground"
                      }`}>
                        {userZone.zone}
                      </span>
                    </div>
                    {/* 등수 표시 - 지표 공개 시에만 */}
                    {isZoneMetricsReleased && snuYsuParticipants > 0 && myRank !== null ? (
                      <p className="text-sm text-muted-foreground">
                        서울대·연세대 {snuYsuParticipants}명 중 <span className="font-medium text-foreground">{myRank}등</span> · 상위 {percentile}%
                      </p>
                    ) : isZoneMetricsReleased && myRank === null && snuYsuParticipants > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        서울대·연세대 응시자 {snuYsuParticipants}명
                      </p>
                    ) : !isZoneMetricsReleased ? (
                      <p className="text-sm text-muted-foreground">
                        상세 통계는 추후 공개됩니다
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {releaseTimeText}
                      </p>
                    )}
                  </div>
                </div>
              ) : loading ? (
                <div className="border border-border rounded-none p-8 mb-8 bg-card">
                  <div className="text-center">
                    <p className="text-muted-foreground animate-pulse">
                      점수 조회 중...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-none p-8 mb-8 bg-card">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      아직 채점하지 않았습니다.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/quick-scoring?subject=${selectedSubject}&exam=${selectedExam}`)}
                      className="mt-4"
                    >
                      채점하러 가기
                    </Button>
                  </div>
                </div>
              )}


              {/* 존 가이드 - 지표 공개 시에만 표시 */}
              {isZoneMetricsReleased && (
                <div className="grid grid-cols-3 gap-px bg-border mb-10">
                  <div className="bg-foreground text-background p-6 text-center">
                    <p className="font-medium text-sm mb-2">안정권</p>
                    <p className="text-lg font-light">{cutoffs.safe}점 이상</p>
                  </div>
                  <div className="bg-muted text-foreground p-6 text-center">
                    <p className="font-medium text-sm mb-2">경합권</p>
                    <p className="text-lg font-light">{cutoffs.competitive}~{cutoffs.safe - 1}점</p>
                  </div>
                  <div className="bg-background text-muted-foreground p-6 text-center border border-border">
                    <p className="font-medium text-sm mb-2">레드라인</p>
                    <p className="text-lg font-light">{cutoffs.competitive - 1}점 이하</p>
                  </div>
                </div>
              )}


              {/* 빌보드 차트 - 지표 공개 후에만 표시 */}
              {isZoneMetricsReleased && isStatsReleased ? (
                <div className="mb-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-light">전국 빌보드</h2>
                    <p className="text-sm text-muted-foreground">안정권 진입자 ({cutoffs.safe}점 이상)</p>
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
                              <span className="text-xs text-muted-foreground">/{getTotalQuestions(selectedSubject)}</span>
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
              ) : isZoneMetricsReleased ? (
                <div className="border border-border p-6 mb-8 text-center">
                  <h2 className="text-xl font-light mb-2">전국 빌보드</h2>
                  <p className="text-muted-foreground">{releaseTimeText}</p>
                </div>
              ) : null}

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Statistics;
