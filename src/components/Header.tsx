import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-black.png";
import wiserLabLogo from "@/assets/wiser-lab-logo.svg";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      setIsAdmin(data === true);
    };
    
    checkAdminRole();
  }, [user]);

  const handleQuickScoringClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate("/auth?redirect=/quick-scoring");
    }
  };
  
  const navLinks = [{
    to: "/summit",
    label: "SUMMIT Contents"
  }];

  const textColor = isHomePage 
    ? "text-white hover:text-white/80" 
    : "text-foreground hover:text-muted-foreground";
  
  const textColorNav = isHomePage 
    ? "text-white/90 hover:text-white" 
    : "text-foreground hover:text-muted-foreground";

  const logoFilter = isHomePage 
    ? { filter: 'brightness(0) invert(1)' } 
    : {};

  const buttonStyle = isHomePage
    ? "font-normal bg-white text-foreground hover:bg-white/90"
    : "font-normal";

  const menuButtonStyle = isHomePage
    ? "text-white hover:bg-white/10"
    : "text-foreground hover:bg-muted";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-6">
        <nav className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center gap-3">
              <img src={wiserLabLogo} alt="Wiser Lab" className="h-5" style={logoFilter} />
            </Link>
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className={`text-sm ${textColorNav} transition-colors`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              <Link to="/quick-scoring" onClick={handleQuickScoringClick}>
                <Button variant="default" size="sm" className={buttonStyle}>
                  빠른 채점하기
                </Button>
              </Link>
              <Link to="/cart" className={`text-sm ${textColor} transition-colors`}>
                장바구니
              </Link>
              {user && (
                <Link to="/mypage" className={`text-sm ${textColor} transition-colors`}>
                  마이페이지
                </Link>
              )}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`text-sm ${textColor} transition-colors flex items-center gap-1`}>
                    관리자
                    <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/order-admin" className="cursor-pointer">
                        주문관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notice-admin" className="cursor-pointer">
                        공지관리
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!loading && (
                user ? (
                  <button 
                    onClick={signOut}
                    className={`text-sm ${textColor} transition-colors`}
                  >
                    로그아웃
                  </button>
                ) : (
                  <Link to="/auth" className={`text-sm ${textColor} transition-colors`}>
                    로그인
                  </Link>
                )
              )}
            </div>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className={menuButtonStyle}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-lg text-foreground hover:text-muted-foreground transition-colors">
                      {link.label}
                    </Link>
                  ))}
                  <Link to="/quick-scoring" onClick={(e) => { handleQuickScoringClick(e); setOpen(false); }}>
                    <Button variant="default" className="w-full font-normal">
                      빠른 채점하기
                    </Button>
                  </Link>
                  <Link to="/cart" onClick={() => setOpen(false)} className="text-lg text-foreground hover:text-muted-foreground transition-colors">
                    장바구니
                  </Link>
                  {user && (
                    <Link 
                      to="/mypage" 
                      onClick={() => setOpen(false)}
                      className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                    >
                      마이페이지
                    </Link>
                  )}
                  {isAdmin && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground font-medium">관리자</p>
                      <Link 
                        to="/order-admin" 
                        onClick={() => setOpen(false)}
                        className="block text-lg text-foreground hover:text-muted-foreground transition-colors pl-4"
                      >
                        주문관리
                      </Link>
                      <Link 
                        to="/notice-admin" 
                        onClick={() => setOpen(false)}
                        className="block text-lg text-foreground hover:text-muted-foreground transition-colors pl-4"
                      >
                        공지관리
                      </Link>
                    </div>
                  )}
                  {!loading && (
                    user ? (
                      <button 
                        onClick={() => { signOut(); setOpen(false); }}
                        className="text-lg text-foreground hover:text-muted-foreground transition-colors text-left"
                      >
                        로그아웃
                      </button>
                    ) : (
                      <Link 
                        to="/auth" 
                        onClick={() => setOpen(false)}
                        className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                      >
                        로그인
                      </Link>
                    )
                  )}
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