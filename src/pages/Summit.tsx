import { useNavigate } from "react-router-dom";
import { useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import summitFeature from "@/assets/summit-front.png";
import summitCover from "@/assets/summit-cover-mockup.png";
import summitFinancial from "@/assets/summit-financial.png";
import summitFinancialSection from "@/assets/summit-financial-section.png";
import summitTax from "@/assets/summit-tax.png";
import summitProductGroup from "@/assets/summit-product-group.png";
import summitHeroProduct from "@/assets/summit-hero-product.png";
import summitGallery1 from "@/assets/summit-gallery-1.png";
import summitGallery3 from "@/assets/summit-gallery-3.png";
import { useState } from "react";
import { useScrollAnimation, scrollAnimationClasses } from "@/hooks/useScrollAnimation";

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

// Gallery items for horizontal scroll section (Apple-style)
// Using image paths directly to avoid sharing references with other sections
const GALLERY_ITEMS = [
  {
    title: "탄탄한 해설과 함께",
    description: "단순 답지는 이제 그만. 다양한 풀이법과 코멘트, 관련 개념까지 연결지어 복습할 수 있는 새로운 해설지를 만나보세요.",
    fallbackImage: summitGallery1,
  },
  {
    title: "시험 전에 당신의 현 상황을",
    description: "서울대, 연세대 최상위권 수험생 데이터를 기반으로 당신의 안정권 / 경합권 / 레드라인 위치를 제공해드립니다. 남은 기간 당신의 확실한 필승 전략을 세우기 위함이죠.",
    imagePath: "/summit-gallery-2.png",
    fallbackImage: summitFinancial,
  },
  {
    title: "보증된 문제 퀄리티",
    description: "현직 재무회계, 세무회계 메이저 강사들이 직접 선별 및 검수한 문제들을 만나보세요.",
    fallbackImage: summitGallery3,
  },
  {
    title: "개정세법 완벽 반영",
    description: "2025년 12월 법률 개정안까지 반영하고, 시험일까지 지속적으로 업데이트합니다.",
    imagePath: "/summit-gallery-4.png",
    fallbackImage: summitFeature,
  },
] as const;

const PRODUCT_SECTIONS = [
  {
    subject: "SUMMIT 재무회계",
    paragraphs: [
      "SUMMIT 재무회계는\n최근 기출과 유사한 난이도로 구성했습니다.\n단순히 어렵게 만든 문제가 아니라,\n기출에서 고난이도를 만드는 요소를 분해하고 그대로 반영했습니다.\n그래서 '낯선 어려움'이 아니라 익숙한 시험 난이도로 실력을 드러냅니다.",
      "실제 시험지 구성 + OMR 마킹까지 포함한 실전 연습으로\n3교시 재무회계에서 흔들리지 않는 속도·정확도 루틴을 완성합니다.\n계산 자체보다 더 중요한 풀이 순서·버릴 문제·끝까지 가져갈 문제가 정리됩니다.",
      "틀린 문항은 끝나지 않습니다.\n유사 기출을 시험지 형태로 재구성해 PDF로 바로 인출할 수 있어\n파이널 기간의 공회전을 끊고 단권화로 밀어붙일 수 있습니다.",
      "위치가 보입니다.\n안정권 / 경합권 / 레드라인.\n내 점수의 의미가 숫자로 보이면,\n파이널 기간 재무회계 공부의 방향이 보입니다.",
      "해설은 단순한 정답 풀이를 넘어 \n문항별로 초고득점자들의 사고 흐름을 남겨,\n실전에서 최적의 선택을 내릴 수 있게합니다.",
    ],
  },
  {
    subject: "SUMMIT 세법",
    paragraphs: [
      "최근 1차 세법개론은 어렵고, 과락은 늘었습니다. \n그런데 시장엔 내 현재 위치를 정확히 보여주는 콘텐츠가 부족합니다.\nSUMMIT 세법은  \"방향을 잡는 시험지\"입니다.",
      "2026 개정세법을 완벽하게 반영하여 구성했습니다. \n남은 기간에도 시행령·개정안 등 변동 요소를 반영해\n업데이트를 지속 제공합니다.",
      "전략이 선명해집니다.\n남은 기간 말문제를 더 할지 / 계산문제를 더 할지,\n그리고 어떤 단원에서 점수를 방어해야 하는지\n'감'이 아니라 '숫자'로 결정할 수 있습니다.",
      "위치가 보입니다.\n안정권 / 경합권 / 레드라인.\n전국모고만으로는 알 수 없는 \"내 점수의 의미\"를 해석합니다. ",
    ],
  },
];

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const Summit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Scroll animations for each section
  const heroAnim = useScrollAnimation({ threshold: 0.1 });
  const featuresAnim = useScrollAnimation({ threshold: 0.1 });
  const financialAnim = useScrollAnimation({ threshold: 0.1 });
  const galleryAnim = useScrollAnimation({ threshold: 0.1 });
  const taxAnim = useScrollAnimation({ threshold: 0.1 });
  const envAnim = useScrollAnimation({ threshold: 0.1 });
  const ctaAnim = useScrollAnimation({ threshold: 0.1 });

  const scrollGallery = useCallback((direction: 'left' | 'right') => {
    if (!galleryRef.current) return;
    const scrollAmount = galleryRef.current.clientWidth * 0.8;
    galleryRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);


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
        <section>
          <div 
            ref={heroAnim.ref}
            className={`container mx-auto px-6 py-12 sm:py-16 md:py-28 ${scrollAnimationClasses.transition} ${heroAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-10 md:gap-20 items-start">
              {/* Left: Product Image */}
              <div className="flex items-start justify-center">
                <div className="shadow-xl rounded-sm overflow-hidden w-[180px] sm:w-[180px] md:w-[280px] lg:w-[400px]">
                  <img
                    src={summitHeroProduct}
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
                  <h1 className="text-xl sm:text-lg md:text-xl lg:text-3xl font-light mb-2 sm:mb-2 md:mb-4 lg:mb-6">
                    Wiser Lab SUMMIT PACK
                  </h1>
                  <p className="text-xs sm:text-[11px] md:text-xs lg:text-base text-muted-foreground leading-relaxed">
                    가장 실전적인 모의고사, SUMMIT
                  </p>
                </div>

                {/* Product Info */}
                <div className="space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6 py-4 sm:py-4 md:py-5 lg:py-8 border-y border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm sm:text-xs md:text-sm lg:text-base font-medium">전과목 PACK</p>
                      <p className="text-xs sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
                        재무회계 + 세법 모의고사 각 2회분
                      </p>
                    </div>
                    <p className="text-lg sm:text-lg md:text-lg lg:text-2xl font-medium">
                      {formatPrice(BUNDLE_PRICE)}원
                    </p>
                  </div>
                </div>

                {/* Delivery & Notice */}
                <div className="space-y-1 sm:space-y-1 md:space-y-2 lg:space-y-3 text-xs sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">
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
                    <p className="text-xs sm:text-[10px] md:text-[11px] lg:text-sm text-muted-foreground">총 상품금액</p>
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
        <section className="py-16 sm:py-20 md:py-28">
          <div 
            ref={featuresAnim.ref}
            className={`grid sm:grid-cols-2 ${scrollAnimationClasses.transition} ${featuresAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            {/* Left: Image */}
            <div className="aspect-square sm:aspect-auto sm:min-h-[320px] md:min-h-[400px] overflow-hidden">
              <img
                src={summitFeature}
                alt="SUMMIT 모의고사 특징"
                className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${featuresAnim.isVisible ? 'scale-100' : 'scale-90'}`}
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
                    <h3 className="text-lg sm:text-base md:text-lg font-medium mb-3 sm:mb-4 md:mb-6">
                      {feature.title}
                    </h3>
                    <p className="text-base sm:text-sm md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 재무회계 Section */}
        <section className="py-20 sm:py-28 md:py-36 bg-muted/20">
          <div 
            ref={financialAnim.ref}
            className={`container mx-auto px-6 md:px-12 lg:px-20 ${scrollAnimationClasses.transition} ${financialAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-center">
              <div className="space-y-6 md:space-y-8 max-w-xl">
                <h2 className="text-3xl md:text-2xl lg:text-4xl font-medium tracking-tight">
                  {PRODUCT_SECTIONS[0].subject}
                </h2>
                <div className="space-y-6 md:space-y-8">
                  {PRODUCT_SECTIONS[0].paragraphs.map((paragraph, index) => (
                    <p 
                      key={index}
                      className="text-base md:text-sm text-muted-foreground leading-[1.8] whitespace-pre-line"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[600px] rounded-sm overflow-hidden">
                  <img
                    src={summitFinancialSection}
                    alt="SUMMIT 재무회계 시험지"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Apple-style Horizontal Gallery Section */}
        <section className="py-20 sm:py-28 md:py-36 bg-muted/20 overflow-hidden">
          <div 
            ref={galleryAnim.ref}
            className={`${scrollAnimationClasses.transition} ${galleryAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <div className="container mx-auto px-6 md:px-12 lg:px-20 mb-10 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-center">
              <span className="font-bold">디테일까지</span> 섬세하게, 전부 준비했습니다.
            </h2>
            </div>

            {/* Gallery Container */}
            <div className="relative">
              {/* Scrollable Gallery */}
              <div
                ref={galleryRef}
                className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 md:px-12 lg:px-20 pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {GALLERY_ITEMS.map((item, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] xl:w-[35vw] snap-center"
                  >
                    {/* Image Container with Border - Apple Style */}
                    <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-border/50 bg-white shadow-sm">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={item.fallbackImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                    {/* Text Content - Separated Below Image */}
                    <div className="pt-5 md:pt-6 lg:pt-8 px-1">
                      <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3 text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons - Bottom right like Apple */}
              <div className="hidden md:flex justify-end gap-3 mt-6 px-6 md:px-12 lg:px-20">
                <button
                  onClick={() => scrollGallery('left')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  aria-label="이전 슬라이드"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollGallery('right')}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  aria-label="다음 슬라이드"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 세법 Section */}
        <section className="py-20 sm:py-28 md:py-36 bg-muted/20">
          <div 
            ref={taxAnim.ref}
            className={`container mx-auto px-6 md:px-12 lg:px-20 ${scrollAnimationClasses.transition} ${taxAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-center">
              <div className="space-y-6 md:space-y-8 max-w-xl md:text-right md:ml-auto">
                <h2 className="text-3xl md:text-2xl lg:text-4xl font-medium tracking-tight">
                  {PRODUCT_SECTIONS[1].subject}
                </h2>
                <div className="space-y-6 md:space-y-8">
                  {PRODUCT_SECTIONS[1].paragraphs.map((paragraph, index) => (
                    <p 
                      key={index}
                      className="text-base md:text-sm text-muted-foreground leading-[1.8] whitespace-pre-line"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[600px] rounded-sm overflow-hidden">
                  <img
                    src={summitTax}
                    alt="SUMMIT 세법 시험지"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Environment Section - Apple Style */}
        <section 
          ref={envAnim.ref}
          className={`transition-all duration-[5000ms] ease-out ${
            envAnim.isVisible 
              ? 'bg-[#F5F5F7]' 
              : 'bg-muted/20'
          }`}
        >
          {/* Header */}
          <div 
            className={`pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 container mx-auto px-6 md:px-12 lg:px-20 ${scrollAnimationClasses.transition} ${envAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-snug transition-colors duration-[5000ms] ${
              envAnim.isVisible ? 'text-[#1d1d1f]' : 'text-foreground'
            }`}>
              SUMMIT은 <span className="font-bold">'현재 내 위치'</span>를<br />
              확인할 수 있는 첫 번째<br />
              모의고사입니다.
            </h2>
            <button 
              onClick={handlePurchase}
              className={`inline-flex items-center gap-1 mt-6 sm:mt-8 text-base sm:text-lg transition-colors duration-[5000ms] hover:underline ${
                envAnim.isVisible ? 'text-[#0066cc]' : 'text-primary'
              }`}
            >
              지금 SUMMIT 바로 구매하기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Three White Cards */}
          <div className="container mx-auto px-6 md:px-12 lg:px-20 pb-24 sm:pb-32 md:pb-40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 - 친환경 용지 */}
              <div className={`bg-white rounded-3xl p-8 sm:p-10 transition-all duration-500 ${envAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <p className="text-[#86868b] text-sm font-medium mb-4">우리의 접근 방식.</p>
                <p className="text-[#1d1d1f] text-lg sm:text-xl leading-relaxed mb-6">
                  FSC 인증 친환경 용지를 사용하여 산림 자원을 보호하고, 지속 가능한 인쇄 환경을 만들어갑니다.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-[#0066cc] text-base hover:underline">
                  친환경 인쇄에 대해 더 알아보기
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Card 2 - 콩기름 인쇄 */}
              <div className={`bg-white rounded-3xl p-8 sm:p-10 transition-all duration-500 ${envAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <p className="text-[#86868b] text-sm font-medium mb-4">당신이 도울 수 있는 방법.</p>
                <p className="text-[#1d1d1f] text-lg sm:text-xl leading-relaxed mb-6">
                  석유 기반 잉크 대신 콩기름 잉크를 사용하여 유해 물질 배출을 줄이고, 재활용 시에도 환경 부담을 최소화합니다.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-[#0066cc] text-base hover:underline">
                  콩기름 잉크에 대해 더 알아보기
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Card 3 - 최소 포장 */}
              <div className={`bg-white rounded-3xl p-8 sm:p-10 transition-all duration-500 ${envAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
                <p className="text-[#86868b] text-sm font-medium mb-4">우리의 접근 방식.</p>
                <p className="text-[#1d1d1f] text-lg sm:text-xl leading-relaxed mb-6">
                  불필요한 포장재를 최소화하고 재활용 가능한 소재만 사용하여, 한 번에 더 많은 제품을 운송할 수 있도록 설계했습니다.
                </p>
                <a href="#" className="inline-flex items-center gap-1 text-[#0066cc] text-base hover:underline">
                  포장 및 운송에 대해 더 알아보기
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Spacer between sections */}
        <div className={`h-24 sm:h-32 md:h-40 transition-colors duration-[5000ms] ${envAnim.isVisible ? 'bg-[#F5F5F7]' : 'bg-muted/20'}`} />

        {/* CTA Section - Apple Style with gradient to black */}
        <section 
          ref={ctaAnim.ref}
          className={`py-24 sm:py-32 md:py-40 transition-all duration-[5000ms] ease-out ${
            ctaAnim.isVisible 
              ? 'bg-black' 
              : 'bg-background'
          }`}
        >
          <div 
            className={`container mx-auto px-6 md:px-12 lg:px-20 text-center ${scrollAnimationClasses.transition} ${ctaAnim.isVisible ? scrollAnimationClasses.visible : scrollAnimationClasses.hidden}`}
          >
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight max-w-4xl mx-auto transition-colors duration-[3500ms] ${
              ctaAnim.isVisible ? 'text-white' : 'text-foreground'
            }`}>
              2026 CPA 1차,
              <br />
              SUMMIT으로 승리하세요.
            </h2>
            <div className="mt-10 sm:mt-12 md:mt-16">
              <Button
                size="lg"
                className={`h-12 sm:h-14 px-10 sm:px-12 text-base sm:text-lg font-medium rounded-full transition-all duration-[3500ms] ${
                  ctaAnim.isVisible 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : ''
                }`}
                onClick={handlePurchase}
              >
                지금 구매하기
              </Button>
            </div>
            
            {/* Product Group Image - Apple Style Scale & Fade Animation */}
            <div className="mt-8 sm:mt-10 md:mt-12 max-w-5xl mx-auto">
              <img
                src={summitProductGroup}
                alt="SUMMIT 모의고사 제품 구성"
                className={`w-full h-auto transition-all duration-[4000ms] ease-out ${
                  ctaAnim.isVisible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: '800ms' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Summit;
