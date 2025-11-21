import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              CPA 시험 준비의
              <br />
              새로운 기준.
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
                공인회계사 시험의 시간가치와 결과가치를 이해하여
              </p>
              <p className="text-lg leading-relaxed">
                수많은 시간 정직한 공부를 하더라도
              </p>
              <p className="text-lg leading-relaxed">
                일류 학생들만 성공하는 냉혹한 입시 현실을 거슬러
              </p>
              <p className="text-lg leading-relaxed">
                한차원 다른 강의와 컨텐츠의 창조적 재배열을 통한
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                Shortcut의 실현으로
              </p>
              <p className="text-lg leading-relaxed">
                혼의 영역을 초극하여
              </p>
              <p className="text-lg leading-relaxed">
                학생 자신의 Hidden Score를 실현하는
              </p>
              <p className="text-lg leading-relaxed font-semibold">
                만점구조시스템을 구현합니다.
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
