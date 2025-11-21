import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              The New Structure.
              <br />
              Navigate Toward a New Mastery.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
              Perfect Your Performance.
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-6 text-foreground">
              <p className="text-lg leading-relaxed">
                와이저랩은
              </p>
              <p className="text-lg leading-relaxed">
                공인회계사 시험의 시간가치와 성과가치의 극단적 비대칭성을 이해하고,
              </p>
              <p className="text-lg leading-relaxed">
                수많은 시간을 견뎌내더라도
              </p>
              <p className="text-lg leading-relaxed">
                끝내 정점(Summit) 에 도달하는 학생은 극히 일부뿐인
              </p>
              <p className="text-lg leading-relaxed">
                냉혹한 실전 구조를 직시합니다.
              </p>
              <p className="text-lg leading-relaxed">
                우리는 강의와 콘텐츠의 단순한 배열을 넘어
              </p>
              <p className="text-lg leading-relaxed">
                출제의 본질을 정점의 관점에서 재해석함으로써
              </p>
              <p className="text-lg leading-relaxed">
                학생 각자의 잠재된 Hidden Score를
              </p>
              <p className="text-lg leading-relaxed">
                실전의 확실한 결과로 끌어올리는
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                Summit 기반 성적구조 시스템을 구축합니다.
              </p>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button size="lg" className="text-base">
                모의고사 신청
              </Button>
              <Button variant="outline" size="lg" className="text-base">
                자세히 보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
