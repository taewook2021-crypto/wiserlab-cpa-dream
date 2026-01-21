import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Download, RefreshCw, Search, Truck } from "lucide-react";

interface PaidMember {
  id: string;
  user_id: string;
  order_id: string;
  product_name: string;
  amount: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  shipping_address: string;
  shipping_detail_address: string | null;
  shipping_postal_code: string;
  paid_at: string | null;
  created_at: string;
  is_admin_granted: boolean;
  exam_number: string | null;
}

const PaidMembersAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<PaidMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      setIsAdmin(data === true);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  // Fetch paid members
  const fetchMembers = async () => {
    if (!isAdmin) return;

    // Get all paid orders
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, user_id, order_id, product_name, amount, buyer_name, buyer_email, buyer_phone, shipping_address, shipping_detail_address, shipping_postal_code, paid_at, created_at")
      .eq("status", "paid")
      .order("paid_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return;
    }

    // Get all profiles for exam numbers
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, exam_number");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

    // Create a map of user_id to exam_number
    const examNumberMap = new Map(
      profilesData?.map((p) => [p.id, p.exam_number]) || []
    );

    // Transform data - 관리자 부여 회원 제외
    const membersData: PaidMember[] = (ordersData || [])
      .filter((order) => !order.order_id.startsWith("ADMIN-GRANT-"))
      .map((order) => ({
        ...order,
        is_admin_granted: false,
        exam_number: examNumberMap.get(order.user_id) || null,
      }));

    setMembers(membersData);
  };

  useEffect(() => {
    fetchMembers();
  }, [isAdmin]);

  // Filter members
  const filteredMembers = members.filter((member) => {
    const search = searchTerm.toLowerCase();
    return (
      member.buyer_email?.toLowerCase().includes(search) ||
      member.buyer_name?.toLowerCase().includes(search) ||
      member.exam_number?.toLowerCase().includes(search) ||
      member.product_name?.toLowerCase().includes(search)
    );
  });

  // Statistics
  const totalMembers = members.length;
  const totalRevenue = members.reduce((sum, m) => sum + m.amount, 0);

  // CSV download - 기본 정보
  const handleDownloadCSV = () => {
    const headers = ["수험번호", "구매자명", "이메일", "상품명", "금액", "구분", "결제일"];
    const rows = filteredMembers.map((m) => [
      m.exam_number || "-",
      m.buyer_name,
      m.buyer_email,
      m.product_name,
      m.amount.toString(),
      m.is_admin_granted ? "관리자 부여" : "실제 구매",
      m.paid_at ? new Date(m.paid_at).toLocaleDateString("ko-KR") : "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `paid_members_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // 물류택배 양식 다운로드
  const handleDownloadShippingCSV = () => {
    if (filteredMembers.length === 0) {
      alert("다운로드할 구매자가 없습니다.");
      return;
    }


    const headers = ["상호", "핸드폰번호", "핸드폰번호", "주소", "내품수량", "배송메세지1", "박스타입", "박스수량"];
    const rows = filteredMembers.map((m) => {
      const fullAddress = m.shipping_detail_address 
        ? `${m.shipping_address} ${m.shipping_detail_address}` 
        : m.shipping_address;
      
      return [
        m.buyer_name,
        m.buyer_phone,
        m.buyer_phone,
        fullAddress,
        "1",
        "",
        "극소",
        "1",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shipping_list_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">접근 권한이 없습니다</p>
            <Button onClick={() => navigate("/")}>홈으로</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <AdminNav />
              <h1 className="text-3xl font-light mb-4">유료 회원 관리</h1>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">총 구매자</p>
                  <p className="text-2xl font-bold">{totalMembers}명</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">총 매출</p>
                  <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                </div>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="이메일, 이름, 수험번호로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={fetchMembers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    새로고침
                  </Button>
                  <Button variant="outline" onClick={handleDownloadCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    전체 CSV
                  </Button>
                  <Button onClick={handleDownloadShippingCSV}>
                    <Truck className="h-4 w-4 mr-2" />
                    물류택배 양식 ({totalMembers}명)
                  </Button>
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수험번호</TableHead>
                      <TableHead>구매자</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>상품</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>결제일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          구매자가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono text-sm">
                            {member.exam_number || "-"}
                          </TableCell>
                          <TableCell>{member.buyer_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.buyer_email}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {member.product_name}
                          </TableCell>
                          <TableCell>
                            {member.amount > 0 ? formatPrice(member.amount) : "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(member.paid_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                총 {filteredMembers.length}명의 유료 회원
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PaidMembersAdmin;
