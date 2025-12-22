import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, RefreshCw, XCircle } from "lucide-react";

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

const OrderAdmin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-light flex items-center gap-2">
            <Package className="w-6 h-6" />
            주문 관리
          </h1>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
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
                        <TableCell>{formatPrice(order.amount)}원</TableCell>
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
                          {order.status === "paid" && (
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
    </div>
  );
};

export default OrderAdmin;
