import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ArrowLeft, ShoppingBag, Package } from "lucide-react";
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
    setSelectedItems(selectedItems.filter((id) => id !== itemId));
    toast.success("상품이 삭제되었습니다.");
  };

  const handleRemoveSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .in("id", selectedItems);

    if (error) {
      toast.error("삭제에 실패했습니다.");
      return;
    }

    setCartItems(cartItems.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    toast.success(`${selectedItems.length}개 상품이 삭제되었습니다.`);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
  };

  const selectedTotal = cartItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handlePurchase = () => {
    if (selectedItems.length === 0) return;

    const selectedProducts = cartItems.filter((item) =>
      selectedItems.includes(item.id)
    );

    const hasBundleProduct = selectedProducts.some(
      (item) => item.product_type === "summit_bundle"
    );

    if (hasBundleProduct) {
      navigate("/payment?items=bundle");
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-light">장바구니</h1>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">뒤로가기</span>
              </button>
            </div>
            <p className="text-muted-foreground text-sm">
              {cartItems.length > 0
                ? `${cartItems.length}개의 상품이 담겨 있습니다`
                : "담긴 상품이 없습니다"}
            </p>
          </div>

          {/* Cart Content */}
          <div className="flex flex-col">
            {loadingCart ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">불러오는 중...</p>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center animate-fade-in">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground mb-6">
                    장바구니가 비어 있습니다
                  </p>
                  <Button
                    onClick={() => navigate("/summit")}
                    className="h-12 px-8"
                  >
                    쇼핑하러 가기
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Select All */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedItems.length === cartItems.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      전체 선택
                    </label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length}/{cartItems.length}
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-5 border border-border bg-card hover:border-primary/30 hover:shadow-sm rounded-lg transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                      />
                      <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-primary font-medium mt-1">
                          {item.price.toLocaleString()}원
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border border-border rounded-lg p-6 mt-6 bg-card/50">
                  <h3 className="font-medium mb-4">결제 요약</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">선택 상품</span>
                      <span>{selectedItems.length}개</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">상품 금액</span>
                      <span>{selectedTotal.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">배송비</span>
                      <span className={selectedTotal >= 50000 ? "text-primary" : ""}>
                        {selectedTotal >= 50000 ? "무료" : selectedTotal > 0 ? "3,000원" : "0원"}
                      </span>
                    </div>
                    {selectedTotal > 0 && selectedTotal < 50000 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        {(50000 - selectedTotal).toLocaleString()}원 더 구매 시 무료배송
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t border-border mt-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">총 결제금액</span>
                      <span className="text-xl font-semibold text-primary">
                        {(selectedTotal + (selectedTotal > 0 && selectedTotal < 50000 ? 3000 : 0)).toLocaleString()}
                        <span className="text-sm font-normal ml-0.5">원</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-14 text-base font-normal hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    disabled={selectedItems.length === 0}
                    onClick={handleRemoveSelectedItems}
                  >
                    선택 삭제
                  </Button>
                  <Button
                    className="flex-1 h-14 text-base font-normal"
                    disabled={selectedItems.length === 0}
                    onClick={handlePurchase}
                  >
                    구매하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;