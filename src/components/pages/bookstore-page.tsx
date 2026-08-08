"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Mail,
  MessageCircle,
  CreditCard,
  Download,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  MailCheck,
  RefreshCw,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

type PostPaymentState =
  | "idle"
  | "verifying"
  | "downloading"
  | "success"
  | "error";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  coverImage: string | null;
  category: string;
  isActive: boolean;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "the-endtimes-prophetic-guide",
    title: "THE ENDTIMES PROPHETIC GUIDE",
    slug: "the-endtimes-prophetic-guide",
    description:
      "A comprehensive prophetic guide by Prophet Gabriel Christ Alorgo, revealing what the Bible says about the end times.",
    price: 15000,
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "book",
    isActive: true,
  },
];

export function BookStorePage() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [productsError, setProductsError] = useState("");
  const [purchaseEmail, setPurchaseEmail] = useState("");
  const [purchaseName, setPurchaseName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState("");

  // Post-payment flow state
  const [postPayment, setPostPayment] = useState<PostPaymentState>("idle");
  const [postPaymentError, setPostPaymentError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [productTitle, setProductTitle] = useState("");

  const fetchProducts = useCallback(async () => {
    setProductsError("");
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch {
      // silently keep fallback
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const load = async () => {
      await fetchProducts();
    };
    load();
  }, [fetchProducts]);

  // =================================================================
  // AUTO-VERIFY & DOWNLOAD: When Paystack redirects back with ?trxref=
  // or ?reference=, we verify with Paystack API and auto-download.
  // =================================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("trxref") || params.get("reference") || "";

    if (!reference) return;

    let cancelled = false;

    async function verifyAndDownload() {
      setPostPayment("verifying");
      setPostPaymentError("");

      try {
        // Small delay to ensure Paystack has fully processed
        await new Promise((r) => setTimeout(r, 1500));

        const res = await fetch(`/api/download/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setPostPayment("error");
          setPostPaymentError(data.error || "Payment verification failed.");
          return;
        }

        setDownloadUrl(data.downloadUrl);
        setProductTitle(data.productTitle || "");
        setPostPayment("downloading");

        // Clean the URL immediately (remove ?trxref= or ?reference=)
        // so the user stays on the bookstore page visually
        window.history.replaceState({}, "", "/");

        // Trigger download WITHOUT navigating away from the page
        // Using a hidden anchor so the user stays on bookstore
        const triggerDownload = (url: string) => {
          const a = document.createElement('a');
          a.href = url;
          a.style.display = 'none';
          a.setAttribute('download', '');
          document.body.appendChild(a);
          a.click();
          // Clean up after a short delay
          setTimeout(() => document.body.removeChild(a), 1000);
        };

        triggerDownload(data.downloadUrl);

        // After a moment, show success
        setTimeout(() => {
          if (!cancelled) {
            setPostPayment("success");
          }
        }, 3000);
      } catch {
        if (!cancelled) {
          setPostPayment("error");
          setPostPaymentError("Network error. Please try again.");
        }
      }
    }

    void verifyAndDownload();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatPrice = (amount: number) => `GHS ${(amount / 100).toFixed(2)}`;

  const handlePurchase = async (product: Product) => {
    if (!purchaseEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaseEmail)) {
      setInitError("Please enter a valid email address.");
      return;
    }
    setInitError("");
    setInitiating(true);
    try {
      const res = await fetch("/api/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: purchaseEmail,
          fullName: purchaseName || undefined,
          amount: product.price,
          productId: product.id,
          type: "book",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setInitError(data.error || "Payment initialization failed.");
        return;
      }
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setInitError("Network error. Please try again.");
    } finally {
      setInitiating(false);
    }
  };

  const triggerDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);
  };

  const handleRetryDownload = () => {
    if (downloadUrl) {
      setPostPayment("downloading");
      triggerDownload(downloadUrl);
      setTimeout(() => setPostPayment("success"), 3000);
    }
  };

  const handleDismiss = () => {
    setPostPayment("idle");
    setDownloadUrl("");
    setPostPaymentError("");
  };

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="bg-royal px-4 md:px-8 py-4">
        <div className="container mx-auto">
          <p className="text-gold text-[10px] tracking-[0.3em] uppercase font-medium">Ministry Resources</p>
          <h1 className="text-xl md:text-2xl font-bold font-[var(--font-playfair)] text-white">Book Store</h1>
          <p className="text-white/60 text-xs mt-0.5">Get your copy of prophetic and teaching materials from Prophet Gabriel Christ Alorgo.</p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* POST-PAYMENT OVERLAY: Verifying / Downloading / Success       */}
      {/* ============================================================ */}
      <AnimatePresence>
        {postPayment !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 border border-border text-center"
            >
              {postPayment === "verifying" && (
                <>
                  <Loader2 className="h-12 w-12 text-gold mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground mb-2">Verifying Your Payment</h3>
                  <p className="text-sm text-muted-foreground">Please wait while we confirm your transaction with Paystack...</p>
                </>
              )}

              {postPayment === "downloading" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-royal/10 flex items-center justify-center">
                    <Download className="h-8 w-8 text-royal animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground mb-2">Downloading Your Book!</h3>
                  <p className="text-sm text-muted-foreground">Your copy of &ldquo;{productTitle}&rdquo; is being downloaded now...</p>
                  <p className="text-xs text-muted-foreground mt-2">If the download doesn&apos;t start automatically, click below.</p>
                  <Button onClick={handleRetryDownload} className="mt-4 bg-royal hover:bg-royal-light text-white">
                    <Download className="h-4 w-4 mr-2" /> Download Now
                  </Button>
                </>
              )}

              {postPayment === "success" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <PartyPopper className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold font-[var(--font-playfair)] text-foreground mb-2">Payment Successful! 🎉</h3>
                  <p className="text-sm text-muted-foreground mb-1">Your copy of &ldquo;{productTitle}&rdquo; has been downloaded.</p>
                  <p className="text-sm text-muted-foreground mb-6">May God bless you through this material.</p>
                  <div className="flex gap-3 justify-center">
                    {downloadUrl && (
                      <Button onClick={handleRetryDownload} variant="outline" className="border-royal text-royal hover:bg-royal/10">
                        <Download className="h-4 w-4 mr-2" /> Download Again
                      </Button>
                    )}
                    <Button onClick={handleDismiss} className="bg-royal hover:bg-royal-light text-white">
                      Continue Browsing
                    </Button>
                  </div>
                </>
              )}

              {postPayment === "error" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground mb-2">Verification Issue</h3>
                  <p className="text-sm text-muted-foreground mb-4">{postPaymentError}</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        const ref = params.get("trxref") || params.get("reference");
                        if (ref) window.location.reload();
                      }}
                      variant="outline"
                      className="border-royal text-royal hover:bg-royal/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                    <Button onClick={handleDismiss} className="bg-royal hover:bg-royal-light text-white">
                      Back to Store
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books Section */}
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="visible" animate="visible" variants={stagger}>
              <motion.div variants={fadeInUp} custom={0}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-[var(--font-playfair)] text-foreground">Available Books</h2>
                    <p className="text-sm text-muted-foreground">Secure payment via Paystack &middot; Instant download after payment</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} custom={1}>
                {productsError && (
                  <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{productsError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-white hover:bg-red-500/20 ml-auto"
                      onClick={fetchProducts}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Book Card with Paystack — takes 2 columns */}
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="lg:col-span-2 border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden rounded-xl"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-40 h-56 sm:h-auto bg-gradient-to-br from-royal to-royal-dark flex-shrink-0 flex items-center justify-center p-3">
                            {product.coverImage ? (
                              <Image
                                src={product.coverImage}
                                alt={product.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 200px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="relative w-32 h-48 rounded-sm overflow-hidden shadow-2xl ring-2 ring-gold/40">
                                <Image
                                  src="/images/EPMBook.jpg"
                                  alt={product.title}
                                  fill
                                  sizes="128px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <CardContent className="flex-1 p-5 flex flex-col justify-center gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="bg-gold/10 text-gold-dark text-[10px] uppercase tracking-wider rounded-full"
                              >
                                {product.category}
                              </Badge>
                              <span className="text-2xl font-bold text-royal">{formatPrice(product.price)}</span>
                            </div>
                            <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground leading-snug">
                              {product.title}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <Button
                                className="bg-gold hover:bg-gold-dark text-royal-dark font-medium text-sm rounded-lg"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setInitError("");
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" /> Pay with Paystack
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}

                    {/* Selar Card — 1 column on the right */}
                    <a
                      href="https://selar.com/9n6015tb68"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lg:col-span-1"
                    >
                      <Card className="h-full border-border hover:shadow-lg hover:-translate-y-0.5 hover:border-royal/30 transition-all duration-300 overflow-hidden rounded-xl cursor-pointer">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4 h-full">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                            <Image src="/images/selar-logo.png" alt="Selar" width={28} height={28} className="rounded" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Buy on Selar</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Prefer Selar? Purchase the book directly on Selar&apos;s secure platform.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-royal">
                            <span>Open Selar Store</span>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5h6m0 0v6m0-6L9.75 14.25" /></svg>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </div>
                ) : (
                  <Card className="border-border rounded-xl">
                    <CardContent className="py-20 text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
                        No Products Available
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Books will appear here once they are added. Please check back soon.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>

              <motion.div
                variants={fadeInUp}
                custom={2}
                className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { icon: Lock, label: "Secure Payment", desc: "Paystack encrypted checkout" },
                  { icon: ShieldCheck, label: "Instant Download", desc: "Get your book immediately after payment" },
                  { icon: MailCheck, label: "Instant File Delivery", desc: "Book downloads directly to your device (PDF or ZIP)" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="pb-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border rounded-xl">
              <CardContent className="p-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">Need Help?</h4>
                <div className="flex flex-col gap-3">
                  <a
                    href="mailto:eaglespropheticministries@gmail.com"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-royal transition-colors"
                  >
                    <Mail className="h-4 w-4" /> eaglespropheticministries@gmail.com
                  </a>
                  <a
                    href="https://wa.me/233257870755"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-green-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp: +233 257 870 755
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Purchase Dialog */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setSelectedProduct(null);
              setInitError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground">
                  Purchase: {selectedProduct.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setInitError("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-xl font-bold text-royal">{formatPrice(selectedProduct.price)}</span>
                </div>
              </div>
              {initError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{initError}</p>
                </div>
              )}
                <div className="space-y-4">
                <div>
                  <Label htmlFor="purchase-name">Full Name (optional)</Label>
                  <Input
                    id="purchase-name"
                    placeholder="John Doe"
                    value={purchaseName}
                    onChange={(e) => setPurchaseName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase-email">Email Address *</Label>
                  <Input
                    id="purchase-email"
                    type="email"
                    placeholder="your@email.com"
                    value={purchaseEmail}
                    onChange={(e) => setPurchaseEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePurchase(selectedProduct)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => handlePurchase(selectedProduct)}
                  disabled={initiating}
                  className="w-full bg-gold hover:bg-gold-dark text-royal-dark font-semibold py-5"
                >
                  {initiating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" /> Pay with Paystack
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-4">
                <Lock className="h-3 w-3 inline mr-1" /> Secured by Paystack. Your payment information is encrypted.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
