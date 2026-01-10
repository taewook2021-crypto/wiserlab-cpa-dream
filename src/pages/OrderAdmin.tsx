import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, RefreshCw, XCircle, UserPlus } from "lucide-react";

interface Order {
  id: string;
  order_id: string;
  payment_key: string | null;
  product_name: string;
  amount: number;
  status: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  shipping_address: string;
  shipping_detail_address: string | null;
  shipping_postal_code: string;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  paid: "bg-green-500",
  refunded: "bg-red-500",
  cancelled: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "대기중",
  paid: "결제완료",
  refunded: "환불완료",
  cancelled: "취소",
};

const universityOptions = [
  { value: "SNU", label: "서울대학교", paymentKey: "FREE_SNU_2025" },
  { value: "YONSEI", label: "연세대학교", paymentKey: "FREE_YONSEI_2025" },
];

const OrderAdmin = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // 무료 결제 등록 관련 상태
  const [showFreeRegistrationDialog, setShowFreeRegistrationDialog] = useState(false);
  const [freeEmail, setFreeEmail] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      setIsAdmin(data === true);
      setIsCheckingAdmin(false);
    };

    if (!loading) {
      if (user) {
        checkAdminRole();
      } else {
        setIsCheckingAdmin(false);
      }
    }
  }, [user, loading]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const handleRefund = async () => {
    if (!selectedOrder || !refundReason.trim()) {
      toast.error("환불 사유를 입력해주세요.");
      return;
    }

    if (!selectedOrder.payment_key) {
      toast.error("결제 정보가 없습니다.");
      return;
    }

    setIsRefunding(true);

    try {
      const { data, error } = await supabase.functions.invoke("toss-refund", {
        body: {
          paymentKey: selectedOrder.payment_key,
          cancelReason: refundReason,
          orderId: selectedOrder.order_id,
        },
      });

      if (error) {
        console.error("Refund error:", error);
        toast.error("환불 처리 중 오류가 발생했습니다.");
        return;
      }

      if (data.success) {
        toast.success("환불이 완료되었습니다.");
        setShowRefundDialog(false);
        setSelectedOrder(null);
        setRefundReason("");
        fetchOrders();
      } else {
        toast.error(data.error || "환불 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("환불 처리 중 오류가 발생했습니다.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleFreeRegistration = async () => {
    if (!freeEmail.trim()) {
      toast.error("카카오 이메일을 입력해주세요.");
      return;
    }
    if (!selectedUniversity) {
      toast.error("학교를 선택해주세요.");
      return;
    }

    setIsRegistering(true);

    try {
      // 이메일로 사용자 조회
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", freeEmail.trim())
        .single();

      if (profileError || !profile) {
        toast.error("해당 이메일로 가입된 사용자를 찾을 수 없습니다.");
        setIsRegistering(false);
        return;
      }

      // 이미 등록된 주문이 있는지 확인
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", profile.id)
        .eq("status", "paid")
        .single();

      if (existingOrder) {
        toast.error("이미 결제 완료된 주문이 있습니다.");
        setIsRegistering(false);
        return;
      }

      const university = universityOptions.find((u) => u.value === selectedUniversity);
      const orderId = `FREE_${selectedUniversity}_${Date.now()}`;

      // 무료 결제 레코드 생성
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: profile.id,
        order_id: orderId,
        payment_key: university?.paymentKey || `FREE_${selectedUniversity}_2025`,
        product_name: `SUMMIT 전과목 PACK (${university?.label} 무료 응시)`,
        amount: 0,
        status: "paid",
        buyer_name: "무료 응시자",
        buyer_email: freeEmail.trim(),
        buyer_phone: "-",
        shipping_address: "무료 응시 - 배송 불필요",
        shipping_postal_code: "00000",
        paid_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("무료 결제 등록 중 오류가 발생했습니다.");
        setIsRegistering(false);
        return;
      }

      toast.success(`${university?.label} 무료 응시자로 등록되었습니다.`);
      setShowFreeRegistrationDialog(false);
      setFreeEmail("");
      setSelectedUniversity("");
      fetchOrders();
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("무료 결제 등록 중 오류가 발생했습니다.");
    } finally {
      setIsRegistering(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-muted-foreground">권한 확인 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-muted-foreground">로그인이 필요합니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-muted-foreground">관리자 권한이 필요합니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 pt-24 pb-16">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light flex items-center gap-2">
            <Package className="w-6 h-6" />
            주문 관리
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFreeRegistrationDialog(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              무료 결제 등록
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-normal">
              전체 주문 ({orders.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <p className="text-muted-foreground text-center py-8 animate-pulse">
                주문 목록을 불러오는 중...
              </p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                주문 내역이 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문번호</TableHead>
                      <TableHead>상품</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>주문자</TableHead>
                      <TableHead>배송지</TableHead>
                      <TableHead>주문일시</TableHead>
                      <TableHead>액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.order_id.slice(0, 20)}...
                        </TableCell>
                        <TableCell>{order.product_name}</TableCell>
                        <TableCell>
                          {order.amount === 0 ? (
                            <span className="text-green-600 font-medium">무료</span>
                          ) : (
                            `${formatPrice(order.amount)}원`
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusColors[order.status] || "bg-gray-500"} text-white`}
                          >
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{order.buyer_name}</p>
                            <p className="text-muted-foreground text-xs">
                              {order.buyer_phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px]">
                            <p className="truncate">
                              [{order.shipping_postal_code}] {order.shipping_address}
                            </p>
                            {order.shipping_detail_address && (
                              <p className="text-muted-foreground text-xs truncate">
                                {order.shipping_detail_address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          {order.status === "paid" && order.amount > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowRefundDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              환불
                            </Button>
                          )}
                          {order.status === "refunded" && order.refund_reason && (
                            <span className="text-xs text-muted-foreground">
                              사유: {order.refund_reason}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* 환불 다이얼로그 */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 환불</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.order_id}
              <br />
              결제금액: {selectedOrder && formatPrice(selectedOrder.amount)}원
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">환불 사유</label>
              <Textarea
                placeholder="환불 사유를 입력하세요..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundDialog(false);
                setSelectedOrder(null);
                setRefundReason("");
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding || !refundReason.trim()}
            >
              {isRefunding ? "처리 중..." : "환불 처리"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 무료 결제 등록 다이얼로그 */}
      <Dialog open={showFreeRegistrationDialog} onOpenChange={setShowFreeRegistrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>무료 결제 등록</DialogTitle>
            <DialogDescription>
              서울대/연세대 무료 응시자를 결제 완료 상태로 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freeEmail">카카오 이메일</Label>
              <Input
                id="freeEmail"
                placeholder="example@kakao.com"
                value={freeEmail}
                onChange={(e) => setFreeEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                사용자가 카카오 로그인 시 사용한 이메일을 입력하세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label>학교 선택</Label>
              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger>
                  <SelectValue placeholder="학교를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {universityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFreeRegistrationDialog(false);
                setFreeEmail("");
                setSelectedUniversity("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleFreeRegistration}
              disabled={isRegistering || !freeEmail.trim() || !selectedUniversity}
            >
              {isRegistering ? "등록 중..." : "무료 결제 등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderAdmin;
