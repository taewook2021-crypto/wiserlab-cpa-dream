import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import mountainHero from "@/assets/mountain-hero.jpg";
import summitProduct from "@/assets/summit-product.jpg";
interface Subject {
  id: string;
  name: string;
  description: string;
  price: number;
}
const subjects: Subject[] = [{
  id: "financial",
  name: "재무회계",
  description: "SUMMIT 모의고사 2회분",
  price: 25000
}, {
  id: "tax",
  name: "세법",
  description: "SUMMIT 모의고사 2회분",
  price: 25000
}];
const Summit = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
  };
  const handleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects.map(s => s.id));
    }
  };
  const {
    totalPrice,
    discountedPrice,
    discount
  } = useMemo(() => {
    const selected = subjects.filter(s => selectedSubjects.includes(s.id));
    const total = selected.reduce((sum, s) => sum + s.price, 0);

    // 2과목 구매 시 10% 할인
    const hasDiscount = selectedSubjects.length >= 2;
    const discountAmount = hasDiscount ? Math.floor(total * 0.1) : 0;
    return {
      totalPrice: total,
      discountedPrice: total - discountAmount,
      discount: discountAmount
    };
  }, [selectedSubjects]);
  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Product Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left: Product Image */}
              <div className="aspect-square bg-[#b8d4e3] flex items-center justify-center">
                <img src={summitProduct} alt="Wiser Lab SUMMIT 모의고사 패키지" className="w-full h-full object-cover" />
              </div>

              {/* Right: Product Info */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-light mb-4">Wiser Lab SUMMIT PACK</h1>
                  <p className="text-muted-foreground leading-relaxed">가장 실전적인 모의고사, SUMMIT </p>
                </div>

                {/* Discount Info */}
                <div className="space-y-2 py-6 border-y border-border">
                  <p className="text-sm">
                    <span className="text-primary font-medium">2과목 구매 시 10% 할인 + 해설 강의 무료 제공</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    * 한 번의 주문으로 함께 구매 시 할인 및 사은품이 제공됩니다.
                  </p>
                </div>

                {/* Subject Selection */}
                <div className="space-y-4">
                  {subjects.map(subject => <div key={subject.id} className="flex items-center justify-between py-4 border-b border-border">
                      <div className="flex items-center gap-4">
                        <Checkbox id={subject.id} checked={selectedSubjects.includes(subject.id)} onCheckedChange={() => handleSubjectToggle(subject.id)} />
                        <label htmlFor={subject.id} className="cursor-pointer">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        </label>
                      </div>
                      <p className="font-medium">{formatPrice(subject.price)}원</p>
                    </div>)}

                  {/* Select All */}
                  <div className="flex items-center justify-between py-4 border-b border-border">
                    <div className="flex items-center gap-4">
                      <Checkbox id="all" checked={selectedSubjects.length === subjects.length} onCheckedChange={handleSelectAll} />
                      <label htmlFor="all" className="cursor-pointer">
                        <p className="font-medium">전과목 PACK</p>
                        <p className="text-sm text-muted-foreground">SUMMIT 모의고사 2회분 세트</p>
                      </label>
                    </div>
                    <div className="text-right">
                      {selectedSubjects.length === subjects.length && discount > 0 && <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(totalPrice)}원
                        </p>}
                      <p className="font-medium">
                        {formatPrice(subjects.reduce((sum, s) => sum + s.price, 0) * 0.9)}원
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• 50,000원 이상 구매 시 무료 배송</p>
                  <p>• 시험 일정: 2025년 3월 2일 시행 예정</p>
                  <p className="text-xs">* 본 상품은 2025년 CPA 1차 시험 대비용 콘텐츠로, 시험 종료 후에는 구매가 불가합니다.</p>
                </div>

                {/* Total & CTA */}
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">총 상품금액</p>
                    <div className="text-right">
                      {discount > 0 && <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(totalPrice)}원
                        </p>}
                      <p className="text-2xl font-medium">
                        {formatPrice(discountedPrice)}원
                      </p>
                    </div>
                  </div>
                  <Button className="w-full h-14 text-base font-normal" disabled={selectedSubjects.length === 0}>
                    바로구매 하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section (Empty Placeholder) */}
        <section className="py-20 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-6xl text-muted-foreground/30 mb-8">"</p>
              <p className="text-xl text-muted-foreground italic">
                {/* 후기 내용이 들어갈 자리입니다 */}
              </p>
              <p className="text-sm text-muted-foreground mt-6">
                {/* 후기 작성자 정보 */}
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-0">
          <div className="grid md:grid-cols-2">
            {/* Left: Image */}
            <div className="aspect-square md:aspect-auto md:min-h-[600px] bg-cover bg-center" style={{
            backgroundImage: `url(${mountainHero})`
          }} />

            {/* Right: Features */}
            <div className="bg-background p-12 md:p-16 flex flex-col justify-center">
              <div className="space-y-12">
                <div className="pb-12 border-b border-border">
                  <h3 className="text-xl font-medium mb-4">모든 곳에서 완벽함을 추구하다</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    문항의 배치부터 시험지의 양식까지, SUMMIT 모의고사는 실제 CPA 시험지와 동일하게 구현했습니다.
                  </p>
                </div>

                <div className="pb-12 border-b border-border">
                  <h3 className="text-xl font-medium mb-4">객관적 평가가 가능한 모의고사를</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    서울대 데이터 기반의 정밀 분석으로 객관적 평가 기회를 제공합니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-4">트렌디하며 기본에 충실한 모의고사를</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    당해 출제 경향을 반영하면서, 다양한 관점의 문항을 출제합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default Summit;