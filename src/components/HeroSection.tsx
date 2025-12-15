import mountainHero from "@/assets/mountain-hero.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen">
      {/* Full-bleed Hero with Overlay Card */}
      <div className="relative h-screen">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={mountainHero}
            className="w-full h-full object-cover grayscale-[30%]"
          >
            <source src="/videos/mountain-bw.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        {/* Overlay White Card */}
        <div className="relative z-10 h-full flex items-center">
          <div className="ml-8 lg:ml-24 bg-white/95 backdrop-blur-sm p-12 lg:p-16 max-w-xl">
            <div className="space-y-8">
              <p className="text-sm tracking-widest text-muted-foreground uppercase">
                For CPA Exam Candidates
              </p>
              
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-5xl font-light text-foreground">
                  실전을 넘어
                </h1>
                <h1 className="text-4xl lg:text-5xl font-light text-muted-foreground/70">
                  정상으로
                </h1>
                <h1 className="text-4xl lg:text-5xl font-light text-muted-foreground/40">
                  SUMMIT
                </h1>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                3월 2일, 결전의 날.<br />
                그날의 압박감을 이겨낼 &apos;실전 그 자체&apos;를 선물합니다.
              </p>

              <div className="flex flex-col space-y-3 text-sm text-foreground pt-4">
                <span className="cursor-pointer hover:text-primary transition-colors">공인회계사 1차 모의고사</span>
                <span className="cursor-pointer hover:text-primary transition-colors">서울대 데이터 기반 분석</span>
                <span className="cursor-pointer hover:text-primary transition-colors">정밀 취약 유형 분석</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Left Column */}
          <div className="space-y-12">
            <h2 className="text-3xl lg:text-4xl font-light leading-relaxed">
              단순한 등수가 아닌,<br />
              <strong className="font-medium">서울대 데이터 기반</strong>의<br />
              합격 가능성을 확인하세요.
            </h2>
          </div>
          
          {/* Right Column */}
          <div className="space-y-10 text-foreground">
            <div className="space-y-8">
              <div className="space-y-4">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;