import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import mountainHero from "@/assets/mountain-hero.jpg";
import summitLogo from "@/assets/summit-logo.svg";

const ConcentricCircles = ({ isVisible }: { isVisible: boolean }) => {
  const circles = [
    { size: 200, delay: 0 },
    { size: 400, delay: 0.15 },
    { size: 600, delay: 0.3 },
    { size: 800, delay: 0.45 },
    { size: 1000, delay: 0.6 },
    { size: 1200, delay: 0.75 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -left-[400px] top-1/2 -translate-y-1/2">
        {circles.map((circle, index) => (
          <div
            key={index}
            className="absolute rounded-full border border-border/40"
            style={{
              width: circle.size,
              height: circle.size,
              left: -circle.size / 2,
              top: -circle.size / 2,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.8)',
              transition: `opacity 0.6s ease-out ${circle.delay}s, transform 0.6s ease-out ${circle.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleQuickScoringClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth?redirect=/quick-scoring");
    }
  };

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
            className="w-full h-full object-cover grayscale-[70%]"
          >
            <source src="/videos/mountain-bw.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>

        {/* Overlay White Card */}
        <div className="relative z-10 h-full flex items-center">
          <div className="ml-8 lg:ml-24 bg-white/95 backdrop-blur-sm p-8 lg:p-10 w-[480px] min-h-[520px] flex flex-col justify-between relative">
            <div className="space-y-0 mt-12">
              <h1 className="text-[1.65rem] lg:text-[2.5rem] font-light animate-text-1">
                실전을 넘어
              </h1>
              <h1 className="text-[1.65rem] lg:text-[2.5rem] font-light animate-text-2">
                정상으로
              </h1>
              <h1 className="text-[1.65rem] lg:text-[2.5rem] font-light animate-text-3 whitespace-nowrap">
                공인회계사 1차 모의고사
              </h1>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
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
              <img src={summitLogo} alt="SUMMIT" className="h-6" />
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
      <div ref={sectionRef} className="relative bg-background py-32 overflow-hidden">
        <ConcentricCircles isVisible={isVisible} />
        <div className="container mx-auto px-6 relative z-10">
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
      </div>
    </section>
  );
};

export default HeroSection;