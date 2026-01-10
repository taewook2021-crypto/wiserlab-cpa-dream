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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ticket, RefreshCw, Download, Plus, Search } from "lucide-react";

interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  batch_name: string;
  is_used: boolean;
  user_id: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  assigned_email: string | null;
}

const DiscountCodesAdmin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 생성 다이얼로그
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [codeCount, setCodeCount] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(20000);
  const [isCreating, setIsCreating] = useState(false);

  // 이메일 기반 생성 다이얼로그
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailBatchName, setEmailBatchName] = useState("");
  const [emailList, setEmailList] = useState("");
  const [isCreatingEmailCodes, setIsCreatingEmailCodes] = useState(false);

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

  const fetchCodes = async () => {
    setLoadingCodes(true);
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCodes(data as DiscountCode[]);
    }
    setLoadingCodes(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
    }
  }, [isAdmin]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "DISC-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCodes = async () => {
    if (!batchName.trim()) {
      toast.error("배치명을 입력해주세요.");
      return;
    }
    if (codeCount < 1 || codeCount > 100) {
      toast.error("생성 개수는 1~100개 사이로 입력해주세요.");
      return;
    }

    setIsCreating(true);

    try {
      const newCodes = [];
      for (let i = 0; i < codeCount; i++) {
        newCodes.push({
          code: generateCode(),
          discount_amount: discountAmount,
          batch_name: batchName.trim(),
        });
      }

      const { error } = await supabase.from("discount_codes").insert(newCodes);

      if (error) {
        console.error("Create codes error:", error);
        toast.error("할인 코드 생성 중 오류가 발생했습니다.");
        return;
      }

      toast.success(`${codeCount}개의 할인 코드가 생성되었습니다.`);
      setShowCreateDialog(false);
      setBatchName("");
      setCodeCount(10);
      fetchCodes();
    } catch (error) {
      console.error("Create codes error:", error);
      toast.error("할인 코드 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.batch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.assigned_email && code.assigned_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCodes = codes.length;
  const usedCodes = codes.filter((c) => c.is_used).length;
  const unusedCodes = totalCodes - usedCodes;

  const handleDownloadCSV = () => {
    const headers = ["코드", "할인금액", "배치명", "지정이메일", "사용여부", "사용일시", "생성일시"];
    const rows = filteredCodes.map((code) => [
      code.code,
      code.discount_amount,
      code.batch_name,
      code.assigned_email || "",
      code.is_used ? "사용됨" : "미사용",
      code.used_at ? new Date(code.used_at).toLocaleString("ko-KR") : "",
      new Date(code.created_at).toLocaleString("ko-KR"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `discount_codes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // 이메일 기반 코드 생성
  const handleCreateEmailCodes = async () => {
    if (!emailBatchName.trim()) {
      toast.error("배치명을 입력해주세요.");
      return;
    }
    if (!emailList.trim()) {
      toast.error("이메일 목록을 입력해주세요.");
      return;
    }

    const emails = emailList
      .split("\n")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      toast.error("유효한 이메일이 없습니다.");
      return;
    }

    if (emails.length > 100) {
      toast.error("한 번에 최대 100개까지 생성 가능합니다.");
      return;
    }

    setIsCreatingEmailCodes(true);

    try {
      const newCodes = emails.map((email) => ({
        code: generateCode(),
        discount_amount: 20000,
        batch_name: emailBatchName.trim(),
        assigned_email: email,
      }));

      const { error } = await supabase.from("discount_codes").insert(newCodes);

      if (error) {
        console.error("Create email codes error:", error);
        toast.error("할인 코드 생성 중 오류가 발생했습니다.");
        return;
      }

      toast.success(`${emails.length}개의 이메일 기반 할인 코드가 생성되었습니다.`);
      setShowEmailDialog(false);
      setEmailBatchName("");
      setEmailList("");
      fetchCodes();
    } catch (error) {
      console.error("Create email codes error:", error);
      toast.error("할인 코드 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingEmailCodes(false);
    }
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

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
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
            <Ticket className="w-6 h-6" />
            할인 코드 관리
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCodes}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              이메일 기반 생성
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              일괄 생성
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalCodes}</p>
                <p className="text-sm text-muted-foreground">전체 코드</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{unusedCodes}</p>
                <p className="text-sm text-muted-foreground">미사용</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{usedCodes}</p>
                <p className="text-sm text-muted-foreground">사용됨</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 다운로드 */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="코드 또는 배치명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-normal">
              할인 코드 목록 ({filteredCodes.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCodes ? (
              <p className="text-muted-foreground text-center py-8 animate-pulse">
                코드 목록을 불러오는 중...
              </p>
            ) : filteredCodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                할인 코드가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>코드</TableHead>
                      <TableHead>할인금액</TableHead>
                      <TableHead>배치명</TableHead>
                      <TableHead>지정 이메일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>사용일시</TableHead>
                      <TableHead>생성일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-bold">
                          {code.code}
                        </TableCell>
                        <TableCell>{formatPrice(code.discount_amount)}원</TableCell>
                        <TableCell>{code.batch_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {code.assigned_email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              code.is_used
                                ? "bg-red-500 text-white"
                                : "bg-green-500 text-white"
                            }
                          >
                            {code.is_used ? "사용됨" : "미사용"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {code.used_at ? formatDate(code.used_at) : "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(code.created_at)}
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

      {/* 코드 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>할인 코드 일괄 생성</DialogTitle>
            <DialogDescription>
              대학교별로 할인 코드를 일괄 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchName">배치명 (학교명)</Label>
              <Input
                id="batchName"
                placeholder="예: 고려대 2025"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codeCount">생성 개수</Label>
              <Input
                id="codeCount"
                type="number"
                min={1}
                max={100}
                value={codeCount}
                onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">할인 금액 (원)</Label>
              <Input
                id="discountAmount"
                type="number"
                min={1000}
                step={1000}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 20000)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setBatchName("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreateCodes} disabled={isCreating}>
              {isCreating ? "생성 중..." : `${codeCount}개 생성`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이메일 기반 코드 생성 다이얼로그 */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>이메일 기반 할인 코드 생성</DialogTitle>
            <DialogDescription>
              카카오 이메일 목록을 입력하면 각 이메일에 고유한 할인 코드가 지정됩니다.
              해당 이메일로 로그인한 사용자에게 할인이 자동 적용됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailBatchName">배치명 (학교명)</Label>
              <Input
                id="emailBatchName"
                placeholder="예: 고려대 2025"
                value={emailBatchName}
                onChange={(e) => setEmailBatchName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailList">카카오 이메일 목록 (줄바꿈으로 구분)</Label>
              <textarea
                id="emailList"
                className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono resize-y bg-background"
                placeholder="example1@kakao.com&#10;example2@naver.com&#10;example3@gmail.com"
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {emailList.split("\n").filter((e) => e.trim()).length}개 이메일 입력됨 (최대 100개)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailDialog(false);
                setEmailBatchName("");
                setEmailList("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreateEmailCodes} disabled={isCreatingEmailCodes}>
              {isCreatingEmailCodes ? "생성 중..." : "코드 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountCodesAdmin;
