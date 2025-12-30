import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import summitFeature from "@/assets/summit-feature.png";
import summitCover from "@/assets/summit-cover.png";
import { useState } from "react";

const BUNDLE_PRICE = 50000;

// Preload critical images immediately (outside component)
const preloadedCover = new Image();
preloadedCover.src = summitCover;
const preloadedFeature = new Image();
preloadedFeature.src = summitFeature;

// Static data moved outside component to prevent recreation
const FEATURES = [
  {
    title: "모든 곳에서 완벽함을 추구하다",
    description: "문항의 배치부터 시험지의 양식까지, SUMMIT 모의고사는 실제 CPA 시험지와 동일하게 구현했습니다.",
  },
  {
    title: "객관적 평가가 가능한 모의고사를",
    description: "서울대학교, 연세대학교 최상위권 데이터\n기반으로 객관적인 평가 기회를 제공합니다.",
  },
  {
    title: "트렌디하며 기본에 충실한 모의고사를",
    description: "출제 가능성이 전혀 없는 주제를 다루지 않으며, 최근 1차 시험의 난이도를 반영한 가장 실전적인 모의고사입니다.",
  },
  {
    title: "2026 개정세법 완벽 반영",
    description: "2025년 12월 법률 개정안까지 반영 완료.\n시험일까지 개정세법 영향 문제를 지속적으로 업데이트합니다.",
  },
] as const;

