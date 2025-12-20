import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface NoticeItem {
  id: number;
  title: string;
  date: string;
  isImportant: boolean;
}

const noticeData: NoticeItem[] = [
  {
    id: 1,
    title: "SUMMIT 서비스 오픈 안내",
    date: "2024.12.20",
    isImportant: true,
  },
  {
    id: 2,
    title: "상담 / 문의 운영 시간 안내",
    date: "2024.12.15",
    isImportant: true,
  },
  {
    id: 3,
    title: "회계사 시험 대비 콘텐츠 업데이트 안내",
    date: "2024.12.10",
    isImportant: false,
  },
  {
    id: 4,
    title: "세무사 시험 대비 콘텐츠 업데이트 안내",
    date: "2024.12.05",
    isImportant: false,
  },
];

const Notice = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-8">공지사항</h1>

          {/* Notice List */}
          <div className="border-t border-gray-200">
            {noticeData.map((notice) => (
              <div
                key={notice.id}
                className="py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-2">
                  {notice.isImportant && (
                    <span className="text-xs font-medium text-red-500">
                      중요
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {notice.title}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {notice.date}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State (for when there are no notices) */}
          {noticeData.length === 0 && (
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
