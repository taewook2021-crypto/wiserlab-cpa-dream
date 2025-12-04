import { useState } from "react";
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
const SAFE_ZONE_PERCENTILE = 40; // 상위 40%
const COMPETITIVE_ZONE_PERCENTILE = 70; // 상위 70%

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

// Mock user score (나중에 실제 채점 결과로 대체)
const mockUserScore = 26;
const mockUserRank = 72;

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

const Statistics = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("financial");
  const [selectedExam, setSelectedExam] = useState<string>("summit-1");

  const userZone = getZoneInfo(mockUserScore);
  const percentile = Math.round((mockUserRank / TOTAL_PARTICIPANTS) * 100);

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
              <div className="border border-border rounded-none p-8 mb-8 bg-card">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">내 점수</p>
                  <p className="text-5xl font-light mb-1">
                    <span className="text-foreground">{mockUserScore}</span>
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
                    {TOTAL_PARTICIPANTS}명 중 <span className="font-medium text-foreground">{mockUserRank}등</span> · 상위 {percentile}%
                  </p>
                </div>
              </div>

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