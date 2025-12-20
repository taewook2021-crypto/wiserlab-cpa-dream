import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

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

              <div className="prose prose-gray max-w-none whitespace-pre-wrap">
                {notice.content}
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NoticeDetail;
