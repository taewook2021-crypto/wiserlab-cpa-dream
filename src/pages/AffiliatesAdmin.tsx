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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, RefreshCw, Plus, Search, Download, Check, Ticket, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account: string | null;
  account_holder: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ReferralCode {
  id: string;
  code: string;
  affiliate_id: string;
  discount_amount: number;
  reward_amount: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  affiliates?: { name: string };
}

interface ReferralUsage {
  id: string;
  referral_code_id: string;
  order_id: string;
  user_id: string;
  discount_applied: number;
  reward_amount: number;
  is_settled: boolean;
  settled_at: string | null;
  created_at: string;
  referral_codes?: {
    code: string;
    affiliates?: { name: string };
  };
}

const AffiliatesAdmin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Data states
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [usages, setUsages] = useState<ReferralUsage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Affiliate Dialog
  const [showAddAffiliateDialog, setShowAddAffiliateDialog] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    name: "",
    email: "",
    phone: "",
    bank_name: "",
    bank_account: "",
    account_holder: "",
    notes: "",
  });
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);

  // Add Referral Code Dialog
  const [showAddCodeDialog, setShowAddCodeDialog] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("");
  const [newCodePrefix, setNewCodePrefix] = useState("REF-");
  const [newCodeSuffix, setNewCodeSuffix] = useState("");
  const [isAddingCode, setIsAddingCode] = useState(false);

  // Settlement
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [isSettling, setIsSettling] = useState(false);

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

  const fetchData = async () => {
    setLoadingData(true);

    const [affiliatesRes, codesRes, usagesRes] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("referral_codes").select("*, affiliates(name)").order("created_at", { ascending: false }),
      supabase.from("referral_usages").select("*, referral_codes(code, affiliates(name))").order("created_at", { ascending: false }),
    ]);

    if (affiliatesRes.data) setAffiliates(affiliatesRes.data as Affiliate[]);
    if (codesRes.data) setReferralCodes(codesRes.data as ReferralCode[]);
    if (usagesRes.data) setUsages(usagesRes.data as ReferralUsage[]);

    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleAddAffiliate = async () => {
    if (!newAffiliate.name.trim()) {
      toast.error("제휴자 이름을 입력해주세요.");
      return;
    }

    setIsAddingAffiliate(true);

    try {
      const { error } = await supabase.from("affiliates").insert({
        name: newAffiliate.name.trim(),
        email: newAffiliate.email.trim() || null,
        phone: newAffiliate.phone.trim() || null,
        bank_name: newAffiliate.bank_name.trim() || null,
        bank_account: newAffiliate.bank_account.trim() || null,
        account_holder: newAffiliate.account_holder.trim() || null,
        notes: newAffiliate.notes.trim() || null,
      });

      if (error) throw error;

      toast.success("제휴자가 등록되었습니다.");
      setShowAddAffiliateDialog(false);
      setNewAffiliate({ name: "", email: "", phone: "", bank_name: "", bank_account: "", account_holder: "", notes: "" });
      fetchData();
    } catch (error) {
      console.error("Add affiliate error:", error);
      toast.error("제휴자 등록 중 오류가 발생했습니다.");
    } finally {
      setIsAddingAffiliate(false);
    }
  };

  const handleAddReferralCode = async () => {
    if (!selectedAffiliateId) {
      toast.error("제휴자를 선택해주세요.");
      return;
    }
    if (!newCodeSuffix.trim()) {
      toast.error("코드를 입력해주세요.");
      return;
    }

    const fullCode = `${newCodePrefix}${newCodeSuffix}`.toUpperCase();

    // Check for duplicates
    const existing = referralCodes.find((c) => c.code === fullCode);
    if (existing) {
      toast.error("이미 존재하는 코드입니다.");
      return;
    }

    setIsAddingCode(true);

    try {
      const { error } = await supabase.from("referral_codes").insert({
        code: fullCode,
        affiliate_id: selectedAffiliateId,
        discount_amount: 10000,
        reward_amount: 10000,
      });

      if (error) throw error;

      toast.success("레퍼럴 코드가 생성되었습니다.");
      setShowAddCodeDialog(false);
      setNewCodeSuffix("");
      setSelectedAffiliateId("");
      fetchData();
    } catch (error) {
      console.error("Add referral code error:", error);
      toast.error("레퍼럴 코드 생성 중 오류가 발생했습니다.");
    } finally {
      setIsAddingCode(false);
    }
  };

  const handleToggleAffiliateActive = async (affiliate: Affiliate) => {
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ is_active: !affiliate.is_active })
        .eq("id", affiliate.id);

      if (error) throw error;

      toast.success(affiliate.is_active ? "제휴자가 비활성화되었습니다." : "제휴자가 활성화되었습니다.");
      fetchData();
    } catch (error) {
      console.error("Toggle affiliate error:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleToggleCodeActive = async (code: ReferralCode) => {
    try {
      const { error } = await supabase
        .from("referral_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);

      if (error) throw error;

      toast.success(code.is_active ? "코드가 비활성화되었습니다." : "코드가 활성화되었습니다.");
      fetchData();
    } catch (error) {
      console.error("Toggle code error:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleSettleSelected = async () => {
    if (selectedUsages.length === 0) {
      toast.error("정산할 항목을 선택해주세요.");
      return;
    }

    setIsSettling(true);

    try {
      const { error } = await supabase
        .from("referral_usages")
        .update({
          is_settled: true,
          settled_at: new Date().toISOString(),
        })
        .in("id", selectedUsages);

      if (error) throw error;

      toast.success(`${selectedUsages.length}건이 정산 처리되었습니다.`);
      setSelectedUsages([]);
      fetchData();
    } catch (error) {
      console.error("Settle error:", error);
      toast.error("정산 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSettling(false);
    }
  };

  const unsettledUsages = usages.filter((u) => !u.is_settled);
  const settledUsages = usages.filter((u) => u.is_settled);

  // Calculate stats per affiliate
  const affiliateStats = affiliates.map((affiliate) => {
    const codes = referralCodes.filter((c) => c.affiliate_id === affiliate.id);
    const codeIds = codes.map((c) => c.id);
    const affiliateUsages = usages.filter((u) => codeIds.includes(u.referral_code_id));
    const unsettledAmount = affiliateUsages.filter((u) => !u.is_settled).reduce((sum, u) => sum + u.reward_amount, 0);
    const totalAmount = affiliateUsages.reduce((sum, u) => sum + u.reward_amount, 0);
    const usageCount = affiliateUsages.length;

    return {
      ...affiliate,
      codes,
      usageCount,
      unsettledAmount,
      totalAmount,
    };
  });

  const totalUnsettledAmount = unsettledUsages.reduce((sum, u) => sum + u.reward_amount, 0);
  const totalSettledAmount = settledUsages.reduce((sum, u) => sum + u.reward_amount, 0);

  const handleDownloadSettlementCSV = () => {
    const headers = ["제휴자", "코드", "주문ID", "보상금액", "사용일시", "정산여부", "정산일시"];
    const rows = usages.map((usage) => [
      usage.referral_codes?.affiliates?.name || "-",
      usage.referral_codes?.code || "-",
      usage.order_id,
      usage.reward_amount,
      formatDate(usage.created_at),
      usage.is_settled ? "정산완료" : "미정산",
      usage.settled_at ? formatDate(usage.settled_at) : "-",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `referral_settlement_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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

  const filteredAffiliates = affiliateStats.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <Users className="w-6 h-6" />
            제휴자 관리
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button size="sm" onClick={() => setShowAddAffiliateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              제휴자 등록
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{affiliates.length}</p>
                <p className="text-sm text-muted-foreground">전체 제휴자</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{referralCodes.length}</p>
                <p className="text-sm text-muted-foreground">레퍼럴 코드</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {formatPrice(totalUnsettledAmount)}원
                </p>
                <p className="text-sm text-muted-foreground">미정산 금액</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(totalSettledAmount)}원
                </p>
                <p className="text-sm text-muted-foreground">정산 완료</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="affiliates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              제휴자 목록
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              레퍼럴 코드
            </TabsTrigger>
            <TabsTrigger value="settlement" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              정산 관리
            </TabsTrigger>
          </TabsList>

          {/* 제휴자 목록 탭 */}
          <TabsContent value="affiliates">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="제휴자 이름 또는 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">
                  제휴자 목록 ({filteredAffiliates.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-8 animate-pulse">
                    데이터를 불러오는 중...
                  </p>
                ) : filteredAffiliates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    등록된 제휴자가 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>연락처</TableHead>
                          <TableHead>정산 계좌</TableHead>
                          <TableHead className="text-center">코드 수</TableHead>
                          <TableHead className="text-center">사용 건수</TableHead>
                          <TableHead className="text-right">미정산 금액</TableHead>
                          <TableHead className="text-center">상태</TableHead>
                          <TableHead className="text-center">코드 발급</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAffiliates.map((affiliate) => (
                          <TableRow key={affiliate.id}>
                            <TableCell className="font-medium">
                              {affiliate.name}
                              {affiliate.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {affiliate.notes}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {affiliate.email && <p>{affiliate.email}</p>}
                              {affiliate.phone && (
                                <p className="text-muted-foreground">{affiliate.phone}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {affiliate.bank_name && affiliate.bank_account ? (
                                <>
                                  <p>{affiliate.bank_name}</p>
                                  <p className="text-muted-foreground">
                                    {affiliate.bank_account} ({affiliate.account_holder})
                                  </p>
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {affiliate.codes.length}
                            </TableCell>
                            <TableCell className="text-center">
                              {affiliate.usageCount}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {affiliate.unsettledAmount > 0 ? (
                                <span className="text-orange-600">
                                  {formatPrice(affiliate.unsettledAmount)}원
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0원</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={affiliate.is_active}
                                onCheckedChange={() => handleToggleAffiliateActive(affiliate)}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAffiliateId(affiliate.id);
                                  setShowAddCodeDialog(true);
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 레퍼럴 코드 탭 */}
          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">
                  레퍼럴 코드 목록 ({referralCodes.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-8 animate-pulse">
                    데이터를 불러오는 중...
                  </p>
                ) : referralCodes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    레퍼럴 코드가 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>코드</TableHead>
                          <TableHead>제휴자</TableHead>
                          <TableHead className="text-right">할인 금액</TableHead>
                          <TableHead className="text-right">보상 금액</TableHead>
                          <TableHead className="text-center">사용 횟수</TableHead>
                          <TableHead className="text-center">상태</TableHead>
                          <TableHead>생성일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referralCodes.map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-bold">
                              {code.code}
                            </TableCell>
                            <TableCell>{code.affiliates?.name || "-"}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(code.discount_amount)}원
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(code.reward_amount)}원
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {code.usage_count}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={code.is_active}
                                onCheckedChange={() => handleToggleCodeActive(code)}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
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
          </TabsContent>

          {/* 정산 관리 탭 */}
          <TabsContent value="settlement">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSettlementCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV 다운로드
                </Button>
                {selectedUsages.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSettleSelected}
                    disabled={isSettling}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isSettling ? "처리 중..." : `${selectedUsages.length}건 정산 완료 처리`}
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-normal">
                  미정산 내역 ({unsettledUsages.length}건 / {formatPrice(totalUnsettledAmount)}원)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-8 animate-pulse">
                    데이터를 불러오는 중...
                  </p>
                ) : unsettledUsages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    미정산 내역이 없습니다.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={
                                selectedUsages.length === unsettledUsages.length &&
                                unsettledUsages.length > 0
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsages(unsettledUsages.map((u) => u.id));
                                } else {
                                  setSelectedUsages([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>제휴자</TableHead>
                          <TableHead>코드</TableHead>
                          <TableHead>주문 ID</TableHead>
                          <TableHead className="text-right">보상 금액</TableHead>
                          <TableHead>사용일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unsettledUsages.map((usage) => (
                          <TableRow key={usage.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsages.includes(usage.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedUsages([...selectedUsages, usage.id]);
                                  } else {
                                    setSelectedUsages(selectedUsages.filter((id) => id !== usage.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {usage.referral_codes?.affiliates?.name || "-"}
                            </TableCell>
                            <TableCell className="font-mono">
                              {usage.referral_codes?.code || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {usage.order_id}
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-600">
                              {formatPrice(usage.reward_amount)}원
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(usage.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {settledUsages.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-normal">
                    정산 완료 내역 ({settledUsages.length}건 / {formatPrice(totalSettledAmount)}원)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>제휴자</TableHead>
                          <TableHead>코드</TableHead>
                          <TableHead>주문 ID</TableHead>
                          <TableHead className="text-right">보상 금액</TableHead>
                          <TableHead>사용일시</TableHead>
                          <TableHead>정산일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settledUsages.map((usage) => (
                          <TableRow key={usage.id}>
                            <TableCell className="font-medium">
                              {usage.referral_codes?.affiliates?.name || "-"}
                            </TableCell>
                            <TableCell className="font-mono">
                              {usage.referral_codes?.code || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {usage.order_id}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatPrice(usage.reward_amount)}원
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(usage.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {usage.settled_at ? formatDate(usage.settled_at) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* 제휴자 등록 다이얼로그 */}
      <Dialog open={showAddAffiliateDialog} onOpenChange={setShowAddAffiliateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>제휴자 등록</DialogTitle>
            <DialogDescription>
              새로운 제휴자 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="affiliateName">이름 *</Label>
              <Input
                id="affiliateName"
                placeholder="예: 홍길동 (고려대 학회장)"
                value={newAffiliate.name}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="affiliateEmail">이메일</Label>
                <Input
                  id="affiliateEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={newAffiliate.email}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliatePhone">연락처</Label>
                <Input
                  id="affiliatePhone"
                  placeholder="010-0000-0000"
                  value={newAffiliate.phone}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">은행명</Label>
              <Input
                id="bankName"
                placeholder="예: 국민은행"
                value={newAffiliate.bank_name}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, bank_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccount">계좌번호</Label>
                <Input
                  id="bankAccount"
                  placeholder="000-0000-0000-00"
                  value={newAffiliate.bank_account}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, bank_account: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolder">예금주</Label>
                <Input
                  id="accountHolder"
                  placeholder="예: 홍길동"
                  value={newAffiliate.account_holder}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, account_holder: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                placeholder="참고사항을 입력하세요"
                value={newAffiliate.notes}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAffiliateDialog(false);
                setNewAffiliate({ name: "", email: "", phone: "", bank_name: "", bank_account: "", account_holder: "", notes: "" });
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddAffiliate} disabled={isAddingAffiliate}>
              {isAddingAffiliate ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 레퍼럴 코드 발급 다이얼로그 */}
      <Dialog open={showAddCodeDialog} onOpenChange={setShowAddCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>레퍼럴 코드 발급</DialogTitle>
            <DialogDescription>
              제휴자에게 발급할 레퍼럴 코드를 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제휴자</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={selectedAffiliateId}
                onChange={(e) => setSelectedAffiliateId(e.target.value)}
              >
                <option value="">제휴자 선택</option>
                {affiliates
                  .filter((a) => a.is_active)
                  .map((affiliate) => (
                    <option key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codeInput">코드</Label>
              <div className="flex gap-2">
                <Input
                  value={newCodePrefix}
                  onChange={(e) => setNewCodePrefix(e.target.value.toUpperCase())}
                  className="w-20"
                />
                <Input
                  id="codeInput"
                  placeholder="KOREA01"
                  value={newCodeSuffix}
                  onChange={(e) => setNewCodeSuffix(e.target.value.toUpperCase())}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                최종 코드: <span className="font-mono font-bold">{newCodePrefix}{newCodeSuffix || "XXXXXX"}</span>
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-1">
              <p>• 할인 금액: <strong>10,000원</strong></p>
              <p>• 제휴자 보상: <strong>10,000원</strong></p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCodeDialog(false);
                setNewCodeSuffix("");
                setSelectedAffiliateId("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddReferralCode} disabled={isAddingCode}>
              {isAddingCode ? "생성 중..." : "코드 발급"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliatesAdmin;
