import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";

interface NoticeItem {
  id: string;
  title: string;
  is_important: boolean;
  created_at: string;
}

const Notice = () => {
  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, is_important, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NoticeItem[];
    },
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-28">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-8">공지사항</h1>

          {/* Loading State */}
          {isLoading && (
            <div className="py-20 text-center text-gray-500">
              로딩 중...
            </div>
          )}

          {/* Notice List */}
          {!isLoading && (
            <div className="border-t border-gray-200">
              {notices?.map((notice) => (
                <Link
                  key={notice.id}
                  to={`/notice/${notice.id}`}
                  className="py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer block"
                >
                  <div className="flex flex-col gap-2">
                    {notice.is_important && (
                      <span className="text-xs font-medium text-red-500">
                        중요
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900">
                      {notice.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(notice.created_at), "yyyy.MM.dd")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && notices?.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              등록된 공지사항이 없습니다.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notice;
