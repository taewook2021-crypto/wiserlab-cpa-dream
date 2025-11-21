const FeaturesSection = () => {
  const features = [
    {
      title: "실전 모의고사",
      description: "실제 시험과 동일한 난이도와 형식의 모의고사로 완벽한 시험 준비"
    },
    {
      title: "정확한 해설",
      description: "전문 CPA 강사진의 상세한 해설과 풀이 전략 제공"
    },
    {
      title: "성적 분석",
      description: "개인별 맞춤 성적 분석으로 약점 파악 및 학습 전략 수립"
    },
    {
      title: "최신 트렌드",
      description: "매년 업데이트되는 출제 경향을 반영한 최신 문제"
    }
  ];

  return (
    <section id="features" className="py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <h3 className="text-5xl font-bold mb-20 text-center">
          와이저랩의 차별점
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 bg-background rounded-sm border border-border hover:border-primary transition-all duration-300"
            >
              <h4 className="text-2xl font-bold mb-4">{feature.title}</h4>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
