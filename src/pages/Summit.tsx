import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/OptimizedImage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import summitFeature from "@/assets/summit-feature.jpg";
import summitProduct from "@/assets/summit-product.png";
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
  price: 30000
}, {
  id: "tax",
  name: "세법",
  description: "SUMMIT 모의고사 2회분",
  price: 30000
}];
const Summit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

    // 2과목 구매 시 10,000원 할인
    const hasDiscount = selectedSubjects.length >= 2;
    const discountAmount = hasDiscount ? 10000 : 0;
    return {
      totalPrice: total,
      discountedPrice: total - discountAmount,
      discount: discountAmount
    };
  }, [selectedSubjects]);
  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/auth?redirect=/summit");
      return;
    }

    if (selectedSubjects.length === 0) return;

    setIsAddingToCart(true);

    try {
      // 이미 장바구니에 있는 상품 확인
      const { data: existingItems } = await supabase
        .from("cart_items")
        .select("product_type")
        .eq("user_id", user.id);

      const existingProductTypes = existingItems?.map((item) => item.product_type) || [];

      const itemsToAdd = selectedSubjects
        .filter((subjectId) => !existingProductTypes.includes(`summit_${subjectId}`))
        .map((subjectId) => {
          const subject = subjects.find((s) => s.id === subjectId);
          return {
            user_id: user.id,
            product_type: `summit_${subjectId}`,
            product_name: `SUMMIT ${subject?.name} 모의고사`,
            price: subject?.price || 0,
          };
        });

      const duplicateCount = selectedSubjects.length - itemsToAdd.length;

      if (itemsToAdd.length === 0) {
        toast.error("이미 장바구니에 담긴 상품입니다.");
        return;
      }

      const { error } = await supabase.from("cart_items").insert(itemsToAdd);

      if (error) {
        toast.error("장바구니에 담기를 실패했습니다.");
        return;
      }

      if (duplicateCount > 0) {
        toast.success(`${itemsToAdd.length}개 상품을 담았습니다. (${duplicateCount}개는 이미 장바구니에 있음)`);
      } else {
        toast.success("장바구니에 담았습니다.");
      }
      setSelectedSubjects([]);
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsAddingToCart(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        {/* Product Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">
              {/* Left: Product Image */}
              <div className="flex items-center justify-center">
                <OptimizedImage 
                  src={summitProduct} 
                  alt="Wiser Lab SUMMIT 모의고사 패키지" 
                  className="w-full max-w-2xl object-contain"
                  containerClassName="w-full max-w-2xl"
                />
              </div>

              {/* Right: Product Info */}
              <div className="space-y-10">
                <div>
                  <h1 className="text-3xl font-light mb-6">Wiser Lab SUMMIT PACK</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    가장 실전적인 모의고사, SUMMIT
                  </p>
                </div>

                {/* Discount Info */}
                <div className="space-y-3 py-8 border-y border-border">
                  <p className="text-sm">
                    <span className="text-primary font-medium">
                      2과목 구매 시 10,000원 할인
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    * 한 번의 주문으로 함께 구매 시 할인 및 사은품이 제공됩니다.
                  </p>
                </div>

                {/* Subject Selection */}
                <div className="space-y-6">
                  {subjects.map(subject => <div key={subject.id} className="flex items-center justify-between py-5 border-b border-border">
                      <div className="flex items-center gap-4">
                        <Checkbox id={subject.id} checked={selectedSubjects.includes(subject.id)} onCheckedChange={() => handleSubjectToggle(subject.id)} />
                        <label htmlFor={subject.id} className="cursor-pointer">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {subject.description}
                          </p>
                        </label>
                      </div>
                      <p className="font-medium">{formatPrice(subject.price)}원</p>
                    </div>)}

                  {/* Select All */}
                  <div className="flex items-center justify-between py-5 border-b border-border">
                    <div className="flex items-center gap-4">
                      <Checkbox id="all" checked={selectedSubjects.length === subjects.length} onCheckedChange={handleSelectAll} />
                      <label htmlFor="all" className="cursor-pointer">
                        <p className="font-medium">전과목 PACK</p>
                        <p className="text-sm text-muted-foreground">
                          SUMMIT 모의고사 2회분 세트
                        </p>
                      </label>
                    </div>
                    <div className="text-right">
                      {selectedSubjects.length === subjects.length && discount > 0 && <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(totalPrice)}원
                        </p>}
                      <p className="font-medium">
                        {formatPrice(subjects.reduce((sum, s) => sum + s.price, 0) - 10000)}원
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>* 본 상품은 2025년 CPA 1차 시험 대비용 콘텐츠로, 시험 종료 후에는 구매가 불가합니다.</p>
                </div>

                {/* Total & CTA */}
                <div className="pt-8 border-t border-border space-y-6">
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
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-14 text-base font-normal" 
                      disabled={selectedSubjects.length === 0 || isAddingToCart}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isAddingToCart ? "담는 중..." : "장바구니에 담기"}
                    </Button>
                    <Button 
                      className="flex-1 h-14 text-base font-normal" 
                      disabled={selectedSubjects.length === 0}
                    >
                      바로구매 하기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="grid md:grid-cols-2">
            {/* Left: Image */}
            <OptimizedImage 
              src={summitFeature}
              alt="SUMMIT 모의고사 특징"
              className="w-full h-full object-cover"
              containerClassName="aspect-square md:aspect-auto md:min-h-[700px]"
            />

            {/* Right: Features */}
            <div className="bg-background p-16 md:p-24 flex flex-col justify-center">
              <div className="space-y-16">
                <div className="pb-16 border-b border-border">
                  <h3 className="text-xl font-medium mb-6">모든 곳에서 완벽함을 추구하다</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    문항의 배치부터 시험지의 양식까지, SUMMIT 모의고사는 실제 CPA 시험지와 동일하게 구현했습니다.
                  </p>
                </div>

                <div className="pb-16 border-b border-border">
                  <h3 className="text-xl font-medium mb-6">객관적 평가가 가능한 모의고사를</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    서울대 데이터 기반의 정밀 분석으로 객관적 평가 기회를 제공합니다.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-6">트렌디하며 기본에 충실한 모의고사를</h3>
                  <p className="text-muted-foreground leading-relaxed">출제 가능성이 전혀 없는 주제를 다루지 않으며, 최근 1차 시험의 난이도를 반영한 가장 실전적인 모의고사입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 출제진 소개 Section */}
        <section className="py-24 md:py-32 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-light text-center mb-20">출제진 소개</h2>

              <div className="grid md:grid-cols-2 gap-16 md:gap-24">
                {/* 재무회계 */}
                <div className="space-y-10">
                  <h3 className="text-xl font-medium border-b border-border pb-6">재무회계</h3>
                  <div className="space-y-3">
                    <p className="text-lg font-medium">김용재</p>
                    <p className="text-sm text-muted-foreground">
                      스마트 경영 아카데미 재무회계 강사
                    </p>
                  </div>
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground">
                      서울대학교 출신 공인회계사 7명 출제팀
                    </p>
                    <div className="space-y-2 pl-4 border-l-2 border-border">
                      <p>2024년 2차 재무회계 133점</p>
                      <p className="text-xs">(서울대학교 경제학부 출신 공인회계사)</p>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-border">
                      <p>2025년 2차 고급회계 42점</p>
                      <p className="text-xs">(서울대학교 경영학과 출신 공인회계사)</p>
                    </div>
                  </div>
                </div>

                {/* 세법 */}
                <div className="space-y-10">
                  <h3 className="text-xl font-medium border-b border-border pb-6">세법</h3>
                  <div className="space-y-3">
                    <p className="text-lg font-medium">오정화</p>
                    <p className="text-sm text-muted-foreground">바른생각 세법 강사</p>
                  </div>
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground">
                      서울대학교 출신 공인회계사 5명 출제팀
                    </p>
                    <div className="pl-4 border-l-2 border-border">
                      <p>전원 2025년 세법 2차 75점 이상</p>
                    </div>
                  </div>
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