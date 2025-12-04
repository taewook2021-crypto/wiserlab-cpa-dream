import mountainHero from "@/assets/mountain-hero.jpg";
import OptimizedImage from "@/components/OptimizedImage";

const HeroSection = () => {
  return <section className="min-h-screen pt-16">
      {/* Hero Image Section */}
      <div className="relative h-[60vh] bg-black overflow-hidden">
        <OptimizedImage 
          src={mountainHero} 
          alt="Mountain Peak" 
          className="w-full h-full object-cover opacity-70"
          containerClassName="w-full h-full"
          priority={true}
        />
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left Column */}
          <div className="space-y-16">
            <div className="space-y-12">
              <h2 className="text-xl font-light tracking-tight">공인회계사시험 수험생에게</h2>
              <p className="text-4xl lg:text-5xl font-normal leading-relaxed tracking-tight">
                3월 2일, 결전의 날.<br />
                그날의 압박감을 이겨낼<br />
                &apos;실전 그 자체&apos;를 선물합니다.
              </p>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">공인회계사 1차 모의고사</h1>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">SUMMIT</h1>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-10 text-foreground">
            <div className="space-y-12">
              <div className="space-y-3">
                <p className="text-lg leading-relaxed">
                  ○ 책상 위 문제집이 아닌, <strong className="text-foreground">&apos;고사장 시험지 그 자체&apos;</strong>로 실전 감각을 완성하고 싶다.
                </p>
              </div>
              
              <div className="space-y-5">
                <p className="text-lg leading-relaxed">
                  ○ 단순한 등수가 아닌, <strong className="text-foreground">서울대 데이터 기반의</strong>  합격 가능성을 확인하고 싶다.
                </p>
                <div className="pl-8 space-y-4 text-base">
                  <div className="space-y-1">
                    <p className="font-medium">양질의 표본</p>
                    <p className="text-muted-foreground">Wiser Lab 응시자 + 서울대학교 CPA 응시자 표본</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Wiser Lab 데이터룸의 정밀 분석</p>
                    <p className="text-muted-foreground">문항 별 정답률 기반의 취약 유형 분석 + 관련 기출 제공</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;