import React, { useState, useEffect, useMemo } from 'react';
import {
  MenuItem,
  CartItem,
  Coupon,
  UserAddress,
  OrderType,
  ActiveOrder,
  TrainBookingInfo,
  CategoryItem
} from './types';
import {
  MENU_ITEMS,
  CRAVING_CATEGORIES,
  DEFAULT_ADDRESSES,
  COUPONS,
  SIZE_PRICE_MODIFIERS,
  CRUST_PRICE_MODIFIERS
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { HeroBanner, DEFAULT_SLIDES, BannerSlide } from './components/HeroBanner';
import { CravingCategories } from './components/CravingCategories';
import { CategoryMarquee } from './components/CategoryMarquee';
import { ProductCard } from './components/ProductCard';
import { CustomizeModal } from './components/CustomizeModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { TrainDeliveryModal } from './components/TrainDeliveryModal';
import { AddressModal } from './components/AddressModal';
import { RewardsModal } from './components/RewardsModal';
import { DealsModal } from './components/DealsModal';
import { BottomNav } from './components/BottomNav';
import { BillingPage } from './components/BillingPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminOrder, SEED_ADMIN_ORDERS } from './components/admin/adminData';
import { Outlet, getOutletById, resolveOutletForOrder } from './components/admin/outlets';
import {
  saveMenuItemToFirestore,
  deleteMenuItemFromFirestore,
  fetchMenuItemsFromFirestore,
} from './lib/firebase';
import { 
  Filter, 
  Flame, 
  Sparkles, 
  Search, 
  RotateCcw, 
  CheckCircle, 
  Pizza, 
  Clock, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';

export default function App() {
  // Migration: old cached image URLs pointed at /src/assets (never served in dist).
  // Rewrite them to /images (public folder) so blank images never show.
  const fixImg = (url: string | undefined): string | undefined =>
    url ? url.replace('/src/assets/images/', '/images/') : url;
  const migrateItems = <T extends { image?: string }>(items: T[]): T[] =>
    items.map((it) => (it.image?.includes('/src/assets/') ? { ...it, image: fixImg(it.image) as string } : it));
  // Navigation & Mode
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [activeTab, setActiveTab] = useState<'menu' | 'reorder' | 'bigbig' | 'combos' | 'rewards'>('menu');
  const [currentView, setCurrentView] = useState<'home' | 'billing' | 'admin'>('home');

  // Logged-in outlet (admin POS). Kept in sessionStorage so login survives refresh.
  const [adminOutlet, setAdminOutlet] = useState<Outlet | null>(() => {
    const saved = sessionStorage.getItem('seven_cheese_admin_outlet');
    return saved ? getOutletById(saved) || null : null;
  });

  const handleAdminLogin = (outlet: Outlet) => {
    sessionStorage.setItem('seven_cheese_admin_outlet', outlet.id);
    setAdminOutlet(outlet);
  };
  const handleAdminLogout = () => {
    sessionStorage.removeItem('seven_cheese_admin_outlet');
    setAdminOutlet(null);
  };
  
  // Store Images State (hero slides + categories, editable from Admin → Store Images)
  const [heroSlides, setHeroSlides] = useState<BannerSlide[]>(() => {
    const saved = localStorage.getItem('seven_cheese_hero_slides');
    if (!saved) return DEFAULT_SLIDES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SLIDES;
    } catch {
      return DEFAULT_SLIDES;
    }
  });

  const [storeCategories, setStoreCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('seven_cheese_categories');
    if (!saved) return CRAVING_CATEGORIES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : CRAVING_CATEGORIES;
    } catch {
      return CRAVING_CATEGORIES;
    }
  });

  useEffect(() => {
    safeSet('seven_cheese_hero_slides', JSON.stringify(heroSlides));
  }, [heroSlides]);

  useEffect(() => {
    safeSet('seven_cheese_categories', JSON.stringify(storeCategories));
  }, [storeCategories]);

  // Live Menu Items State (Syncs with Admin)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('seven_cheese_menu_items');
    if (!saved) return MENU_ITEMS;
    try {
      return migrateItems(JSON.parse(saved));
    } catch {
      return MENU_ITEMS;
    }
  });

  // Quota-safe save: device photos can be large, so never let a full browser crash the app
  const safeSet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota full — run in memory, fall back to defaults on reload.
    }
  };

  useEffect(() => {
    safeSet('seven_cheese_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  // Boot: load Firestore menu (same on all devices). Fall back to local menu on failure.
  useEffect(() => {
    let cancelled = false;
    fetchMenuItemsFromFirestore()
      .then((remote) => {
        if (cancelled || !remote) return;
        setMenuItems((prev) => {
          const byId = new Map(prev.map((m) => [m.id, m]));
          remote.forEach((m) => byId.set(m.id, { ...m, image: fixImg(m.image) }));
          return Array.from(byId.values());
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Live Coupons State (Syncs with Admin)
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('seven_cheese_coupons');
    return saved ? JSON.parse(saved) : COUPONS;
  });

  useEffect(() => {
    safeSet('seven_cheese_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // Admin Live Orders State (starts empty, only real orders placed by customers)
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>(() => {
    const saved = localStorage.getItem('seven_cheese_admin_orders');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((o: AdminOrder) => !o.id.startsWith('ord-70')) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSet('seven_cheese_admin_orders', JSON.stringify(adminOrders));
  }, [adminOrders]);
  
  // Addresses
  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    const saved = localStorage.getItem('seven_cheese_addresses') || localStorage.getItem('dominos_addresses');
    return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
  });
  const [currentAddress, setCurrentAddress] = useState<UserAddress>(() => addresses[0] || DEFAULT_ADDRESSES[0]);

  // Cart & Customization State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('seven_cheese_cart') || localStorage.getItem('dominos_cart');
    if (!saved) return [];
    try {
      return migrateItems(JSON.parse(saved));
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Rewards Points (Default 100/600)
  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('seven_cheese_points') || localStorage.getItem('dominos_points');
    return saved ? JSON.parse(saved) : 100;
  });

  // Past Orders & Active Order
  const [pastOrders, setPastOrders] = useState<ActiveOrder[]>(() => {
    const saved = localStorage.getItem('seven_cheese_past_orders') || localStorage.getItem('dominos_past_orders');
    if (saved) {
      try {
        return (JSON.parse(saved) as ActiveOrder[]).map((o) => ({
          ...o,
          items: migrateItems(o.items || []),
        }));
      } catch {
        // fall through to sample order
      }
    }
    // Initial sample order from 7 Cheese Pizza
    return [
      {
        orderId: '7CP-9214',
        items: [
          {
            cartItemId: 'sample-1',
            productId: 'p-7cheese-signature',
            name: 'Original 7 Cheese Pizza',
            isVeg: true,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
            price: 329,
            basePrice: 329,
            size: 'Regular',
            crust: 'New Hand Tossed',
            extraCheese: true,
            extraToppings: [],
            quantity: 1,
          },
          {
            cartItemId: 'sample-2',
            productId: 's-garlic-bread',
            name: 'Garlic Bread Sticks',
            isVeg: true,
            image: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=800&auto=format&fit=crop&q=80',
            price: 99,
            basePrice: 99,
            extraCheese: false,
            extraToppings: [],
            quantity: 1,
          },
        ],
        orderType: 'DELIVERY',
        address: 'Haldwani Main Market, Uttarakhand',
        subtotal: 428,
        deliveryFee: 0,
        tax: 21,
        discount: 50,
        total: 399,
        status: 'DELIVERED',
        timestamp: 'Yesterday, 8:45 PM',
        estimatedMinutes: 0,
        riderName: 'Vikram Negi',
        riderPhone: '+91 98765 43210',
      },
    ];
  });
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

  // Modals Visibility
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isTrainModalOpen, setIsTrainModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);

  // Persist State
  useEffect(() => {
    safeSet('seven_cheese_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    safeSet('seven_cheese_points', JSON.stringify(points));
  }, [points]);

  useEffect(() => {
    safeSet('seven_cheese_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    safeSet('seven_cheese_past_orders', JSON.stringify(pastOrders));
  }, [pastOrders]);

  // Cart Calculations
  const cartItemCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0), [cartItems]);

  // Handlers
  const handleOpenCustomize = (item: MenuItem) => {
    setCustomizingItem(item);
    setIsCustomizeOpen(true);
  };

  const handleSimpleAddToCart = (item: MenuItem) => {
    const existingIndex = cartItems.findIndex(
      (c) => c.productId === item.id && !c.size && !c.crust && !c.extraCheese && c.extraToppings.length === 0
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      const newCartItem: CartItem = {
        cartItemId: `${item.id}-${Date.now()}`,
        productId: item.id,
        name: item.name,
        isVeg: item.isVeg,
        image: item.image,
        price: item.price,
        basePrice: item.price,
        extraCheese: false,
        extraToppings: [],
        quantity: 1,
      };
      setCartItems([...cartItems, newCartItem]);
    }
  };

  const handleAddCustomizedToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.cartItemId === cartItemId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleUpdateProductQuantity = (productId: string, delta: number) => {
    const itemInCart = cartItems.find((c) => c.productId === productId);
    if (!itemInCart) {
      if (delta > 0) {
        const product = menuItems.find((m) => m.id === productId) || MENU_ITEMS.find((m) => m.id === productId);
        if (product) {
          if (product.isCustomizable) {
            handleOpenCustomize(product);
          } else {
            handleSimpleAddToCart(product);
          }
        }
      }
      return;
    }
    handleUpdateCartQuantity(itemInCart.cartItemId, delta);
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const handlePlaceOrder = (notes: string, paymentMethod?: string) => {
    const subtotal = cartTotal;
    const isFreeDel = subtotal >= 99 || appliedCoupon?.code === 'FREEDEL';
    const deliveryFee = orderType === 'DELIVERY' ? (isFreeDel ? 0 : 40) : 0;
    const taxesAndCharges = Math.round(subtotal * 0.05 + 15);
    
    let discount = 0;
    if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
      if (appliedCoupon.discountType === 'percentage') {
        const calc = Math.round((subtotal * appliedCoupon.value) / 100);
        discount = appliedCoupon.maxDiscount ? Math.min(calc, appliedCoupon.maxDiscount) : calc;
      } else {
        discount = appliedCoupon.value;
      }
    }
    const finalTotal = Math.max(0, subtotal + deliveryFee + taxesAndCharges - discount);

    const formattedPaymentMethod = paymentMethod
      ? (paymentMethod === 'cash' ? 'Cash on Delivery' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI')
      : 'UPI';

    const newOrder: ActiveOrder = {
      orderId: `DOM-${Math.floor(10000 + Math.random() * 90000)}`,
      items: [...cartItems],
      orderType,
      address: `${currentAddress.address}, ${currentAddress.city}`,
      subtotal,
      deliveryFee,
      tax: taxesAndCharges,
      discount,
      total: finalTotal,
      status: 'CONFIRMED',
      timestamp: 'Just now',
      estimatedMinutes: 25,
      riderName: 'Vikram Singh',
      riderPhone: '+91 98912 34567',
    };

    // Assign nearest outlet (from customer GPS, else default Outlet 1)
    const { outlet: orderOutlet } = resolveOutletForOrder(currentAddress.lat, currentAddress.lng);

    // Push into Admin live orders
    const newAdminOrder: AdminOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `#7C-${Math.floor(1000 + Math.random() * 9000)}`,
      outletId: orderOutlet.id,
      customerName: currentAddress.label === 'Train' ? 'Train Passenger' : 'Customer (App Store)',
      customerPhone: '+91 98765 43210',
      orderType: orderType === 'DINE_IN' ? 'DINE_IN' : 'DELIVERY',
      address: `${currentAddress.address}, ${currentAddress.city}`,
      tableNumber: orderType === 'DINE_IN' ? 'Table T-01' : undefined,
      items: cartItems.map((c) => ({
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        isVeg: c.isVeg,
        size: c.size,
        crust: c.crust,
        extraCheese: c.extraCheese,
        notes: notes || undefined,
      })),
      subtotal,
      deliveryFee,
      tax: taxesAndCharges,
      discount,
      total: finalTotal,
      paymentMethod: (paymentMethod?.toUpperCase() as any) || 'UPI',
      paymentStatus: paymentMethod === 'cash' ? 'PENDING' : 'PAID',
      status: 'NEW',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      timeAgo: 'Just now',
      cookingNotes: notes || undefined,
    };

    setAdminOrders((prev) => [newAdminOrder, ...prev]);
    setActiveOrder(newOrder);
    setPastOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setAppliedCoupon(null);
    setIsCartOpen(false);
    setCurrentView('home');
    setIsOrderTrackerOpen(true);

    // Award loyalty points: 10 points per ₹100 spent
    const earnedPts = Math.floor(finalTotal / 10);
    setPoints((prev) => Math.min(600, prev + earnedPts));
  };

  const handleConfirmTrainDelivery = (trainInfo: TrainBookingInfo) => {
    setOrderType('TRAIN');
    const trainAddress: UserAddress = {
      id: `train-${Date.now()}`,
      label: 'Train',
      address: `${trainInfo.trainName} • Coach ${trainInfo.coach}, Berth ${trainInfo.seat}`,
      city: trainInfo.station,
      pincode: '263126',
      landmark: `PNR: ${trainInfo.pnr}`,
      distanceKm: 8.2,
    };
    setCurrentAddress(trainAddress);
    setAddresses((prev) => [trainAddress, ...prev.filter((a) => a.id !== trainAddress.id)]);
  };

  const handleRedeemReward = (rewardTitle: string, discountVal: number) => {
    const rewardCoupon: Coupon = {
      code: 'REWARD-REDEEM',
      discountType: 'flat',
      value: discountVal,
      minOrder: 0,
      title: rewardTitle,
      description: `Cheesy Rewards Redemption - ₹${discountVal} OFF`,
      tag: 'LOYALTY REWARD',
    };
    setAppliedCoupon(rewardCoupon);
    setPoints((prev) => Math.max(0, prev - 150));
    setIsCartOpen(true);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return menuItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesToppings = item.toppings?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesToppings) return false;
      }

      // Veg / Non-veg
      if (vegOnly && !item.isVeg) return false;
      if (nonVegOnly && item.isVeg) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'signature-7-cheese' && item.category !== 'signature-7-cheese') return false;
        if (selectedCategory === 'veg-pizza' && item.category !== 'veg-pizza' && item.category !== 'signature-7-cheese') return false;
        if (selectedCategory === 'chicken-pizza' && item.category !== 'chicken-pizza' && item.category !== 'non-veg-pizza') return false;
        if (selectedCategory === 'non-veg-pizza' && item.category !== 'non-veg-pizza' && item.category !== 'chicken-pizza') return false;
        if (selectedCategory === 'pan-pizza' && item.category !== 'pan-pizza') return false;
        if (selectedCategory === 'burgers' && item.category !== 'burgers') return false;
        if (selectedCategory === 'wraps' && item.category !== 'wraps') return false;
        if (selectedCategory === 'starters-sides' && item.category !== 'starters-sides' && item.category !== 'sides') return false;
        if (selectedCategory === 'sides' && item.category !== 'sides' && item.category !== 'starters-sides') return false;
        if (selectedCategory === 'pasta' && item.category !== 'pasta') return false;
        if (selectedCategory === 'chicken-corner' && item.category !== 'chicken-corner') return false;
        if (selectedCategory === 'drinks' && item.category !== 'drinks') return false;
        if (selectedCategory === 'desserts' && item.category !== 'desserts') return false;
        if (selectedCategory === 'combos' && item.category !== 'combos') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0; // popular/default
    });
  }, [menuItems, searchQuery, vegOnly, nonVegOnly, selectedCategory, sortBy]);

  // Featured Hero banner selection
  const handleSelectFeatured = (productId: string) => {
    const item = menuItems.find((m) => m.id === productId) || MENU_ITEMS.find((m) => m.id === productId);
    if (item) {
      handleOpenCustomize(item);
    }
  };

  // Reorder last item
  const lastOrdered = pastOrders[0]?.items[0]?.name;

  // If we're on the billing page, render that instead
  if (currentView === 'billing') {
    return (
      <>
        <BillingPage
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={(c) => setAppliedCoupon(c)}
          onRemoveCoupon={() => setAppliedCoupon(null)}
          orderType={orderType}
          currentAddress={currentAddress}
          onOpenAddressModal={() => setIsAddressModalOpen(true)}
          onSelectAddress={(addr) => {
            setCurrentAddress(addr);
            setAddresses((prev) => [addr, ...prev.filter((a) => a.id !== addr.id)]);
          }}
          onPlaceOrder={(notes, method) => {
            handlePlaceOrder(notes, method);
            setCurrentView('home');
          }}
          onGoBack={() => setCurrentView('home')}
          onAddToCart={handleSimpleAddToCart}
          availableCoupons={coupons}
          availableMenuItems={menuItems}
        />

        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          addresses={addresses}
          currentAddress={currentAddress}
          onSelectAddress={(addr) => setCurrentAddress(addr)}
          onAddNewAddress={(newAddr) => setAddresses((prev) => [newAddr, ...prev])}
        />

        <OrderTrackerModal
          order={activeOrder}
          isOpen={isOrderTrackerOpen}
          onClose={() => setIsOrderTrackerOpen(false)}
          onAdvanceStatus={(nextStatus) => {
            if (activeOrder) {
              setActiveOrder({ ...activeOrder, status: nextStatus });
            }
          }}
        />
      </>
    );
  }

  // If we're on the Admin POS page, render login gate first, then AdminLayout
  if (currentView === 'admin' && !adminOutlet) {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBackToStore={() => setCurrentView('home')}
      />
    );
  }

  // If we're on the Admin POS page, render AdminLayout
  if (currentView === 'admin' && adminOutlet) {
    // Show only this outlet's orders (legacy orders without an outlet stay visible to all)
    const outletOrders = adminOrders.filter((o) => !o.outletId || o.outletId === adminOutlet.id);
    return (
      <AdminLayout
        outlet={adminOutlet}
        orders={outletOrders}
        menuItems={menuItems}
        coupons={coupons}
        onUpdateOrderStatus={(id, status) => {
          setAdminOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        }}
        onAddItem={(item) => {
          setMenuItems((prev) => [item, ...prev]);
          saveMenuItemToFirestore(item).catch(() => {});
        }}
        onUpdateItem={(updated) => {
          setMenuItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
          saveMenuItemToFirestore(updated).catch(() => {});
        }}
        onDeleteItem={(id) => {
          setMenuItems((prev) => prev.filter((it) => it.id !== id));
          deleteMenuItemFromFirestore(id).catch(() => {});
        }}
        onAddCoupon={(coupon) => {
          setCoupons((prev) => [coupon, ...prev]);
        }}
        onDeleteCoupon={(code) => {
          setCoupons((prev) => prev.filter((c) => c.code !== code));
        }}
        onBackToStore={() => setCurrentView('home')}
        onLogout={handleAdminLogout}
        slides={heroSlides}
        onUpdateSlideImage={(id, image) => {
          setHeroSlides((prev) => prev.map((s) => (s.id === id ? { ...s, image } : s)));
        }}
        categories={storeCategories}
        onUpdateCategoryImage={(id, image) => {
          setStoreCategories((prev) => prev.map((c) => (c.id === id ? { ...c, image } : c)));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28 selection:bg-red-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        orderType={orderType}
        setOrderType={setOrderType}
        currentAddress={currentAddress}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
        nonVegOnly={nonVegOnly}
        setNonVegOnly={setNonVegOnly}
        onOpenRewards={() => setIsRewardsModalOpen(true)}
        onOpenAdmin={() => setCurrentView('admin')}
      />

      {/* Main Content Areas based on active tab */}
      {activeTab === 'menu' && (
        <main className="w-full">
          {/* Hero Banner with 7 Cheese Pizza carousel promotions */}
          <HeroBanner
            slides={heroSlides}
            onSelectFeatured={handleSelectFeatured}
            onOpenDeals={() => setIsDealsModalOpen(true)}
          />

          {/* Browse Our Category - Moving Marquee */}
          <CategoryMarquee
            categories={storeCategories}
            onSelectCategory={(key) => {
              setSelectedCategory(key);
              const el = document.getElementById('menu-items-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Craving Categories Grid */}
          <CravingCategories
            selectedCategory={selectedCategory}
            categories={storeCategories}
            onSelectCategory={(key) => {
              setSelectedCategory(key);
              const el = document.getElementById('menu-items-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Active Section & Controls Bar (non-sticky) */}
          <div id="menu-items-section" className="bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 px-3 sm:px-6 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              
              {/* Active Category Display & Reset */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] animate-pulse" />
                  <span className="text-sm sm:text-base font-black text-slate-900 capitalize">
                    {selectedCategory === 'all'
                      ? 'Full Menu'
                      : storeCategories.find((c) => c.filterKey === selectedCategory)?.name || selectedCategory}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    ({filteredProducts.length})
                  </span>
                </div>

                {selectedCategory !== 'all' && (
                  <button
                    id="btn-clear-category-filter"
                    onClick={() => setSelectedCategory('all')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#ED1C24] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <span>✕</span>
                    <span>Show All Menu</span>
                  </button>
                )}
              </div>

              {/* Quick Filters (Veg / Non-Veg & Sort) */}
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 ml-auto">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    id="btn-quick-veg"
                    onClick={() => {
                      setVegOnly(!vegOnly);
                      if (nonVegOnly) setNonVegOnly(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      vegOnly ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:text-emerald-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Veg
                  </button>
                  <button
                    id="btn-quick-nonveg"
                    onClick={() => {
                      setNonVegOnly(!nonVegOnly);
                      if (vegOnly) setVegOnly(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      nonVegOnly ? 'bg-red-600 text-white shadow-xs' : 'text-slate-700 hover:text-red-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Non-Veg
                  </button>
                </div>

                <select
                  id="select-sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="popular">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
            
            {/* Header with Title and count matching Screenshot 4 ("Veg Pizzas (18)") */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍕</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedCategory === 'signature-7-cheese'
                    ? '7 Cheese House Signatures'
                    : selectedCategory === 'veg-pizza'
                    ? 'Fresh Veg Pizzas'
                    : selectedCategory === 'chicken-pizza'
                    ? 'Hot & Spicy Chicken Pizzas'
                    : selectedCategory === 'pan-pizza'
                    ? 'Crispy Pan Pizzas'
                    : selectedCategory === 'burgers'
                    ? 'Gourmet Burgers'
                    : selectedCategory === 'wraps'
                    ? 'Flame-Grilled Signature Wraps'
                    : selectedCategory === 'starters-sides'
                    ? 'Garlic Breads, Starters & Dips'
                    : selectedCategory === 'pasta'
                    ? 'Italian Pastas'
                    : selectedCategory === 'chicken-corner'
                    ? 'Crispy Chicken Corner'
                    : selectedCategory === 'drinks'
                    ? 'Popping Boba Drinks, Shakes & Mocktails'
                    : selectedCategory === 'desserts'
                    ? 'Molten Desserts'
                    : selectedCategory === 'combos'
                    ? 'Party Combos & Value Meals'
                    : 'Our Special Pizzas & Bestsellers'}
                </h2>
                <span className="text-sm font-bold text-slate-500 font-mono">
                  ({filteredProducts.length})
                </span>
              </div>

              {/* Quick Coupon banner pill */}
              <button
                id="btn-quick-view-deals"
                onClick={() => setIsDealsModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[#e31837] border border-red-200 px-3 py-1 rounded-full text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Offers Available</span>
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="text-lg font-black text-slate-800">No items match your filters</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or switching from Veg Only to explore our full menu.
                </p>
                <button
                  id="btn-reset-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setVegOnly(false);
                    setNonVegOnly(false);
                    setSelectedCategory('all');
                  }}
                  className="mt-4 bg-[#005580] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#003d5c] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((item) => {
                  const qty = cartItems
                    .filter((c) => c.productId === item.id)
                    .reduce((acc, c) => acc + c.quantity, 0);

                  return (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onAddToCart={handleSimpleAddToCart}
                      onOpenCustomize={handleOpenCustomize}
                      quantityInCart={qty}
                      onUpdateQuantity={(pid, delta) => handleUpdateProductQuantity(pid, delta)}
                    />
                  );
                })}
              </div>
            )}

            {/* Special Section: 7 Cheese Signature Feature */}
            {selectedCategory === 'all' && (
              <div className="mt-12 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 rounded-3xl border border-amber-300/40 p-5 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      🧀 House Speciality
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                      Original 7 Cheese Signature Pizza
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-lg">
                      Crafted with a luxurious blend of Mozzarella, Cheddar, Gouda, Parmesan, Provolone, Fontina & Ricotta. Finished with fresh basil and herb garlic glaze.
                    </p>
                    <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
                      <span className="text-2xl font-black text-[#ED1C24] font-mono">₹329</span>
                      <button
                        id="btn-7cheese-special-add"
                        onClick={() => {
                          const item = MENU_ITEMS.find((m) => m.id === 'p-7cheese-signature');
                          if (item) handleOpenCustomize(item);
                        }}
                        className="bg-[#ED1C24] hover:bg-[#c91430] text-white font-black px-6 py-2.5 rounded-xl shadow-md text-xs sm:text-sm transition-all cursor-pointer"
                      >
                        Customise & Order
                      </button>
                    </div>
                  </div>

                  <div className="w-full max-w-sm aspect-16/10 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                    <img
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&auto=format&fit=crop&q=80"
                      alt="7 Cheese Pizza"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      )}

      {/* Reorder View Tab */}
      {activeTab === 'reorder' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <RotateCcw className="w-6 h-6 text-[#ED1C24]" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Past Orders & 1-Click Reorder
            </h1>
          </div>

          <div className="space-y-4">
            {pastOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900">
                      Order #{order.orderId}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {order.timestamp} • {order.orderType}
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{order.status}</span>
                  </span>
                </div>

                {/* Items in order */}
                <div className="space-y-2">
                  {order.items.map((it) => (
                    <div key={it.cartItemId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-900">{it.quantity}x</span>
                        <span className="font-medium text-slate-700 truncate">{it.name}</span>
                        {it.size && (
                          <span className="text-slate-400">({it.size}, {it.crust})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{it.price * it.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block">Total Amount Paid</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{order.total}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-track-order-${order.orderId}`}
                      onClick={() => {
                        setActiveOrder(order);
                        setIsOrderTrackerOpen(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Track Order
                    </button>
                    <button
                      id={`btn-reorder-${order.orderId}`}
                      onClick={() => {
                        setCartItems(order.items);
                        setIsCartOpen(true);
                      }}
                      className="bg-[#ED1C24] hover:bg-[#c91430] text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Reorder All
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 Cheese Special Showcase Tab */}
      {activeTab === 'bigbig' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-[#18181b] text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-white/10">
            <div className="relative z-10 max-w-xl">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Signature Innovation
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white mt-3 leading-tight">
                The 7 Cheese Experience
              </h1>
              <p className="text-amber-400 font-bold text-lg mt-1">
                7 Artisanal Cheeses in Harmony
              </p>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                Handcrafted dough infused with garlic butter, topped with Mozzarella for stretch, Cheddar for sharpness, Gouda for smokiness, Parmesan for umami, Provolone for silkiness, Fontina for earthiness, and Ricotta dollops for pure indulgence.
              </p>

              {/* 7 Cheese Badges */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Mozzarella', 'Cheddar', 'Gouda', 'Parmesan', 'Provolone', 'Fontina', 'Ricotta'].map((cheese, i) => (
                  <span key={cheese} className="bg-white/10 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    #{i + 1} {cheese}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-slate-400 line-through text-lg font-mono">₹429</span>
                <span className="text-4xl font-black text-amber-400 font-mono">₹329</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  SAVE ₹100
                </span>
              </div>
              <button
                id="btn-order-7cheese-tab"
                onClick={() => {
                  const item = MENU_ITEMS.find((m) => m.id === 'p-7cheese-signature');
                  if (item) handleOpenCustomize(item);
                }}
                className="mt-6 bg-[#ED1C24] hover:bg-[#c91430] text-white font-black px-8 py-3.5 rounded-full text-base shadow-lg transition-all cursor-pointer"
              >
                Customise & Add 7 Cheese Pizza
              </button>
            </div>

            <div className="mt-6 md:mt-0 md:absolute right-6 bottom-6 md:w-88 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80"
                alt="7 Cheese Pizza Signature"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Combos Tab */}
      {activeTab === 'combos' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Combos & Value Meals
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Super-saver bundles pairing pizzas with garlic breads, desserts and drinks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MENU_ITEMS.filter((m) => m.category === 'combos').map((combo) => (
              <div
                key={combo.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/9 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img
                      src={combo.image}
                      alt={combo.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900">
                      {combo.name}
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      SAVE 25%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{combo.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-black text-lg text-slate-900">
                      ₹{combo.price}
                    </span>
                    {combo.originalPrice && (
                      <span className="font-mono text-xs text-slate-400 line-through">
                        ₹{combo.originalPrice}
                      </span>
                    )}
                  </div>
                  <button
                    id={`btn-add-combo-${combo.id}`}
                    onClick={() => handleSimpleAddToCart(combo)}
                    className="bg-[#ED1C24] hover:bg-[#c91430] text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Add Combo +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Tab view */}
      {activeTab === 'rewards' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cheesy Rewards Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Earn 10 points for every ₹100 spent. Redeem points for free cheesy delights!
            </p>
            <div className="mt-4">
              <button
                id="btn-open-rewards-full"
                onClick={() => setIsRewardsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                View Cheesy Rewards Tiers ({points} / 600 Pts)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals and Drawers */}
      <CustomizeModal
        item={customizingItem}
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        onConfirmAddToCart={handleAddCustomizedToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={(c) => setAppliedCoupon(c)}
        onRemoveCoupon={() => setAppliedCoupon(null)}
        orderType={orderType}
        currentAddress={currentAddress}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
        onSelectAddress={(addr) => {
          setCurrentAddress(addr);
          setAddresses((prev) => [addr, ...prev.filter((a) => a.id !== addr.id)]);
        }}
        onPlaceOrder={(notes, method) => handlePlaceOrder(notes, method)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('billing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onQuickAdd={(pid) => {
          const it = menuItems.find((m) => m.id === pid) || MENU_ITEMS.find((m) => m.id === pid);
          if (it) handleSimpleAddToCart(it);
        }}
        availableCoupons={coupons}
        availableMenuItems={menuItems}
      />

      <OrderTrackerModal
        order={activeOrder}
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        onAdvanceStatus={(nextStatus) => {
          if (activeOrder) {
            setActiveOrder({ ...activeOrder, status: nextStatus });
          }
        }}
      />

      <TrainDeliveryModal
        isOpen={isTrainModalOpen}
        onClose={() => setIsTrainModalOpen(false)}
        onConfirmTrainDelivery={handleConfirmTrainDelivery}
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        currentAddress={currentAddress}
        onSelectAddress={(addr) => setCurrentAddress(addr)}
        onAddNewAddress={(newAddr) => setAddresses((prev) => [newAddr, ...prev])}
      />

      <RewardsModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
        points={points}
        onRedeemReward={handleRedeemReward}
      />

      <DealsModal
        isOpen={isDealsModalOpen}
        onClose={() => setIsDealsModalOpen(false)}
        onApplyCoupon={(c) => {
          setAppliedCoupon(c);
          setIsCartOpen(true);
        }}
        appliedCouponCode={appliedCoupon?.code}
        coupons={coupons}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartItemCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

    </div>
  );
}
