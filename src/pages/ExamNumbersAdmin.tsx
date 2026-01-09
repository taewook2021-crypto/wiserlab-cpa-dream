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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  exam_number: string;
  created_at: string;
  email: string | null;
}

const ExamNumbersAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

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

  // Fetch user profiles with exam numbers
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!isAdmin) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, exam_number, created_at, email")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProfiles(data);
      }
    };

    fetchProfiles();
  }, [isAdmin]);

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
            <div className="max-w-4xl mx-auto">
              <AdminNav />
              <h1 className="text-3xl font-light mb-4">수험번호 관리</h1>
              <p className="text-muted-foreground mb-8">
                가입자 수: {profiles.length}명
              </p>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>수험번호</TableHead>
                      <TableHead>카카오 이메일</TableHead>
                      <TableHead>가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          가입된 사용자가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-mono font-medium">
                            {profile.exam_number}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {profile.email || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString("ko-KR")}
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
