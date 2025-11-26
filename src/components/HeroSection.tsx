import { Button } from "@/components/ui/button";
import mountainHero from "@/assets/mountain-hero.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen pt-16">
      {/* Hero Image Section */}
      <div className="relative h-[60vh] bg-black overflow-hidden">
        <img 
          src={mountainHero} 
          alt="Mountain Peak" 
          className="w-full h-full object-cover opacity-70" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="bg-transparent text-white border-white hover:bg-white hover:text-black transition-all duration-300 text-base px-8 py-6"
          >
            자세히보기
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          {/* Left Column */}
          <div className="space-y-12">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-light leading-tight">
                시뮬레이션이 아닌,
                <br />
                &apos;실전 그 자체&apos;를 경험하라.
              </h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-normal">공인회계사 시험 1차 모의고사</h2>
              <h2 className="text-3xl font-normal">SUMMIT</h2>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-8 text-foreground">
            <div className="space-y-8 border-l-2 border-foreground pl-6">
              <h3 className="text-2xl font-normal">진짜 실력을 위한 압도적인 표본과 분석</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">가장 실전적인 난이도와 유형</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    수험생들이 가장 어려워하고 놓치기 쉬운 부분을 정확히 반영하여 실제 시험장에서의 적응력을 극대화합니다.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">서울대학교 데이터 기반 정교한 위치 확인</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    서울대 응시자들의 성적 데이터를 기반으로 <strong className="text-foreground">과목별 본인의 전국적 위치와 취약점을 가장 정확하게 파악</strong>하고, 남은 기간 학습 방향을 확실하게 잡을 수 있습니다.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">SUMMIT의 정교한 점수 추정</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    실제 수능 및 국/영/수 최고난도 시험 데이터를 다뤄 온 Wiser Lab이 개발하여 <strong className="text-foreground">가장 신뢰도 높은 등급 및 표준점수</strong>를 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
