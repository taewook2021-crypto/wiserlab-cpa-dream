import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminNav from "@/components/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, RefreshCw, Download, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FreeCodeWithUser {
  id: string;
  exam_number: string;
  batch_name: string;
  is_used: boolean;
  used_at: string | null;
  user_id: string | null;
  created_at: string;
  user_email?: string;
}

const FreeCodesAdmin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [freeCodes, setFreeCodes] = useState<FreeCodeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCodePrefix, setNewCodePrefix] = useState("WLP-");
  const [newCodeSuffix, setNewCodeSuffix] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      setIsAdmin(data === true);
    };
    checkAdmin();
  }, []);

  // 무료 코드 데이터 로드
  const fetchFreeCodes = async () => {
    setLoading(true);
    
    // exam_numbers 테이블에서 무료 코드 조회 (WLP- 접두사)
    const { data: codes, error } = await supabase
      .from('exam_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching free codes:', error);
      setLoading(false);
      return;
    }

    // user_id가 있는 코드들의 이메일 정보 가져오기
    // profiles 테이블에서 user_id로 조회하고, auth.users의 email은 직접 접근 불가하므로
    // 일단 user_id만 표시
    setFreeCodes(codes || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFreeCodes();
    }
  }, [isAdmin]);

  // 검색 필터링
  const filteredCodes = freeCodes.filter(code => 
    code.exam_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.batch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.user_id && code.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 통계
  const totalCodes = freeCodes.length;
  const usedCodes = freeCodes.filter(c => c.is_used).length;
  const unusedCodes = totalCodes - usedCodes;

  // 코드 추가 함수
  const handleAddCode = async () => {
    const examNumber = `${newCodePrefix}${newCodeSuffix}`.toUpperCase();
    
    if (!newCodeSuffix.trim()) {
      toast({
        title: "오류",
        description: "코드 접미사를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newBatchName.trim()) {
      toast({
        title: "오류",
        description: "배치명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 중복 체크
      const { data: existing } = await supabase
        .from('exam_numbers')
        .select('id')
        .eq('exam_number', examNumber)
        .maybeSingle();

      if (existing) {
        toast({
          title: "오류",
          description: "이미 존재하는 코드입니다.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('exam_numbers')
        .insert({
          exam_number: examNumber,
          batch_name: newBatchName.trim(),
          is_used: false,
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: `코드 ${examNumber}가 추가되었습니다.`,
      });

      // 폼 초기화 및 목록 새로고침
      setNewCodeSuffix("");
      setNewBatchName("");
      setIsAddDialogOpen(false);
      fetchFreeCodes();
    } catch (error) {
      console.error('Error adding code:', error);
      toast({
        title: "오류",
        description: "코드 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const headers = ['코드', '배치명', '사용여부', '카카오톡 ID', '사용일시', '생성일시'];
    const rows = filteredCodes.map(code => [
      code.exam_number,
      code.batch_name,
      code.is_used ? '사용됨' : '미사용',
      code.user_id || '-',
      code.used_at ? new Date(code.used_at).toLocaleString('ko-KR') : '-',
      new Date(code.created_at).toLocaleString('ko-KR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `free-codes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">접근 권한이 없습니다.</p>
        <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
        
        <AdminNav />

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 코드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalCodes}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">사용된 코드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{usedCodes}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">미사용 코드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">{unusedCodes}개</p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 액션 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="코드, 배치명, 카카오톡 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  코드 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>무료 코드 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-number">코드</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code-prefix"
                        value={newCodePrefix}
                        onChange={(e) => setNewCodePrefix(e.target.value.toUpperCase())}
                        className="w-24"
                        placeholder="WLP-"
                      />
                      <Input
                        id="code-suffix"
                        value={newCodeSuffix}
                        onChange={(e) => setNewCodeSuffix(e.target.value.toUpperCase())}
                        placeholder="S001"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최종 코드: {newCodePrefix}{newCodeSuffix || "____"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-name">배치명</Label>
                    <Input
                      id="batch-name"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      placeholder="예: 서울대 1차"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button onClick={handleAddCode} disabled={isSubmitting}>
                    {isSubmitting ? "추가 중..." : "추가"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={fetchFreeCodes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </div>

        {/* 코드 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>무료 코드 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>배치명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>카카오톡 ID</TableHead>
                    <TableHead>사용일시</TableHead>
                    <TableHead>생성일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 무료 코드가 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-medium">{code.exam_number}</TableCell>
                        <TableCell>{code.batch_name}</TableCell>
                        <TableCell>
                          {code.is_used ? (
                            <Badge variant="default" className="bg-green-600">사용됨</Badge>
                          ) : (
                            <Badge variant="secondary">미사용</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {code.user_id ? (
                            <span className="truncate max-w-[150px] inline-block" title={code.user_id}>
                              {code.user_id.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {code.used_at ? new Date(code.used_at).toLocaleString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(code.created_at).toLocaleString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default FreeCodesAdmin;
