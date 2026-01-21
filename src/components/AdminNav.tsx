import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Hash, FileText, ShoppingCart, Ticket, Percent, Users } from "lucide-react";

const adminRoutes = [
  { path: "/statistics-admin", label: "채점 통계", icon: BarChart3 },
  { path: "/exam-numbers-admin", label: "수험번호", icon: Hash },
  { path: "/paid-members-admin", label: "유료 회원", icon: Users },
  { path: "/free-codes-admin", label: "무료 코드", icon: Ticket },
  { path: "/discount-codes-admin", label: "할인 코드", icon: Percent },
  { path: "/noticeadmin", label: "공지사항", icon: FileText },
  { path: "/orderadmin", label: "주문 관리", icon: ShoppingCart },
];

const AdminNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <div className="mb-8">
      <Tabs value={currentPath} onValueChange={(value) => navigate(value)}>
        <TabsList className="grid w-full grid-cols-7">
          {adminRoutes.map((route) => (
            <TabsTrigger 
              key={route.path} 
              value={route.path}
              className="flex items-center gap-2"
            >
              <route.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{route.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default AdminNav;
