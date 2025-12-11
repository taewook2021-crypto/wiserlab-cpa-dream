import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, FileText, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ScoringResult {
  id: string;
  subject: string;
  exam_name: string;
  exam_round: number;
  correct_count: number;
  total_questions: number;
  score_percentage: number;
  created_at: string;
}

const subjectNames: Record<string, string> = {
  financial_accounting: "재무회계",
  tax_law: "세법",
};

const MyPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scoringResults, setScoringResults] = useState<ScoringResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("scoring_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setScoringResults(data);
      }
      setLoadingResults(false);
    };

    if (user) {
      fetchResults();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userMetadata = user.user_metadata;
  const avatarUrl = userMetadata?.avatar_url;
  const fullName = userMetadata?.full_name || userMetadata?.name || "사용자";
  const email = user.email;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-light mb-8">마이페이지</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* 프로필 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <User className="w-5 h-5" />
                프로필
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{fullName}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 응시 기록 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <FileText className="w-5 h-5" />
                응시 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingResults ? (
                <p className="text-muted-foreground text-sm animate-pulse">불러오는 중...</p>
              ) : scoringResults.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  응시 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {scoringResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">
                            {result.exam_name} {result.exam_round}회
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {subjectNames[result.subject] || result.subject}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          <span className="text-primary">{result.correct_count}</span>
                          <span className="text-muted-foreground"> / {result.total_questions}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.score_percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyPage;
