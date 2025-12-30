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
import { Lock } from "lucide-react";

// 상위 40% 컷라인 점수 (35문제 기준)
const SAFE_ZONE_CUTOFF = 28; // 80점
const COMPETITIVE_ZONE_CUTOFF = 22; // 약 63점

interface BillboardEntry {
  rank: number;
  examNumber: string;
  score: number;
  isMe: boolean;
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
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [billboard, setBillboard] = useState<BillboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 실제 점수
  const userScore = scoreFromUrl ? parseInt(scoreFromUrl, 10) : null;
  const userZone = userScore !== null ? getZoneInfo(userScore) : null;
  const percentile = myRank !== null && totalParticipants > 0 
    ? Math.round((myRank / totalParticipants) * 100) 
    : null;

  // exam 파라미터에서 회차 추출 (예: "summit-1" -> 1)
  const getExamRound = (exam: string): number => {
    const match = exam.match(/summit-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

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

      // 2. 해당 과목/회차의 모든 채점 결과 조회 (익명 제외, 점수순 정렬)
      const { data: allResults } = await supabase
        .from("scoring_results")
        .select("user_id, correct_count")
        .eq("subject", subjectDbValue)
        .eq("exam_round", examRound)
        .neq("user_id", "00000000-0000-0000-0000-000000000000")
        .order("correct_count", { ascending: false });

      if (allResults && allResults.length > 0) {
        setTotalParticipants(allResults.length);

        // 내 등수 찾기
        if (user && userScore !== null) {
          const myIndex = allResults.findIndex(r => r.user_id === user.id);
          if (myIndex !== -1) {
            setMyRank(myIndex + 1);
          } else {
            // 내 결과가 없으면 점수 기준으로 예상 등수 계산
            const higherCount = allResults.filter(r => r.correct_count > userScore).length;
            setMyRank(higherCount + 1);
          }
        }

        // 3. 빌보드 데이터 생성 (상위 15명 또는 안정권 진입자)
        const topResults = allResults.slice(0, 15);
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
        setTotalParticipants(0);
        setMyRank(null);
        setBillboard([]);
      }

      setLoading(false);
    };

    if (!accessLoading) {
      fetchData();
    }
  }, [user, selectedSubject, selectedExam, userScore, hasAccess, accessLoading]);

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
                  {totalParticipants > 0 
                    ? `전체 응시자 ${totalParticipants}명 기준`
                    : "채점 결과를 불러오는 중..."}
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
                    {/* 실제 등수 표시 */}
                    {totalParticipants > 0 && myRank !== null ? (
                      <p className="text-sm text-muted-foreground">
                        {totalParticipants}명 중 <span className="font-medium text-foreground">{myRank}등</span> · 상위 {percentile}%
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground animate-pulse">
                        등수 계산 중...
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

              {/* 빌보드 차트 - 안정권 진입자 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-light">전국 빌보드</h2>
                    <p className="text-sm text-muted-foreground">상위 응시자 랭킹</p>
                  </div>
                  <span className="text-xs text-muted-foreground border border-border px-3 py-1">
                    TOP {billboard.length}
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
                    <p className="text-muted-foreground">아직 응시 데이터가 없습니다.</p>
                  </div>
                )}
              </div>

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
