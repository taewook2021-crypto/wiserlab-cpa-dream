const PhilosophySection = () => {
  return (
    <section className="w-full py-24 md:py-32 bg-secondary">
      <div className="container mx-auto px-4">
        <blockquote className="text-center max-w-4xl mx-auto">
          <p className="text-2xl md:text-3xl lg:text-4xl font-light italic text-foreground leading-relaxed">
            "The signal becomes visible only when the noise collapses,
            <br className="hidden md:block" />
            and the students of WeiserLab rise at the moment the structure becomes clear."
          </p>
        </blockquote>
      </div>
    </section>
  );
};

export default PhilosophySection;
