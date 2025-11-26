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
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground">
                공인회계사시험 수험생에게
              </h2>
              <h1 className="text-5xl lg:text-6xl font-light leading-tight">
                시험 그 자체의 경험을
                <br />
                선물합니다.
              </h1>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-normal">
                Wiser Lab 전국 모의평가
              </h3>
              <h3 className="text-3xl font-normal">
                Summit Program
              </h3>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-8 text-foreground">
            <div className="space-y-6 border-l-2 border-foreground pl-6">
              <p className="text-base leading-relaxed">
                ○ 평가된 문항 퀄리티의 시험지로 (남들보다 더 많이) 실전 연습하고 싶다.
              </p>
              
              <p className="text-base leading-relaxed mt-8">
                ○ 6·9월 평가원 성적표 외에도 (남들보다 더 많이) 전국단위의 정확한 성적표를 받고 싶다.
              </p>
              
              <div className="mt-8 space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">양질의 표본</p>
                <p>Wiser Lab 재원생 + 전국 고3/N수생</p>
              </div>
              
              <p className="text-sm leading-relaxed text-muted-foreground mt-6">
                Wiser Lab 데이터를의 성적분석과 자원가능 대학 예측
                <br />
                수능 등급컷과 표준점수를 가장 정확하게 예측할 Wiser Lab 데이터를 제공
              </p>
              
              <p className="text-base leading-relaxed mt-8">
                ○ 수시 / 정시 및 합숙전략 수립을 위한 내비게이션을 가지고 싶다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
