import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Statistics = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-light mb-4">통계 확인하기</h1>
              <p className="text-muted-foreground mb-8">
                나의 학습 통계를 확인하세요
              </p>
              <div className="bg-muted/50 rounded-lg p-12">
                <p className="text-muted-foreground">
                  서비스 준비 중입니다
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Statistics;