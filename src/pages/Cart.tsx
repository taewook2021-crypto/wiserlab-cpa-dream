import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ArrowLeft } from "lucide-react";
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

    // 선택된 상품 중 summit_bundle이 있는지 확인
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 min-h-[60vh]">
          {/* Left Column - Title and Back */}
          <div className="flex flex-col justify-between">
            <h1 className="text-3xl font-light">장바구니</h1>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>

          {/* Right Column - Cart Items */}
          <div className="flex flex-col">
            {loadingCart ? (
              <p className="text-muted-foreground animate-pulse">불러오는 중...</p>
            ) : cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">장바구니가 비어 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select All */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Checkbox
                    id="select-all"
                    checked={selectedItems.length === cartItems.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    전체 선택 ({selectedItems.length}/{cartItems.length})
                  </label>
                </div>

                {/* Cart Items List */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg"
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.price.toLocaleString()}원
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total and Purchase */}
                <div className="border-t border-border pt-6 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-muted-foreground">
                      선택 상품 ({selectedItems.length}개)
                    </span>
                    <span className="text-xl font-medium">
                      {selectedTotal.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-14 text-base font-normal"
                      disabled={selectedItems.length === 0}
                      onClick={handleRemoveSelectedItems}
                    >
                      장바구니에서 제거
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