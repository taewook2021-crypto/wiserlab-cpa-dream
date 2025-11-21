import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-bold tracking-tight">와이저랩</h1>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-sm text-foreground hover:text-primary transition-colors">
                소개
              </a>
              <a href="#features" className="text-sm text-foreground hover:text-primary transition-colors">
                특징
              </a>
              <a href="#pricing" className="text-sm text-foreground hover:text-primary transition-colors">
                가격
              </a>
              <a href="#contact" className="text-sm text-foreground hover:text-primary transition-colors">
                문의
              </a>
            </div>
          </div>
          <Button variant="default" size="sm">
            로그인
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
