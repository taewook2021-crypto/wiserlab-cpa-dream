import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_type: string;
  product_name: string;
  price: number;
}

const Cart = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/cart");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCartItems(data);
      }
      setLoadingCart(false);
    };

    if (user) {
      fetchCartItems();
    }
  }, [user]);

  const handleRemoveItem = async (itemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("삭제에 실패했습니다.");
      return;
    }

    setCartItems(cartItems.filter((item) => item.id !== itemId));
    toast.success("상품이 삭제되었습니다.");
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-light mb-8">장바구니</h1>

        {loadingCart ? (
          <p className="text-muted-foreground animate-pulse">불러오는 중...</p>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">장바구니가 비어있습니다.</p>
            <Button variant="outline" onClick={() => navigate("/summit")}>
              상품 보러가기
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-6 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg">총 결제금액</span>
                <span className="text-xl font-medium">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
              <Button className="w-full" size="lg" disabled>
                결제하기 (준비중)
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;