const PRODUCT_SECTIONS = [
  {
    subject: "SUMMIT 재무회계",
    features: [
      {
        title: "낯선 어려움이 아닌, 기출의 어려움",
        description: "최근 기출과 유사한 난이도로 구성했습니다. 단순히 어렵게 만든 문제가 아니라, 기출에서 고난이도를 만드는 요소를 분해하고 그대로 반영했습니다. 그래서 '낯선 어려움'이 아니라 익숙한 시험 난이도로 실력을 드러냅니다.",
      },
      {
        title: "시험지+OMR까지, 실전 그대로",
        description: "실제 시험지 구성 + OMR 마킹까지 포함한 실전 연습으로 3교시 재무회계에서 흔들리지 않는 속도·정확도 루틴을 완성합니다. 계산 자체보다 더 중요한 풀이 순서·버릴 문제·끝까지 가져갈 문제가 정리됩니다.",
      },
      {
        title: "오답이 곧 단권화로",
        description: "틀린 문항은 끝나지 않습니다. 유사 기출을 시험지 형태로 재구성해 PDF로 바로 인출할 수 있어 파이널 기간의 공회전을 끊고 단권화로 밀어붙일 수 있습니다.",
      },
      {
        title: "내 점수의 '의미'가 보인다",
        description: "그리고, 위치가 보입니다. 안정권 / 경합권 / 레드라인. 감상이 아니라 내 점수의 의미가 숫자로 보이면, 파이널 기간의 공부 방향이 보입니다.",
      },
      {
        title: "정답이 아니라 사고 흐름",
        description: "마지막으로, 해설은 단순한 정답 풀이가 아닙니다. 문항별로 실전에서 점수를 남기는 초고득점자들의 사고 흐름을 남겨, 다음 시험에서 같은 유형을 만나도 같은 방식으로 맞히게 만듭니다.",
      },
    ],
  },
  {
    subject: "SUMMIT 세법",
    intro: "최근 세법은 어렵고, 과락은 늘었고, 그런데 시장엔 내 현재 위치를 정확히 보여주는 콘텐츠가 부족합니다. SUMMIT 세법은 \"많이 푸는 자료\"가 아니라, 방향을 잡는 시험지입니다.",
    features: [
      {
        title: "2026 개정세법",
        description: "전 문항을 2026년 기준 개정세법으로 구성했습니다. 남은 기간에도 시행령·개정안 등 변동 요소를 반영해 유료 구입자에게 업데이트를 지속 제공합니다.",
      },
      {
        title: "전략이 결과로 정해진다",
        description: "2회분을 풀면, 전략이 선명해집니다. 남은 기간 말문제를 더 할지 / 계산문제를 더 할지, 그리고 어떤 단원에서 점수를 방어해야 하는지 '감'이 아니라 결과로 결정할 수 있습니다.",
      },
      {
        title: "내 점수의 '의미'가 보인다",
        description: "그리고, 위치가 보입니다. 안정권 / 경합권 / 레드라인. 전국모고만으로는 알 수 없는 \"내 점수의 의미\"를 해석합니다.",
      },
      {
        title: "정답이 아니라 사고 흐름",
        description: "해설은 결론만 말하지 않습니다. 어떤 선택을 해야 점수가 남는지, 파이널에서 무엇을 붙잡아야 하는지까지 시험 관점으로 정리해 둡니다.",
      },
    ],
  },
];

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const Summit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);


  const handleAddToCart = useCallback(async () => {
    if (!user) {
      navigate("/auth?redirect=/summit");
      return;
    }

    setIsAddingToCart(true);

    try {
      const { data: existingItems } = await supabase
        .from("cart_items")
        .select("product_type")
        .eq("user_id", user.id)
        .eq("product_type", "summit_bundle");

      if (existingItems && existingItems.length > 0) {
        toast.error("이미 장바구니에 담긴 상품입니다.");
        return;
      }

      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_type: "summit_bundle",
        product_name: "SUMMIT 전과목 PACK (재무회계 + 세법)",
        price: BUNDLE_PRICE,
      });

      if (error) {
        toast.error("장바구니에 담기를 실패했습니다.");
        return;
      }

      toast.success("장바구니에 담았습니다.");
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsAddingToCart(false);
    }
  }, [user, navigate]);

  const handlePurchase = useCallback(() => {
    if (!user) {
      navigate("/auth?redirect=/summit");
      return;
    }
    navigate("/payment?items=bundle");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        {/* Product Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-12 sm:py-16 md:py-28">
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-10 md:gap-20 items-start">
              {/* Left: Product Image */}
              <div className="flex items-center justify-center">
                <div className="shadow-xl rounded-sm overflow-hidden w-[180px] sm:w-[180px] md:w-[280px] lg:w-[400px]">
                  <img
                    src={summitCover}
                    alt="Wiser Lab SUMMIT 모의고사 패키지"
                    className="w-full h-auto object-contain"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>

              {/* Right: Product Info */}
              <div className="space-y-3 sm:space-y-3 md:space-y-6 lg:space-y-10">
                <div>
                  <h1 className="text-lg sm:text-lg md:text-xl lg:text-3xl font-light mb-2 sm:mb-2 md:mb-4 lg:mb-6">
                    Wiser Lab SUMMIT PACK
                  </h1>
                  <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-base text-muted-foreground leading-relaxed">
                    가장 실전적인 모의고사, SUMMIT
                  </p>
                </div>

                {/* Product Info */}
                <div className="space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6 py-4 sm:py-4 md:py-5 lg:py-8 border-y border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-xs md:text-sm lg:text-base font-medium">전과목 PACK</p>
                      <p className="text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
                        재무회계 + 세법 모의고사 각 2회분
                      </p>
                    </div>
                    <p className="text-lg sm:text-lg md:text-lg lg:text-2xl font-medium">
                      {formatPrice(BUNDLE_PRICE)}원
                    </p>
                  </div>
                </div>

                {/* Delivery & Notice */}
                <div className="space-y-1 sm:space-y-1 md:space-y-2 lg:space-y-3 text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
                  <p className="text-foreground font-medium">
                    배송 안내: 결제 완료 후 영업일 기준 2~3일 이내 출고
                  </p>
                  <p>
                    * 본 상품은 2026년 CPA 1차 시험 대비용 모의고사로, 시험 종료
                    후에는 구매가 불가합니다.
                  </p>
                  <p>* 재무회계, 세법 개별 구매는 불가합니다.</p>
                </div>

                {/* Total & CTA */}
                <div className="pt-4 sm:pt-4 md:pt-5 lg:pt-8 border-t border-border space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">총 상품금액</p>
                    <p className="text-lg sm:text-lg md:text-lg lg:text-2xl font-medium">
                      {formatPrice(BUNDLE_PRICE)}원
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-2 md:gap-2 lg:gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 sm:h-10 md:h-11 lg:h-14 text-xs sm:text-xs md:text-xs lg:text-base font-normal"
                      disabled={isAddingToCart}
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 mr-1 sm:mr-1 md:mr-1 lg:mr-2" />
                      {isAddingToCart ? "담는 중..." : "장바구니에 담기"}
                    </Button>
                    <Button
                      className="flex-1 h-10 sm:h-10 md:h-11 lg:h-14 text-xs sm:text-xs md:text-xs lg:text-base font-normal"
                      onClick={handlePurchase}
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
        <section className="py-16 sm:py-20 md:py-28 border-b border-border">
          <div className="grid sm:grid-cols-2">
            {/* Left: Image */}
            <div className="aspect-square sm:aspect-auto sm:min-h-[500px] md:min-h-[700px] overflow-hidden">
              <img
                src={summitFeature}
                alt="SUMMIT 모의고사 특징"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Right: Features */}
            <div className="bg-background p-8 sm:p-10 md:p-24 flex flex-col justify-center">
              <div className="space-y-8 sm:space-y-10 md:space-y-16">
                {FEATURES.map((feature, index) => (
                  <div
                    key={index}
                    className={index < FEATURES.length - 1 ? "pb-8 sm:pb-10 md:pb-16 border-b border-border" : ""}
                  >
                    <h3 className="text-sm sm:text-base md:text-xl font-medium mb-3 sm:mb-4 md:mb-6">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-xs md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Detail Sections */}
        {PRODUCT_SECTIONS.map((section, sectionIndex) => (
          <section 
            key={section.subject}
            className={`py-16 sm:py-20 md:py-28 border-b border-border ${sectionIndex % 2 === 1 ? 'bg-muted/30' : ''}`}
          >
            <div className="container mx-auto px-6">
              <div className={`grid sm:grid-cols-2 gap-8 md:gap-16 items-start ${sectionIndex % 2 === 1 ? 'sm:grid-flow-dense' : ''}`}>
                {/* Image Placeholder */}
                <div className={`flex justify-center ${sectionIndex % 2 === 1 ? 'sm:col-start-2' : ''}`}>
                  <div className="bg-muted w-full max-w-[500px] aspect-[4/3] rounded-lg flex items-center justify-center text-muted-foreground border border-border sticky top-24">
                    <span className="text-sm">이미지 추가 예정</span>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className={`space-y-8 md:space-y-10 ${sectionIndex % 2 === 1 ? 'sm:col-start-1 sm:row-start-1' : ''}`}>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">
                    {section.subject}
                  </h2>
                  
                  {section.intro && (
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
                      {section.intro}
                    </p>
                  )}
                  
                  <div className="space-y-6 md:space-y-8">
                    {section.features.map((feature, index) => (
                      <div 
                        key={index}
                        className={index < section.features.length - 1 ? "pb-6 md:pb-8 border-b border-border" : ""}
                      >
                        <h3 className="text-sm md:text-base lg:text-lg font-semibold mb-3 md:mb-4">
                          [{feature.title}]
                        </h3>
                        <p className="text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

      </main>

      <Footer />
    </div>
  );
};

export default Summit;
