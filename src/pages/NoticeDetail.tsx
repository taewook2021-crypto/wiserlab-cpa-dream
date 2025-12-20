import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const NoticeDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: notice, isLoading, error } = useQuery({
    queryKey: ["notice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleDownload = () => {
    if (notice?.attachment_url && notice?.attachment_name) {
      const link = document.createElement('a');
      link.href = notice.attachment_url;
      link.download = notice.attachment_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-28">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/notice"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Link>

          {isLoading && (
            <div className="py-20 text-center text-gray-500">
              로딩 중...
            </div>
          )}

          {error && (
            <div className="py-20 text-center text-red-500">
              공지사항을 불러오는데 실패했습니다.
            </div>
          )}

          {!isLoading && !error && !notice && (
            <div className="py-20 text-center text-gray-500">
              존재하지 않는 공지사항입니다.
            </div>
          )}

          {notice && (
            <article>
              <header className="border-b border-gray-200 pb-6 mb-6">
                {notice.is_important && (
                  <span className="text-xs font-medium text-red-500 mb-2 block">
                    중요
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {notice.title}
                </h1>
                <time className="text-sm text-gray-500">
                  {format(new Date(notice.created_at), "yyyy.MM.dd")}
                </time>
              </header>

              <div className="prose prose-gray max-w-none whitespace-pre-wrap mb-8">
                {notice.content}
              </div>

              {/* 첨부파일 다운로드 */}
              {notice.attachment_url && notice.attachment_name && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">첨부파일</h3>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{notice.attachment_name}</span>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NoticeDetail;
