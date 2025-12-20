import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Edit, Plus, X } from "lucide-react";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
}

const NoticeAdmin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notice[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; is_important: boolean }) => {
      const { error } = await supabase.from("notices").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("공지사항이 등록되었습니다.");
      resetForm();
    },
    onError: () => {
      toast.error("공지사항 등록에 실패했습니다.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title: string; content: string; is_important: boolean } }) => {
      const { error } = await supabase.from("notices").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("공지사항이 수정되었습니다.");
      resetForm();
    },
    onError: () => {
      toast.error("공지사항 수정에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      toast.success("공지사항이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("공지사항 삭제에 실패했습니다.");
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsImportant(false);
    setEditingNotice(null);
    setIsFormOpen(false);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setIsImportant(notice.is_important);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }

    const data = { title: title.trim(), content: content.trim(), is_important: isImportant };

    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-gray-500">로그인이 필요합니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-gray-500">권한 확인 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-28">
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-gray-500">관리자 권한이 필요합니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-28">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">공지사항 관리</h1>
            {!isFormOpen && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                새 공지사항
              </Button>
            )}
          </div>

          {isFormOpen && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="내용"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isImportant"
                    checked={isImportant}
                    onCheckedChange={(checked) => setIsImportant(checked === true)}
                  />
                  <label htmlFor="isImportant" className="text-sm cursor-pointer">
                    중요 공지로 표시
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingNotice ? "수정" : "등록"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    취소
                  </Button>
                </div>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-gray-500">로딩 중...</div>
          ) : (
            <div className="border-t border-gray-200">
              {notices?.map((notice) => (
                <div
                  key={notice.id}
                  className="py-5 border-b border-gray-200 flex justify-between items-start gap-4"
                >
                  <div className="flex-1">
                    {notice.is_important && (
                      <span className="text-xs font-medium text-red-500">중요</span>
                    )}
                    <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(notice.created_at), "yyyy.MM.dd")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("정말 삭제하시겠습니까?")) {
                          deleteMutation.mutate(notice.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {notices?.length === 0 && (
                <div className="py-20 text-center text-gray-500">
                  등록된 공지사항이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NoticeAdmin;
