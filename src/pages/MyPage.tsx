import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, FileText, Trophy, ShoppingCart, Package, BarChart3, Zap, Trash2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface CartItem {
  id: string;
  product_type: string;
  product_name: string;
  price: number;
}

interface Order {
  id: string;
  order_id: string;
  product_name: string;
  amount: number;
  status: string;
  created_at: string;
  payment_key: string | null;
}

const subjectNames: Record<string, string> = {
  financial_accounting: "재무회계",
  tax_law: "세법",
};

const subjectIds: Record<string, string> = {
  financial_accounting: "financial",
  tax_law: "tax",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-500",
  refunded: "bg-red-500",
  refund_requested: "bg-orange-500",
  cancelled: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "대기중",
  paid: "결제완료",
  refunded: "환불완료",
  refund_requested: "환불요청",
  cancelled: "취소",
};


const MyPage = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [scoringResults, setScoringResults] = useState<ScoringResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profile, setProfile] = useState<{ exam_number: string } | null>(null);
  const [copiedExamNumber, setCopiedExamNumber] = useState(false);

  const copyExamNumber = async () => {
    if (!profile?.exam_number) return;
    await navigator.clipboard.writeText(profile.exam_number);
    setCopiedExamNumber(true);
    toast.success("수험번호가 복사되었습니다.");
    setTimeout(() => setCopiedExamNumber(false), 2000);
  };


  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Call the edge function to delete user account
      const { error } = await supabase.functions.invoke('delete-user');
      
      if (error) {
        throw error;
      }

      toast.success("회원 탈퇴가 완료되었습니다.");
      await signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeletingAccount(false);
    }
  };

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

    const fetchCartItems = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCartItems(data);
      }
      setLoadingCart(false);
    };

    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_id, product_name, amount, status, created_at, payment_key")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoadingOrders(false);
    };

    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("exam_number")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };

    if (user) {
      fetchResults();
      fetchCartItems();
      fetchOrders();
      fetchProfile();
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

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
                <div className="flex-1">
                  <p className="font-medium">{fullName}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              
              {/* 내 수험번호 표시 */}
              {profile?.exam_number && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">내 수험번호</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-base px-3 py-1.5">
                      {profile.exam_number}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyExamNumber}
                      className="h-8 w-8 p-0"
                    >
                      {copiedExamNumber ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {/* 회원 탈퇴 버튼 */}
              <div className="mt-6 pt-4 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      회원 탈퇴
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말 탈퇴하시겠습니까? 탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingAccount ? "탈퇴 중..." : "탈퇴하기"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* 주문 내역 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <Package className="w-5 h-5" />
                주문 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <p className="text-muted-foreground text-sm animate-pulse">불러오는 중...</p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  주문 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)} · 배송비 <span className="text-primary">무료</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-nowrap">
                          <span className="text-xs whitespace-nowrap shrink-0">{formatPrice(order.amount)}원</span>
                          <Badge
                            className={`${statusColors[order.status] || "bg-gray-500"} text-white text-[10px] px-1.5 py-0.5 whitespace-nowrap shrink-0`}
                          >
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      외 {orders.length - 5}건의 주문
                    </p>
                  )}
                </div>
              )}
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
                  {scoringResults.map((result) => {
                    const subjectId = subjectIds[result.subject] || result.subject;
                    const examId = `summit-${result.exam_round}`;
                    
                    const handleEdgeClick = async () => {
                      // 틀린 문제 번호 조회
                      const { data: answers, error } = await supabase
                        .from("scoring_answers")
                        .select("question_number")
                        .eq("scoring_result_id", result.id)
                        .eq("is_correct", false)
                        .order("question_number");
                      
                      if (error || !answers || answers.length === 0) {
                        // 틀린 문제가 없으면 통계 페이지로
                        navigate(`/statistics?subject=${subjectId}&exam=${examId}&score=${result.correct_count}&total=${result.total_questions}`);
                        return;
                      }
                      
                      const wrongNumbers = answers.map(a => a.question_number).join(",");
                      navigate(`/edge?subject=${subjectId}&exam=${examId}&wrong=${wrongNumbers}`);
                    };
                    
                    return (
                      <div
                        key={result.id}
                        className="p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => navigate(`/statistics?subject=${subjectId}&exam=${examId}&score=${result.correct_count}&total=${result.total_questions}`)}
                          >
                            <BarChart3 className="w-3 h-3 mr-1" />
                            통계 확인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={handleEdgeClick}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Edge
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 장바구니 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCart ? (
                <p className="text-muted-foreground text-sm animate-pulse">불러오는 중...</p>
              ) : cartItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  장바구니가 비어있습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {cartItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <p className="font-medium text-sm truncate flex-1">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {item.price.toLocaleString()}원
                      </p>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      외 {cartItems.length - 3}개 상품
                    </p>
                  )}
                </div>
              )}
              <Link to="/cart" className="block mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  더보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
};

export default MyPage;
