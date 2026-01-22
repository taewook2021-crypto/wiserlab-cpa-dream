import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Eye, EyeOff, Trophy, Users, TrendingUp, BarChart3, Save } from "lucide-react";

// 기본 컷오프
const DEFAULT_CUTOFFS = { safe: 23, competitive: 14 };

interface OmrResult {
  participant_number: number;
  correct_count: number;
}

interface BillboardEntry {
  rank: number;
  participantNumber: number;
  score: number;
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

const StatisticsSettingsAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCutoffs, setSavingCutoffs] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<string>("financial_accounting");
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [isReleased, setIsReleased] = useState(false);
  
  // 컷오프 편집 상태
  const [safeCutoff, setSafeCutoff] = useState<number>(DEFAULT_CUTOFFS.safe);
  const [competitiveCutoff, setCompetitiveCutoff] = useState<number>(DEFAULT_CUTOFFS.competitive);
  
  const [omrResults, setOmrResults] = useState<OmrResult[]>([]);
  const [billboard, setBillboard] = useState<BillboardEntry[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalParticipants: 0,
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    safeZoneCount: 0,
    competitiveZoneCount: 0,
    redLineCount: 0,
  });

  const cutoffs = useMemo(() => ({ safe: safeCutoff, competitive: competitiveCutoff }), [safeCutoff, competitiveCutoff]);
  const totalQuestions = selectedSubject === "tax_law" ? 40 : 35;

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      
      setIsAdmin(!error && data === true);
    };
    
    checkAdmin();
  }, [user]);

  // 데이터 조회
  const fetchData = async () => {
    setLoading(true);
    
    // 공개 설정 및 컷오프 조회
    const { data: settingsData } = await supabase
      .from("statistics_settings")
      .select("is_released, safe_cutoff, competitive_cutoff")
      .eq("subject", selectedSubject)
      .eq("exam_round", selectedRound)
      .maybeSingle();
    
    setIsReleased(settingsData?.is_released ?? false);
    setSafeCutoff(settingsData?.safe_cutoff ?? (selectedSubject === "tax_law" ? 20 : 23));
    setCompetitiveCutoff(settingsData?.competitive_cutoff ?? (selectedSubject === "tax_law" ? 16 : 14));
    
    // OMR 결과 조회
    const { data: omrData } = await supabase
      .from("omr_scoring_results")
      .select("participant_number, correct_count")
      .eq("subject", selectedSubject)
      .eq("exam_round", selectedRound)
      .order("correct_count", { ascending: false });
    
    if (omrData && omrData.length > 0) {
      setOmrResults(omrData);
      
      const scores = omrData.map(r => r.correct_count);
      const { safe, competitive } = cutoffs;
      
      const safeCount = scores.filter(s => s >= safe).length;
      const competitiveCount = scores.filter(s => s >= competitive && s < safe).length;
      const redLineCount = scores.filter(s => s < competitive).length;
      
      setOverallStats({
        totalParticipants: omrData.length,
        avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        maxScore: Math.max(...scores),
        minScore: Math.min(...scores),
        safeZoneCount: safeCount,
        competitiveZoneCount: competitiveCount,
        redLineCount: redLineCount,
      });
      
      // 빌보드 (안정권만)
      const safeZoneResults = omrData.filter(r => r.correct_count >= safe);
      const billboardData: BillboardEntry[] = safeZoneResults.slice(0, 15).map((r, i) => ({
        rank: i + 1,
        participantNumber: r.participant_number,
        score: r.correct_count,
      }));
      
      setBillboard(billboardData);
    } else {
      setOmrResults([]);
      setBillboard([]);
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
    
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, selectedSubject, selectedRound, cutoffs]);

  // 공개 상태 토글
  const handleToggleRelease = async () => {
    setSaving(true);
    
    const newValue = !isReleased;
    
    const { error } = await supabase
      .from("statistics_settings")
      .upsert({
        subject: selectedSubject,
        exam_round: selectedRound,
        is_released: newValue,
        released_at: newValue ? new Date().toISOString() : null,
        safe_cutoff: safeCutoff,
        competitive_cutoff: competitiveCutoff,
      }, {
        onConflict: "subject,exam_round",
      });
    
    if (error) {
      toast({
        title: "오류",
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      setIsReleased(newValue);
      toast({
        title: newValue ? "공개됨" : "비공개됨",
        description: newValue 
          ? "학생들이 통계를 볼 수 있습니다." 
          : "통계가 비공개 처리되었습니다.",
      });
    }
    
    setSaving(false);
  };

  // 컷오프 저장
  const handleSaveCutoffs = async () => {
    setSavingCutoffs(true);
    
    const { error } = await supabase
      .from("statistics_settings")
      .upsert({
        subject: selectedSubject,
        exam_round: selectedRound,
        is_released: isReleased,
        safe_cutoff: safeCutoff,
        competitive_cutoff: competitiveCutoff,
      }, {
        onConflict: "subject,exam_round",
      });
    
    if (error) {
      toast({
        title: "오류",
        description: "컷오프 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "저장 완료",
        description: "컷오프 값이 저장되었습니다.",
      });
      // 통계 재계산
      fetchData();
    }
    
    setSavingCutoffs(false);
  };

  const getSubjectLabel = (subject: string) => {
    if (subject === "financial_accounting") return "재무회계";
    if (subject === "tax_law") return "세법";
    return subject;
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">권한 확인 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">관리자만 접근 가능합니다.</p>
          <Button variant="outline" onClick={() => navigate("/")}>홈으로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <main className="pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-light">통계 공개 설정</h1>
              <p className="text-sm text-muted-foreground mt-1">
                학생들에게 보여질 통계를 미리 확인하고 공개 여부를 설정합니다.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>

          {/* 과목/회차 선택 및 공개 설정 */}
          <div className="border border-border p-6 mb-8 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">과목</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial_accounting">재무회계</SelectItem>
                    <SelectItem value="tax_law">세법</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">회차</Label>
                <Select value={String(selectedRound)} onValueChange={(v) => setSelectedRound(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1회</SelectItem>
                    <SelectItem value="2">2회</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">현재 상태</Label>
                <div className="flex items-center gap-3 h-10">
                  <Badge variant={isReleased ? "default" : "secondary"} className="h-6">
                    {isReleased ? (
                      <><Eye className="w-3 h-3 mr-1" /> 공개</>
                    ) : (
                      <><EyeOff className="w-3 h-3 mr-1" /> 비공개</>
                    )}
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={handleToggleRelease} 
                disabled={saving}
                variant={isReleased ? "outline" : "default"}
              >
                {saving ? "저장 중..." : isReleased ? "비공개로 변경" : "공개로 변경"}
              </Button>
            </div>
          </div>

          {/* 컷오프 정보 */}
          <div className="border border-border p-6 mb-8 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {getSubjectLabel(selectedSubject)} {selectedRound}회 컷오프 설정
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveCutoffs}
                disabled={savingCutoffs}
              >
                <Save className="w-4 h-4 mr-2" />
                {savingCutoffs ? "저장 중..." : "컷오프 저장"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-foreground text-background p-4">
                <p className="font-medium text-sm mb-3 text-center">안정권</p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={safeCutoff}
                    onChange={(e) => setSafeCutoff(Number(e.target.value))}
                    className="w-20 h-8 text-center bg-background text-foreground"
                    min={1}
                    max={totalQuestions}
                  />
                  <span className="text-sm">개 이상</span>
                </div>
              </div>
              <div className="bg-muted text-foreground p-4">
                <p className="font-medium text-sm mb-3 text-center">경합권</p>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={competitiveCutoff}
                    onChange={(e) => setCompetitiveCutoff(Number(e.target.value))}
                    className="w-20 h-8 text-center"
                    min={1}
                    max={totalQuestions}
                  />
                  <span className="text-sm">~{safeCutoff - 1}개</span>
                </div>
              </div>
              <div className="bg-background text-muted-foreground p-4 border border-border">
                <p className="font-medium text-sm mb-3 text-center">레드라인</p>
                <p className="text-2xl font-light text-center">{competitiveCutoff - 1}개 이하</p>
              </div>
            </div>
          </div>

          {/* 학생 뷰 미리보기 */}
          <div className="border-2 border-dashed border-border p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">학생 뷰 미리보기</h2>
              <Badge variant="outline" className="ml-2">Preview</Badge>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">데이터 로딩 중...</p>
              </div>
            ) : overallStats.totalParticipants === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">OMR 채점 데이터가 없습니다.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/omr-scoring-admin")}
                >
                  OMR 채점 관리로 이동
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 전체 통계 요약 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-border p-4 text-center">
                    <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-light">{overallStats.totalParticipants}</p>
                    <p className="text-xs text-muted-foreground">응시자 수</p>
                  </div>
                  <div className="border border-border p-4 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-light">{overallStats.avgScore}</p>
                    <p className="text-xs text-muted-foreground">평균 점수</p>
                  </div>
                  <div className="border border-border p-4 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-light">{overallStats.maxScore}</p>
                    <p className="text-xs text-muted-foreground">최고 점수</p>
                  </div>
                  <div className="border border-border p-4 text-center">
                    <BarChart3 className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-light">{overallStats.minScore}</p>
                    <p className="text-xs text-muted-foreground">최저 점수</p>
                  </div>
                </div>

                {/* 존별 분포 */}
                <div className="grid grid-cols-3 gap-px bg-border">
                  <div className="bg-foreground text-background p-6 text-center">
                    <p className="font-medium text-sm mb-1">안정권</p>
                    <p className="text-3xl font-light">{overallStats.safeZoneCount}명</p>
                    <p className="text-xs opacity-70 mt-1">
                      {((overallStats.safeZoneCount / overallStats.totalParticipants) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-muted text-foreground p-6 text-center">
                    <p className="font-medium text-sm mb-1">경합권</p>
                    <p className="text-3xl font-light">{overallStats.competitiveZoneCount}명</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((overallStats.competitiveZoneCount / overallStats.totalParticipants) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-background text-muted-foreground p-6 text-center border border-border">
                    <p className="font-medium text-sm mb-1">레드라인</p>
                    <p className="text-3xl font-light">{overallStats.redLineCount}명</p>
                    <p className="text-xs mt-1">
                      {((overallStats.redLineCount / overallStats.totalParticipants) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* 빌보드 미리보기 */}
                <div>
                  <h3 className="text-lg font-medium mb-4">전국 빌보드 (안정권 진입자)</h3>
                  {billboard.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">순위</TableHead>
                          <TableHead>응시자</TableHead>
                          <TableHead className="text-right">점수</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billboard.map((entry) => (
                          <TableRow key={entry.rank}>
                            <TableCell className="font-mono">{entry.rank}</TableCell>
                            <TableCell>응시자 {entry.participantNumber}</TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.score}/{totalQuestions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="border border-border p-8 text-center">
                      <p className="text-muted-foreground">안정권 진입자가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatisticsSettingsAdmin;
