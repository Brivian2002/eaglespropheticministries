"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AMAZON_LISTING =
  "https://www.amazon.com.au/ENDTIMES-PROPHETIC-Gabriel-Christ-Alorgo-ebook/dp/B0HDMBRRB2";
const SELAR_LISTING = "https://selar.com/9n6015tb68";

type FulfillmentState = "idle" | "verifying" | "ready" | "downloading" | "complete" | "expired" | "error";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: "GHS";
  coverImage: string;
  category: string;
  contents: string[];
  fulfillmentNote?: string;
  purchasable: boolean;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "the-endtimes-prophetic-guide-pdf",
    title: "The Endtimes Prophetic Guide — PDF only",
    slug: "the-endtimes-prophetic-guide-pdf",
    description: "The complete book in a digital PDF edition.",
    price: 16000,
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "pdf",
    contents: ["Full book in PDF format"],
    purchasable: false,
  },
  {
    id: "the-endtimes-prophetic-guide-android-app",
    title: "Android app bundle — book PDF + audiobook",
    slug: "the-endtimes-prophetic-guide-android-app",
    description: "The Android app bundle contains both the complete book PDF and its audiobook inside the app.",
    price: 20000,
    currency: "GHS",
    coverImage: "/images/EPMBook.jpg",
    category: "android-app-bundle",
    contents: ["Android app", "Complete book PDF inside the app", "Audiobook inside the app"],
    fulfillmentNote: "Debug-signed review build, not production-signed. Approximately 1.06 GB.",
    purchasable: false,
  },
];

const resettableStates: FulfillmentState[] = ["complete", "expired"];

