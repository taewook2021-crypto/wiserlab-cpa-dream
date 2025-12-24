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
                      <Link to="/orderadmin" className="cursor-pointer">
                        주문관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/noticeadmin" className="cursor-pointer">
                        공지관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/exam-numbers-admin" className="cursor-pointer">
                        수험번호 관리
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {!loading && (
                user ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut}
                    className={`${textColor} hover:bg-transparent`}
                  >
                    로그아웃
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className={`${textColor} hover:bg-transparent`}>
                      로그인
                    </Button>
                  </Link>
                )
              )}
            </div>
            
            <div className="md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={menuButtonStyle}>
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-background">
                  <nav className="flex flex-col space-y-6 mt-8">
                    {navLinks.map(link => (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        onClick={() => setOpen(false)}
                        className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link 
                      to="/quick-scoring" 
                      onClick={(e) => {
                        handleQuickScoringClick(e);
                        setOpen(false);
                      }}
                      className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                    >
                      빠른 채점하기
                    </Link>
                    <Link 
                      to="/cart" 
                      onClick={() => setOpen(false)}
                      className="text-lg text-foreground hover:text-muted-foreground transition-colors"
                    >
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
                          to="/orderadmin" 
                          onClick={() => setOpen(false)}
                          className="block text-lg text-foreground hover:text-muted-foreground transition-colors pl-4"
                        >
                          주문관리
                        </Link>
                        <Link 
                          to="/noticeadmin" 
                          onClick={() => setOpen(false)}
                          className="block text-lg text-foreground hover:text-muted-foreground transition-colors pl-4"
                        >
                          공지관리
                        </Link>
                        <Link 
                          to="/exam-numbers-admin" 
                          onClick={() => setOpen(false)}
                          className="block text-lg text-foreground hover:text-muted-foreground transition-colors pl-4"
                        >
                          수험번호 관리
                        </Link>
                      </div>
                    )}
                    {!loading && (
                      user ? (
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            signOut();
                            setOpen(false);
                          }}
                          className="justify-start p-0 h-auto text-lg text-foreground hover:text-muted-foreground hover:bg-transparent"
                        >
                          로그아웃
                        </Button>
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
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
