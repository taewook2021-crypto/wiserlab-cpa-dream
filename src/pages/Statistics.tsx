import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Mock data - 150명 기준 통계
const TOTAL_PARTICIPANTS = 150;

// 상위 40% 컷라인 점수 (35문제 기준)
const SAFE_ZONE_CUTOFF = 28; // 80점
const COMPETITIVE_ZONE_CUTOFF = 22; // 약 63점

// Mock billboard data - 전국 응시자 (서울대/연대 제외)
const mockBillboard = [
  { rank: 1, nickname: "재무왕", score: 35 },
  { rank: 2, nickname: "회계마스터", score: 34 },
  { rank: 3, nickname: "CPA예비생", score: 34 },
  { rank: 4, nickname: "합격기원", score: 33 },
  { rank: 5, nickname: "열공중", score: 33 },
  { rank: 6, nickname: "막차탑승", score: 32 },
  { rank: 7, nickname: "파이팅", score: 32 },
  { rank: 8, nickname: "새벽공부", score: 31 },
  { rank: 9, nickname: "합격예정", score: 31 },
  { rank: 10, nickname: "끝까지", score: 30 },
  { rank: 11, nickname: "도전자", score: 30 },
  { rank: 12, nickname: "열정맨", score: 29 },
  { rank: 13, nickname: "노력파", score: 29 },
  { rank: 14, nickname: "성실이", score: 28 },
  { rank: 15, nickname: "꾸준히", score: 28 },
];

// Mock 문항별 정답률 데이터
const generateMockQuestionStats = () => {
  return Array.from({ length: 35 }, (_, i) => ({
    questionNumber: i + 1,
    correctRate: Math.round(30 + Math.random() * 60), // 30% ~ 90%
  }));
};

const mockQuestionStats = generateMockQuestionStats();

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

// 점수 기반 예상 등수 계산 (35문제 기준)
const estimateRank = (score: number): number => {
  // 점수별 예상 상위 퍼센트 (대략적인 정규분포 가정)
  const scoreToPercentile: Record<number, number> = {
    35: 1, 34: 3, 33: 6, 32: 10, 31: 15, 30: 21,
    29: 28, 28: 36, 27: 44, 26: 52, 25: 60, 24: 67,
    23: 73, 22: 78, 21: 82, 20: 86, 19: 89, 18: 92,
  };
  const percentile = scoreToPercentile[score] ?? Math.min(95, 100 - score * 2);
  return Math.max(1, Math.round((percentile / 100) * TOTAL_PARTICIPANTS));
};

// 정답률에 따른 색상
const getRateColor = (rate: number) => {
  if (rate >= 70) return "bg-green-500";
  if (rate >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const Statistics = () => {
  const [searchParams] = useSearchParams();
  
  // URL에서 채점 결과 읽기
  const scoreFromUrl = searchParams.get("score");
  const subjectFromUrl = searchParams.get("subject");
  const examFromUrl = searchParams.get("exam");
  
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFromUrl || "financial");
  const [selectedExam, setSelectedExam] = useState<string>(examFromUrl || "summit-1");
  
  // 실제 점수 또는 기본값
  const userScore = scoreFromUrl ? parseInt(scoreFromUrl, 10) : null;
  const userRank = userScore !== null ? estimateRank(userScore) : null;

  const userZone = userScore !== null ? getZoneInfo(userScore) : null;
  const percentile = userRank !== null ? Math.round((userRank / TOTAL_PARTICIPANTS) * 100) : null;

  // 정답률 낮은 순으로 정렬 (어려운 문제)
  const sortedByDifficulty = [...mockQuestionStats].sort((a, b) => a.correctRate - b.correctRate);
  const hardestQuestions = sortedByDifficulty.slice(0, 5);
  const easiestQuestions = sortedByDifficulty.slice(-5).reverse();

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
                  서울대학교 · 연세대학교 고시반 {TOTAL_PARTICIPANTS}명 기준
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
              {userScore !== null && userZone && userRank !== null ? (
                <div className="border border-border rounded-none p-8 mb-8 bg-card">
                  <div className="text-center">
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
                    <p className="text-sm text-muted-foreground">
                      {TOTAL_PARTICIPANTS}명 중 <span className="font-medium text-foreground">{userRank}등</span> · 상위 {percentile}%
                    </p>
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
              <div className="grid grid-cols-3 gap-px bg-border mb-12">
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

              {/* 문항별 정답률 분석 */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-xl font-light mb-1">문항별 정답률</h2>
                  <p className="text-sm text-muted-foreground">전체 응시자 기준 문항별 정답률</p>
                </div>

                {/* 어려운 문제 TOP 5 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">🔴 어려운 문제 TOP 5</h3>
                  <div className="border border-border divide-y divide-border">
                    {hardestQuestions.map((q) => (
                      <div key={q.questionNumber} className="flex items-center gap-4 p-3 bg-card">
                        <span className="w-12 text-sm text-muted-foreground">{q.questionNumber}번</span>
                        <div className="flex-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getRateColor(q.correctRate)}`}
                              style={{ width: `${q.correctRate}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm font-mono">{q.correctRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 쉬운 문제 TOP 5 */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">🟢 쉬운 문제 TOP 5</h3>
                  <div className="border border-border divide-y divide-border">
                    {easiestQuestions.map((q) => (
                      <div key={q.questionNumber} className="flex items-center gap-4 p-3 bg-card">
                        <span className="w-12 text-sm text-muted-foreground">{q.questionNumber}번</span>
                        <div className="flex-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getRateColor(q.correctRate)}`}
                              style={{ width: `${q.correctRate}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm font-mono">{q.correctRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 전체 문항 정답률 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">전체 문항</h3>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {mockQuestionStats.map((q) => (
                      <div 
                        key={q.questionNumber}
                        className="border border-border p-2 text-center bg-card hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-xs text-muted-foreground mb-1">{q.questionNumber}번</p>
                        <p className={`text-sm font-mono ${
                          q.correctRate >= 70 ? "text-green-600" :
                          q.correctRate >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {q.correctRate}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 빌보드 차트 - 안정권 진입자 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-light">전국 빌보드</h2>
                    <p className="text-sm text-muted-foreground">안정권 진입자 랭킹</p>
                  </div>
                  <span className="text-xs text-muted-foreground border border-border px-3 py-1">
                    TOP {mockBillboard.length}
                  </span>
                </div>

                <div className="border border-border divide-y divide-border">
                  {mockBillboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-4 p-4 bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* 순위 */}
                      <div className="w-10 text-center">
                        <span className="font-mono text-sm text-muted-foreground">
                          {entry.rank}
                        </span>
                      </div>

                      {/* 닉네임 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-foreground/80">
                          {entry.nickname}
                        </p>
                      </div>

                      {/* 점수 */}
                      <div className="text-right">
                        <p className="font-mono text-muted-foreground">
                          {entry.score}
                          <span className="text-xs text-muted-foreground">/35</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 안내 */}
              <div className="border border-border p-6 text-center bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  통계는 서울대학교, 연세대학교 고시반 응시자 데이터를 기반으로 합니다.
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