import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Download, RefreshCw, Trash2 } from "lucide-react";

interface ExamNumber {
  id: string;
  exam_number: string;
  batch_name: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

// 혼동 문자 제외: 0, O, 1, I, L
const VALID_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const generateRandomCode = (length: number): string => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += VALID_CHARS.charAt(Math.floor(Math.random() * VALID_CHARS.length));
  }
  return result;
};

const generateExamNumber = (): string => {
  return `WLP-${generateRandomCode(4)}`;
};

const ExamNumbersAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [examNumbers, setExamNumbers] = useState<ExamNumber[]>([]);
  const [generating, setGenerating] = useState(false);
  const [batchName, setBatchName] = useState("서울대/연세대 150명");
  const [count, setCount] = useState(150);

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

  // Fetch exam numbers
  const fetchExamNumbers = async () => {
    const { data, error } = await supabase
      .from("exam_numbers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("수험번호 목록을 불러오는데 실패했습니다");
      return;
    }

    setExamNumbers(data || []);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchExamNumbers();
    }
  }, [isAdmin]);

  // Generate exam numbers
  const handleGenerate = async () => {
    if (!batchName.trim()) {
      toast.error("배치명을 입력해주세요");
      return;
    }

    setGenerating(true);

    try {
      // Generate unique exam numbers
      const existingNumbers = new Set(examNumbers.map((e) => e.exam_number));
      const newNumbers: string[] = [];

      while (newNumbers.length < count) {
        const num = generateExamNumber();
        if (!existingNumbers.has(num) && !newNumbers.includes(num)) {
          newNumbers.push(num);
        }
      }

      // Insert to database
      const { error } = await supabase.from("exam_numbers").insert(
        newNumbers.map((num) => ({
          exam_number: num,
          batch_name: batchName,
        }))
      );

      if (error) throw error;

      toast.success(`${count}개의 수험번호가 생성되었습니다`);
      fetchExamNumbers();
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("수험번호 생성에 실패했습니다");
    } finally {
      setGenerating(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const unusedNumbers = examNumbers.filter((e) => !e.is_used);
    const csv = [
      ["수험번호", "배치명", "생성일시"],
      ...unusedNumbers.map((e) => [
        e.exam_number,
        e.batch_name,
        new Date(e.created_at).toLocaleString("ko-KR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `exam_numbers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Delete all unused
  const handleDeleteUnused = async () => {
    if (!confirm("미사용 수험번호를 모두 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("exam_numbers")
      .delete()
      .eq("is_used", false);

    if (error) {
      toast.error("삭제에 실패했습니다");
      return;
    }

    toast.success("미사용 수험번호가 삭제되었습니다");
    fetchExamNumbers();
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

  const usedCount = examNumbers.filter((e) => e.is_used).length;
  const unusedCount = examNumbers.filter((e) => !e.is_used).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-light mb-8">수험번호 관리</h1>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-medium">{examNumbers.length}</p>
                  <p className="text-sm text-muted-foreground">전체</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-medium text-primary">{usedCount}</p>
                  <p className="text-sm text-muted-foreground">사용됨</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-medium">{unusedCount}</p>
                  <p className="text-sm text-muted-foreground">미사용</p>
                </div>
              </div>

              {/* Generate Form */}
              <div className="border border-border rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium mb-4">수험번호 생성</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>배치명</Label>
                    <Input
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="예: 서울대/연세대 150명"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>생성 개수</Label>
                    <Input
                      type="number"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                      min={1}
                      max={500}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  * 형식: WLP-XXXX (4자리 랜덤 영숫자, 혼동 문자 제외)
                </p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? "생성 중..." : `${count}개 생성하기`}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mb-6">
                <Button variant="outline" onClick={fetchExamNumbers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button variant="outline" onClick={handleDownloadCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV 다운로드 (미사용만)
                </Button>
                <Button variant="destructive" onClick={handleDeleteUnused}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  미사용 전체 삭제
                </Button>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수험번호</TableHead>
                      <TableHead>배치명</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>사용 시점</TableHead>
                      <TableHead>생성일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examNumbers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          생성된 수험번호가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      examNumbers.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono font-medium">
                            {item.exam_number}
                          </TableCell>
                          <TableCell>{item.batch_name}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.is_used
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.is_used ? "사용됨" : "미사용"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.used_at
                              ? new Date(item.used_at).toLocaleString("ko-KR")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(item.created_at).toLocaleString("ko-KR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExamNumbersAdmin;
