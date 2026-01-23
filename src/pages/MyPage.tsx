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
import { Input } from "@/components/ui/input";
import { User, FileText, Trophy, ShoppingCart, Package, BarChart3, Zap, Trash2, Copy, Check, Ticket, Download, MapPin, Phone, Search, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
}

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

interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
}

interface StatisticsSetting {
  subject: string;
  exam_round: number;
  is_released: boolean;
  safe_cutoff: number;
  competitive_cutoff: number;
}

// 기본 컷오프 (DB에서 값이 없을 때 사용)
const DEFAULT_CUTOFFS: Record<string, { safe: number; competitive: number }> = {
  financial_accounting: { safe: 23, competitive: 14 },
  tax_law: { safe: 20, competitive: 16 },
};

const getDefaultCutoffs = (subject: string) => {
  return DEFAULT_CUTOFFS[subject] || { safe: 23, competitive: 14 };
};

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
  const [profile, setProfile] = useState<{ 
    exam_number: string;
    phone?: string | null;
    shipping_address?: string | null;
    shipping_detail_address?: string | null;
    shipping_postal_code?: string | null;
  } | null>(null);
  const [copiedExamNumber, setCopiedExamNumber] = useState(false);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // 통계 설정 (컷오프 및 공개 여부)
  const [statisticsSettings, setStatisticsSettings] = useState<StatisticsSetting[]>([]);
  
  // 배송정보 편집 상태
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDetailAddress, setEditDetailAddress] = useState("");
  const [savingShipping, setSavingShipping] = useState(false);

  const copyExamNumber = async () => {
    if (!profile?.exam_number) return;
    await navigator.clipboard.writeText(profile.exam_number);
    setCopiedExamNumber(true);
    toast.success("수험번호가 복사되었습니다.");
    setTimeout(() => setCopiedExamNumber(false), 2000);
  };

  const copyDiscountCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("할인 코드가 복사되었습니다.");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 다음 우편번호 스크립트 로드
  useEffect(() => {
    const daumScript = document.createElement("script");
    daumScript.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    daumScript.async = true;
    document.head.appendChild(daumScript);

    return () => {
      if (document.head.contains(daumScript)) {
        document.head.removeChild(daumScript);
      }
    };
  }, []);

  // 배송정보 편집 시작
  const startEditingShipping = () => {
    setEditPhone(profile?.phone || "");
    setEditPostcode(profile?.shipping_postal_code || "");
    setEditAddress(profile?.shipping_address || "");
    setEditDetailAddress(profile?.shipping_detail_address || "");
    setIsEditingShipping(true);
  };

  // 배송정보 저장
  const saveShippingInfo = async () => {
    if (!user) return;
    
    setSavingShipping(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: editPhone || null,
          shipping_postal_code: editPostcode || null,
          shipping_address: editAddress || null,
          shipping_detail_address: editDetailAddress || null,
        } as Record<string, unknown>)
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        phone: editPhone || null,
        shipping_postal_code: editPostcode || null,
        shipping_address: editAddress || null,
        shipping_detail_address: editDetailAddress || null,
      } : null);
      
      setIsEditingShipping(false);
      toast.success("배송 정보가 저장되었습니다.");
    } catch (error) {
      console.error("Error saving shipping info:", error);
      toast.error("배송 정보 저장에 실패했습니다.");
    } finally {
      setSavingShipping(false);
    }
  };

  // 우편번호 검색
  const handlePostcodeSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      toast.error("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        setEditPostcode(data.zonecode);
        setEditAddress(data.address);
      },
    }).open();
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
    } catch (error: unknown) {
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
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          exam_number: data.exam_number,
          phone: (data as Record<string, unknown>).phone as string | null,
          shipping_address: (data as Record<string, unknown>).shipping_address as string | null,
          shipping_detail_address: (data as Record<string, unknown>).shipping_detail_address as string | null,
          shipping_postal_code: (data as Record<string, unknown>).shipping_postal_code as string | null,
        });
      }
    };

    const fetchDiscountCodes = async () => {
      if (!user?.email) {
        setLoadingDiscountCodes(false);
        return;
      }

      const { data, error } = await supabase
        .from("discount_codes")
        .select("id, code, discount_amount, is_used, expires_at, created_at")
        .eq("assigned_email", user.email)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDiscountCodes(data);
      }
      setLoadingDiscountCodes(false);
    };

    const fetchStatisticsSettings = async () => {
      const { data, error } = await supabase
        .from("statistics_settings")
        .select("subject, exam_round, is_released, safe_cutoff, competitive_cutoff");

      if (!error && data) {
        setStatisticsSettings(data);
      }
    };

    if (user) {
      fetchResults();
      fetchCartItems();
      fetchOrders();
      fetchProfile();
      fetchDiscountCodes();
      fetchStatisticsSettings();
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

          {/* 배송 정보 관리 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-lg font-normal">
                  <MapPin className="w-5 h-5" />
                  배송 정보 및 연락처
                </span>
                {!isEditingShipping && (
                  <Button variant="ghost" size="sm" onClick={startEditingShipping}>
                    <Pencil className="w-4 h-4 mr-1" />
                    편집
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingShipping ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPhone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      연락처
                    </Label>
                    <Input
                      id="editPhone"
                      placeholder="010-0000-0000"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPostcode">우편번호</Label>
                    <div className="flex gap-2">
                      <Input
                        id="editPostcode"
                        placeholder="우편번호"
                        value={editPostcode}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePostcodeSearch}
                        size="sm"
                      >
                        <Search className="w-4 h-4 mr-1" />
                        검색
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAddress">주소</Label>
                    <Input
                      id="editAddress"
                      placeholder="주소를 검색해주세요"
                      value={editAddress}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDetailAddress">상세 주소</Label>
                    <Input
                      id="editDetailAddress"
                      placeholder="상세 주소를 입력하세요"
                      value={editDetailAddress}
                      onChange={(e) => setEditDetailAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={saveShippingInfo} 
                      disabled={savingShipping}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {savingShipping ? "저장 중..." : "저장"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingShipping(false)}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile?.phone || profile?.shipping_address ? (
                    <>
                      {profile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile.shipping_address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p>{profile.shipping_postal_code && `[${profile.shipping_postal_code}]`} {profile.shipping_address}</p>
                            {profile.shipping_detail_address && (
                              <p className="text-muted-foreground">{profile.shipping_detail_address}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      배송 정보와 연락처를 등록하면 결제 시 자동으로 입력됩니다.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 특별 자료 다운로드 카드 */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <Download className="w-5 h-5 text-primary" />
                특별 자료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-background/80 rounded-lg border border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">2026 개정세법 주요 문제 수정</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      개정세법 반영 문제 수정사항 안내
                    </p>
                  </div>
                  <a
                    href="/downloads/2026_tax_law_amendment.pdf"
                    download="2026_개정세법_주요_문제_수정.pdf"
                    className="flex-shrink-0"
                  >
                    <Button size="sm" className="h-8">
                      <Download className="w-4 h-4 mr-1" />
                      다운로드
                    </Button>
                  </a>
                </div>
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
                    
                    // DB 컷오프 기반 등급 계산 (통계 페이지와 동일한 로직)
                    const getScoreZone = () => {
                      // 해당 과목/회차의 설정 찾기
                      const setting = statisticsSettings.find(
                        s => s.subject === result.subject && s.exam_round === result.exam_round
                      );
                      
                      // 설정이 없거나 공개되지 않은 경우
                      if (!setting || !setting.is_released) {
                        return "통계 분석 중";
                      }
                      
                      const safeCutoff = setting.safe_cutoff;
                      const competitiveCutoff = setting.competitive_cutoff;
                      
                      if (result.correct_count >= safeCutoff) return "안정권";
                      if (result.correct_count >= competitiveCutoff) return "경합권";
                      return "레드라인";
                    };

                      return (
                        <div
                          key={result.id}
                          className="p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-sm">
                                {result.exam_name} {result.exam_round}회
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {subjectNames[result.subject] || result.subject}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                <span className="text-primary">{result.correct_count}</span>
                                <span className="text-muted-foreground"> / {result.total_questions}</span>
                              </p>
                              <p className="text-xs">
                                {getScoreZone()}
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
                              통계 확인
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={handleEdgeClick}
                            >
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

          {/* 할인 코드 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-normal">
                <Ticket className="w-5 h-5" />
                할인 코드
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDiscountCodes ? (
                <p className="text-muted-foreground text-sm animate-pulse">불러오는 중...</p>
              ) : discountCodes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  발급된 할인 코드가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {discountCodes.map((discountCode) => (
                    <div
                      key={discountCode.id}
                      className={`p-3 rounded-lg ${discountCode.is_used ? "bg-muted/30" : "bg-muted/50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant="outline"
                            className={`font-mono text-sm px-2 py-1 ${discountCode.is_used ? "opacity-50 line-through" : ""}`}
                          >
                            {discountCode.code}
                          </Badge>
                          {!discountCode.is_used && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyDiscountCode(discountCode.code)}
                              className="h-7 w-7 p-0"
                            >
                              {copiedCode === discountCode.code ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {formatPrice(discountCode.discount_amount)}원
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${
                              discountCode.is_used
                                ? "bg-gray-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                          >
                            {discountCode.is_used ? "사용완료" : "사용가능"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        발급일: {formatDate(discountCode.created_at)}
                        {discountCode.expires_at && ` · 만료일: ${formatDate(discountCode.expires_at)}`}
                      </p>
                    </div>
                  ))}
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
