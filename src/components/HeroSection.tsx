import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import summitLogo from "@/assets/summit-logo.svg";
const ConcentricCircles = ({
  animationKey
}: {
  animationKey: number;
}) => {
  const circles = [{
    size: 200,
    delay: 0
  }, {
    size: 400,
    delay: 0.15
  }, {
    size: 600,
    delay: 0.3
  }, {
    size: 800,
    delay: 0.45
  }, {
    size: 1000,
    delay: 0.6
  }, {
    size: 1200,
    delay: 0.75
  }];
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute" style={{
      left: '10%',
      top: '50%',
      transform: 'translateY(-50%)'
    }}>
        {circles.map((circle, index) => <div key={`${animationKey}-${index}`} className="absolute rounded-full border border-muted-foreground/30 animate-circle-appear" style={{
        width: circle.size,
        height: circle.size,
        left: -circle.size / 2,
        top: -circle.size / 2,
        animationDelay: `${circle.delay}s`
      }} />)}
      </div>
    </div>;
};
const HeroSection = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setAnimationKey(prev => prev + 1);

        // 7초마다 애니메이션 반복
        intervalId = setInterval(() => {
          setAnimationKey(prev => prev + 1);
        }, 7000);
      } else {
        if (intervalId) clearInterval(intervalId);
      }
    }, {
      threshold: 0.3
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  const handleQuickScoringClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth?redirect=/quick-scoring");
    }
  };
  return <section className="min-h-screen">
      {/* Full-bleed Hero with Overlay Card */}
      <div className="relative h-screen">
        {/* Background Video */}
        <div className="absolute inset-0 bg-muted">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover grayscale-[70%]">
            <source src="/videos/mountain-bw.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        {/* Overlay White Card */}
        <div className="relative z-10 h-full flex items-center">
          <div className="ml-6 sm:ml-12 lg:ml-24 bg-white/95 backdrop-blur-sm p-8 sm:p-10 lg:p-12 w-[300px] sm:w-[400px] lg:w-[560px] min-h-[420px] sm:min-h-[500px] lg:min-h-[620px] flex flex-col justify-between relative">
            <div className="space-y-0 mt-6 sm:mt-8 lg:mt-12">
              <h1 className="text-[1.15rem] sm:text-[1.6rem] lg:text-[2.5rem] font-light animate-text-1">
                실전을 넘어
              </h1>
              <h1 className="text-[1.15rem] sm:text-[1.6rem] lg:text-[2.5rem] font-light animate-text-2">
                정상으로
              </h1>
              <h1 className="text-[1.15rem] sm:text-[1.6rem] lg:text-[2.5rem] font-light animate-text-3 whitespace-nowrap">
                공인회계사 1차 모의고사
              </h1>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <Link to="/summit" className="hover:text-foreground transition-colors">
                  SUMMIT Contents
                </Link>
                <Link to="/quick-scoring" onClick={handleQuickScoringClick} className="hover:text-foreground transition-colors">
                  빠른 채점하기
                </Link>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  로그인
                </Link>
              </div>
              <img src={summitLogo} alt="SUMMIT" className="h-4 sm:h-5 lg:h-6" />
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
      <div ref={sectionRef} className="relative bg-background py-20 sm:py-24 lg:py-32 overflow-hidden">
        <ConcentricCircles animationKey={animationKey} />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-start">
            {/* Left Column */}
            <div className="space-y-8 sm:space-y-10 lg:space-y-12">
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-light leading-relaxed">
                단순한 등수가 아닌,<br />
                <strong className="font-medium">최상위권 표본 기반</strong>의 합격 가능성을<br />
                확인하세요.
              </h2>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6 sm:space-y-8 lg:space-y-10 text-foreground">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm sm:text-sm lg:text-base font-medium">양질의 표본</p>
                    <p className="text-xs sm:text-xs lg:text-base text-muted-foreground">서울대학교·연세대학교 응시자 표본을 기반으로 안정권·경합권·레드라인을 구분해 제공합니다.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-sm lg:text-base font-medium">Wiser Lab 데이터룸의 정밀 분석</p>
                    <p className="text-xs sm:text-xs lg:text-base text-muted-foreground">오답 문항과 연계된 기출문제를 실전 시험지 형식으로 제공합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;