export function BookStorePage() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [productsError, setProductsError] = useState("");
  const [purchaseEmail, setPurchaseEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [initError, setInitError] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentState>("idle");
  const [fulfillmentMessage, setFulfillmentMessage] = useState("");
  const [ticket, setTicket] = useState("");
  const [ticketExpiresAt, setTicketExpiresAt] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const verificationInProgress = useRef("");

  const fetchProducts = useCallback(async () => {
    setProductsError("");
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.products) || data.products.length !== 2) {
        throw new Error("The product list could not be loaded.");
      }
      setProducts(data.products);
    } catch {
      setProducts(FALLBACK_PRODUCTS);
      setProductsError("The live catalogue could not be reached. Checkout is disabled until it is available.");
    }
  }, []);

  const verifyPayment = useCallback(async (reference: string) => {
    if (!reference || verificationInProgress.current === reference) return;
    verificationInProgress.current = reference;
    setPaymentReference(reference);
    setFulfillment("verifying");
    setFulfillmentMessage("");

    try {
      const response = await fetch(`/api/download/verify?reference=${encodeURIComponent(reference)}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success || typeof data.ticket !== "string") {
        throw new Error(data.error || "We could not confirm this payment. No download authorization was issued.");
      }

      setTicket(data.ticket);
      setTicketExpiresAt(data.expiresAt || "");
      setProductTitle(data.productTitle || "your item");
      setPaymentReference("");
      setFulfillment("ready");
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("trxref");
      currentUrl.searchParams.delete("reference");
      window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    } catch (error) {
      setFulfillmentMessage(error instanceof Error ? error.message : "Payment verification failed.");
      setFulfillment("error");
    } finally {
      verificationInProgress.current = "";
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchProducts(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("trxref") || params.get("reference") || "";
    if (!reference) return;
    const timer = window.setTimeout(() => void verifyPayment(reference), 0);
    return () => window.clearTimeout(timer);
  }, [verifyPayment]);

  useEffect(() => {
    if (fulfillment !== "ready" || !ticketExpiresAt) return;
    const remaining = Math.max(0, new Date(ticketExpiresAt).getTime() - Date.now());
    const timer = window.setTimeout(() => {
      setTicket("");
      setFulfillmentMessage("The short-lived download authorization expired. Return to the store to start again if needed.");
      setFulfillment("expired");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [fulfillment, ticketExpiresAt]);

  useEffect(() => {
    if (!resettableStates.includes(fulfillment)) return;
    const timer = window.setTimeout(() => {
      setFulfillment("idle");
      setFulfillmentMessage("");
      setTicket("");
      setTicketExpiresAt("");
      setPaymentReference("");
      setProductTitle("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [fulfillment]);

  useEffect(() => {
    if (fulfillment !== "downloading" || !ticket) return;
    let active = true;
    let requestRunning = false;

    const pollStatus = async () => {
      if (requestRunning) return;
      requestRunning = true;
      try {
        const response = await fetch("/api/download/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
          cache: "no-store",
        });
        const data = await response.json();
        if (!active) return;
        if (data.state === "consumed") {
          setTicket("");
          setFulfillmentMessage("");
          setFulfillment("complete");
        } else if (data.state === "issued") {
          setFulfillmentMessage("The download did not finish. Your authorization is still available; you can try again.");
          setFulfillment("ready");
        } else if (data.state === "expired" || response.status === 404 || response.status === 410) {
          setTicket("");
          setFulfillmentMessage("The download authorization expired. Return to the store to start again if needed.");
          setFulfillment("expired");
        }
      } catch {
        // Keep polling during transient network failures; the ticket remains server-side and time-limited.
      } finally {
        requestRunning = false;
      }
    };

    void pollStatus();
    const interval = window.setInterval(() => void pollStatus(), 2000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [fulfillment, ticket]);

  const formatPrice = (amount: number) => `GHS ${(amount / 100).toFixed(2)}`;

  const handlePurchase = async (product: Product) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaseEmail.trim())) {
      setInitError("Enter a valid email address to continue to Paystack.");
      return;
    }
    if (!product.purchasable) {
      setInitError("Secure checkout is not configured for this deployment. No payment has been started.");
      return;
    }

    setInitError("");
    setInitiating(true);
    try {
      const response = await fetch("/api/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: purchaseEmail.trim(), productId: product.id, type: "book" }),
      });
      const data = await response.json();
      if (!response.ok || data.error || typeof data.authorization_url !== "string") {
        throw new Error(data.error || "Payment initialization failed.");
      }
      const authorizationUrl = new URL(data.authorization_url);
      if (authorizationUrl.protocol !== "https:" || authorizationUrl.hostname !== "checkout.paystack.com") {
        throw new Error("The payment provider returned an unexpected checkout link.");
      }
      window.location.assign(authorizationUrl.toString());
    } catch (error) {
      setInitError(error instanceof Error ? error.message : "Network error. Please try again.");
    } finally {
      setInitiating(false);
    }
  };

  const startDownload = () => {
    if (!ticket) return;
    let frame = document.getElementById("epm-download-frame") as HTMLIFrameElement | null;
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = "epm-download-frame";
      frame.name = "epm-download-frame";
      frame.title = "Secure file download";
      frame.tabIndex = -1;
      frame.setAttribute("aria-hidden", "true");
      frame.style.display = "none";
      document.body.appendChild(frame);
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download/stream";
    form.target = frame.name;
    form.style.display = "none";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "ticket";
    input.value = ticket;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    form.remove();
    setFulfillmentMessage("The server is securely streaming your file. Keep this page open while the download runs.");
    setFulfillment("downloading");
  };

  const flowTitle: Record<FulfillmentState, string> = {
    idle: "",
    verifying: "Checking payment",
    ready: "Your payment is verified",
    downloading: "Secure download in progress",
    complete: "Download finished",
    expired: "Download authorization expired",
    error: "Payment verification needs attention",
  };

  return (
    <main className="flex flex-col">
      <header className="bg-royal px-4 py-6 md:px-8 md:py-8">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold">Ministry Resources</p>
          <h1 className="mt-1 font-[var(--font-playfair)] text-2xl font-bold text-white md:text-3xl">Book Store</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Choose the book format that suits you. Local checkout is securely verified before a private download is offered.
          </p>
        </div>
      </header>

      {fulfillment !== "idle" && (
        <section className="container mx-auto w-full max-w-6xl px-4 pt-6 md:px-8" aria-live="polite">
          <Card className="border-royal/20 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {fulfillment === "verifying" || fulfillment === "downloading" ? (
                  <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-royal" />
                ) : fulfillment === "complete" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : fulfillment === "error" || fulfillment === "expired" ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-royal" />
                )}
                <div>
                  <h2 className="font-semibold text-foreground">{flowTitle[fulfillment]}{productTitle ? ` — ${productTitle}` : ""}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fulfillmentMessage || (fulfillment === "ready"
                      ? "Paystack confirmed the exact amount, currency, payment reference, and product. Start the download only when you are ready."
                      : fulfillment === "verifying"
                        ? "We are checking the transaction directly with Paystack; no download is available before confirmation."
                        : fulfillment === "complete"
                          ? "The server finished streaming the file. This notice will clear shortly."
                          : "" )}
                  </p>
                  {fulfillment === "ready" && ticketExpiresAt && (
                    <p className="mt-1 text-xs text-muted-foreground">This one-time download authorization expires at {new Date(ticketExpiresAt).toLocaleTimeString()}.</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {fulfillment === "ready" && ticket && (
                  <Button onClick={startDownload} className="bg-royal text-white hover:bg-royal-light">
                    <Download className="mr-2 h-4 w-4" /> Download now
                  </Button>
                )}
                {fulfillment === "error" && paymentReference && (
                  <Button onClick={() => void verifyPayment(paymentReference)} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Verify again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
              <BookOpen className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-[var(--font-playfair)] text-xl font-bold text-foreground">The Endtimes Prophetic Guide</h2>
              <p className="mt-1 text-sm text-muted-foreground">Two local digital options. Prices are in Ghana cedis.</p>
            </div>
          </div>

          {productsError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{productsError}</span>
              <Button onClick={() => void fetchProducts()} variant="ghost" size="sm" className="ml-auto">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {products.map((product) => {
              const isApp = product.category === "android-app-bundle";
              return (
                <Card key={product.id} className="overflow-hidden rounded-2xl border-border transition-shadow hover:shadow-lg">
                  <div className="grid sm:grid-cols-[180px_1fr]">
                    <div className="relative min-h-56 bg-gradient-to-br from-royal to-royal-dark sm:min-h-full">
                      <Image
                        src={product.coverImage || "/images/EPMBook.jpg"}
                        alt="Cover of The Endtimes Prophetic Guide"
                        fill
                        sizes="(max-width: 640px) 100vw, 180px"
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="flex flex-col p-5 md:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="secondary" className="rounded-full bg-gold/10 text-[10px] uppercase tracking-wider text-gold-dark">
                          {isApp ? "Android bundle" : "Digital PDF"}
                        </Badge>
                        <span className="text-xl font-bold text-royal">{formatPrice(product.price)}</span>
                      </div>
                      <h3 className="mt-3 font-[var(--font-playfair)] text-lg font-bold leading-snug text-foreground">{product.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                      <ul className="mt-4 space-y-2 text-sm text-foreground/85">
                        {product.contents.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            {item.toLowerCase().includes("audio") ? <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> : isApp ? <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gold" />}
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {product.fulfillmentNote && (
                        <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                          <strong>Important:</strong> This is a debug-signed review APK, not a production-signed release. It is approximately 1.06 GB; download time may depend on your connection and the hosting limit.
                        </p>
                      )}
                      <Button
                        className="mt-5 w-full bg-gold font-semibold text-royal-dark hover:bg-gold-dark"
                        onClick={() => { setSelectedProduct(product); setInitError(""); }}
                        disabled={!product.purchasable}
                        title={!product.purchasable ? "Checkout is not configured in this deployment" : undefined}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {product.purchasable ? "Continue to secure checkout" : "Checkout unavailable in this deployment"}
                      </Button>
                      {!product.purchasable && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">No payment will be started here.</p>
                      )}
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Lock, title: "Paystack checkout", text: "The server sets the product price; checkout starts only when you choose it." },
              { icon: ShieldCheck, title: "Verified first", text: "Payment status, exact amount, currency, reference, and product are checked before download." },
              { icon: Download, title: "Private file delivery", text: "A short-lived one-time authorization streams the file without publishing a Drive link." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p></div>
              </div>
            ))}
          </div>

          <section className="mt-10" aria-labelledby="other-sellers">
            <h2 id="other-sellers" className="mb-4 font-[var(--font-playfair)] text-lg font-bold text-foreground">Other ways to get the book</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <a href={AMAZON_LISTING} target="_blank" rel="noopener noreferrer" className="group rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="flex h-full items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted"><BookOpen className="h-6 w-6 text-royal" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">View the Kindle edition on Amazon</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">THE ENDTIMES PROPHETIC GUIDE by Gabriel Christ Alorgo, edited by Bright Dumashie. Amazon’s Kindle listing is separate from the local PDF and Android bundle.</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
              <a href={SELAR_LISTING} target="_blank" rel="noopener noreferrer" className="group rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="flex h-full items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted"><Image src="/images/selar-logo.png" alt="" width={28} height={28} className="rounded" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">Buy on Selar</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Prefer Selar? Open the existing ministry listing on Selar’s secure platform.</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            </div>
          </section>

          <Card className="mt-8 rounded-2xl border-border">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Need help?</h2>
              <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
                <a href="mailto:eaglespropheticministries@gmail.com" className="flex items-center gap-2 hover:text-royal"><Mail className="h-4 w-4" /> eaglespropheticministries@gmail.com</a>
                <a href="https://wa.me/233257870755" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-600"><MessageCircle className="h-4 w-4" /> WhatsApp: +233 257 870 755</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="purchase-title" className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold">Secure checkout</p>
                <h2 id="purchase-title" className="mt-1 font-[var(--font-playfair)] text-lg font-bold text-foreground">{selectedProduct.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} aria-label="Close checkout dialog" className="rounded p-1 text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="mb-5 flex items-center justify-between rounded-lg bg-muted p-3">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-lg font-bold text-royal">{formatPrice(selectedProduct.price)}</span>
            </div>
            {initError && <p role="alert" className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600">{initError}</p>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="purchase-email">Email address</Label>
                <Input id="purchase-email" type="email" autoComplete="email" placeholder="you@example.com" value={purchaseEmail} onChange={(event) => setPurchaseEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handlePurchase(selectedProduct); }} className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">Paystack uses this email for your transaction receipt.</p>
              </div>
              <Button onClick={() => void handlePurchase(selectedProduct)} disabled={initiating || !selectedProduct.purchasable} className="w-full bg-gold py-5 font-semibold text-royal-dark hover:bg-gold-dark">
                {initiating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening Paystack…</> : <><CreditCard className="mr-2 h-4 w-4" /> Continue to Paystack</>}
              </Button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground"><Lock className="mr-1 inline h-3 w-3" />Payment details are entered on Paystack’s secure checkout.</p>
          </section>
        </div>
      )}
    </main>
  );
}
