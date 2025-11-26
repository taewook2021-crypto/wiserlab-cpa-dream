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
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">진짜 시험지와 동일한 형태, 단 1%의 괴리도 허용하지 않습니다.</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    책이 아닌, 실제 시험장에서 만날 고사장용 OMR과 시험지 형태를 완벽 구현했습니다. 남은 기간 최적의 환경에서 실전 감각을 끌어올리세요.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">난이도 조절 없는 모의고사는 가짜 실전입니다.</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    기존 모의고사처럼 &apos;단순히 어려운&apos; 문제가 아닌, 실제 CPA 시험의 출제 경향과 체감 난이도를 정교하게 반영했습니다. 가장 실전적인 난이도로 본인의 현재 위치를 정확히 파악하게 합니다.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">서울대 데이터 기반, 가장 정확한 나의 위치 파악.</h4>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    과목별 본인의 전국 석차와 취약점을 서울대 응시자 데이터 기반으로 분석합니다. 단순 등수가 아닌, 합격권에 얼마나 가까워졌는지 객관적인 데이터를 확인하세요.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-base leading-relaxed font-medium">
                  [선택이 아닌 필수] 합격은 훈련의 결과입니다. 진짜 시험을 경험해야 진짜 실력이 완성됩니다.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground mt-4">
                  SUMMIT 모의고사와 함께 마지막 한 달을 가장 치열하고 완벽한 실전처럼 만드십시오.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
