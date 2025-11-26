import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logo from "@/assets/logo-black.png";

const Header = () => {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "SURVIVAL PRO" },
    { href: "#features", label: "SURVIVAL Contents" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5">
                <img 
                  src={logo} 
                  alt="Wiser Lab" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-light tracking-wide">Wiser Lab</h1>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-foreground hover:text-muted-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                장바구니
              </a>
              <a href="#" className="text-sm text-foreground hover:text-muted-foreground transition-colors">
                마이페이지
              </a>
            </div>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <a href="#" className="text-lg text-foreground hover:text-muted-foreground transition-colors">
                    장바구니
                  </a>
                  <a href="#" className="text-lg text-foreground hover:text-muted-foreground transition-colors">
                    마이페이지
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
