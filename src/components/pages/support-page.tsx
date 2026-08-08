"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  Phone,
  Globe,
  Building2,
  Banknote,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HandCoins,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/* ──────────── ANIMATION VARIANTS ──────────── */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ──────────── COPY BUTTON ──────────── */

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s+/g, " ").trim());
      setCopied(true);
      toast({ title: "Copied!", description: "Details copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 flex-shrink-0 ${className ?? ""}`}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}

/* ──────────── MTN LOGO (Image) ──────────── */

function MTNLogo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 bg-white p-1"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/mtn-momo.png"
        alt="MTN Mobile Money"
        width={size - 8}
        height={size - 8}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/* ──────────── TELECEL LOGO (Image) ──────────── */

function TelecelLogo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0 bg-white p-1"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/telecel-cash.png"
        alt="Telecel Cash"
        width={size - 8}
        height={size - 8}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/* ──────────── GOLD ORNAMENT DIVIDER ──────────── */

function GoldOrnament() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <span className="block w-12 h-[1px] bg-gradient-to-r from-transparent to-gold" />
      <HandCoins className="h-4 w-4 text-gold" />
      <span className="block w-12 h-[1px] bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN SUPPORT PAGE
   ════════════════════════════════════════════════ */

export function SupportPage() {
  const { toast } = useToast();
  const [donationType, setDonationType] = useState<"tithe" | "offering" | "partnership">("offering");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationEmail, setDonationEmail] = useState("");
  const [donationName, setDonationName] = useState("");
  const [donating, setDonating] = useState(false);

  const handleWhatsApp = (number: string) => {
    window.open(
      `https://wa.me/${number.replace(/\s/g, "")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDonation = async () => {
    const amount = parseInt(donationAmount);
    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter an amount of at least GHS 1.", variant: "destructive" });
      return;
    }
    if (!donationEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setDonating(true);
    try {
      const res = await fetch("/api/paystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: donationEmail,
          amount: amount * 100, // convert to pesewas
          fullName: donationName,
          type: "donation",
        }),
      });
      const data = await res.json();
      if (data.success && data.authorization_url) {
        window.open(data.authorization_url, "_blank", "noopener,noreferrer");
        toast({ title: "Redirecting to Paystack", description: "Complete your payment in the new window." });
      } else {
        toast({ title: "Payment Error", description: data.error || "Could not initialize payment. Try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setDonating(false);
    }
  };

  const DONATION_TYPES = [
    { value: "tithe" as const, label: "Tithe", desc: "Your faithful tithe" },
    { value: "offering" as const, label: "Offering", desc: "Freewill offering" },
    { value: "partnership" as const, label: "Partnership", desc: "Partner with us" },
  ];
  const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

  return (
    <div className="flex flex-col">
      {/* ──────── HERO ──────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-15">
          <Image
            src="/images/Ministeybanner.jpg"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z"
              fill="var(--background)"
            />
          </svg>
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Partner With Us
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4"
            >
              Support the Ministry
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              Your offerings, tithes, and support help us fulfill the mandate of
              God and advance His kingdom.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OFFERINGS & TITHES — MOVED TO TOP
          ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-royal relative overflow-hidden">
        {/* subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-5xl mx-auto"
          >
            {/* ── Section heading with decorative Heart illustration ── */}
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="text-center mb-14"
            >
              {/* Decorative golden Heart focal point */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-gold via-[#D4AF37] to-[#B8960C] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                    <Heart className="h-10 w-10 md:h-12 md:w-12 text-white drop-shadow" />
                  </div>
                  {/* decorative ring */}
                  <div className="absolute inset-[-6px] rounded-full border-2 border-dashed border-gold/30 animate-[spin_20s_linear_infinite]" />
                </div>
              </div>

              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Give unto the Lord
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-2">
                Offerings &amp; Tithes
              </h2>
              <GoldOrnament />
              <p className="text-primary-foreground/60 max-w-lg mx-auto mt-4">
                Your generous support enables the ministry to reach more souls,
                care for the needy, and fulfill its divine mandate.
              </p>
            </motion.div>

            {/* ── Payment method cards ── */}
            <motion.div
              variants={fadeInUp}
              custom={1}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
            >
              {/* MTN Mobile Money */}
              <Card className="bg-royal-dark/60 backdrop-blur border-gold/20 hover:border-[#FFC300]/50 hover:shadow-[0_0_30px_rgba(255,195,0,0.08)] transition-all duration-500 overflow-hidden group">
                {/* Brand top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#FFC300] via-[#FFD54F] to-[#FFC300]" />
                <div className="p-5 pb-0 flex items-center gap-3">
                  <MTNLogo />
                  <div>
                    <h3 className="text-white font-bold font-[var(--font-playfair)] text-lg">
                      <span className="text-[#FFC300]">MTN</span> Mobile Money
                    </h3>
                    <p className="text-primary-foreground/50 text-xs mt-0.5">
                      MoMo Transfer
                    </p>
                  </div>
                  <Badge className="ml-auto bg-[#FFC300]/10 text-[#FFC300] border-[#FFC300]/30">
                    MoMo
                  </Badge>
                </div>
                <Separator className="bg-gold/10 my-4" />
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/50 text-xs mb-1">
                        Phone Number
                      </p>
                      <p className="text-white font-mono text-xl tracking-wider font-semibold">
                        0257870755
                      </p>
                    </div>
                    <CopyButton text="0257870755" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/50 text-xs mb-1">
                        Account Name
                      </p>
                      <p className="text-gold font-semibold text-sm">
                        JOSHUA DAWU TETTEH
                      </p>
                    </div>
                    <CopyButton text="JOSHUA DAWU TETTEH" />
                  </div>
                </CardContent>
              </Card>

              {/* Telecel Cash */}
              <Card className="bg-royal-dark/60 backdrop-blur border-gold/20 hover:border-[#0066CC]/50 hover:shadow-[0_0_30px_rgba(0,102,204,0.08)] transition-all duration-500 overflow-hidden group">
                {/* Brand top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0066CC] via-[#3399FF] to-[#0066CC]" />
                <div className="p-5 pb-0 flex items-center gap-3">
                  <TelecelLogo />
                  <div>
                    <h3 className="text-white font-bold font-[var(--font-playfair)] text-lg">
                      <span className="text-[#0066CC]">Telecel</span> Cash
                    </h3>
                    <p className="text-primary-foreground/50 text-xs mt-0.5">
                      Mobile Money Transfer
                    </p>
                  </div>
                  <Badge className="ml-auto bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/30">
                    Cash
                  </Badge>
                </div>
                <Separator className="bg-gold/10 my-4" />
                <CardContent className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/50 text-xs mb-1">
                        Phone Number
                      </p>
                      <p className="text-white font-mono text-xl tracking-wider font-semibold">
                        050505331
                      </p>
                    </div>
                    <CopyButton text="050505331" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/50 text-xs mb-1">
                        Account Name
                      </p>
                      <p className="text-gold font-semibold text-sm">
                        Bright Dumashie
                      </p>
                    </div>
                    <CopyButton text="Bright Dumashie" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ONLINE GIVING — PAYSTACK DONATION
          ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="text-center mb-10"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-gold" />
                <span className="w-10 h-[1px] bg-gold" />
              </div>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Give Online
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mt-3 mb-4">
                Support with Paystack
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Securely give your tithe, offering, or partnership using any debit card, mobile money, or bank transfer via Paystack.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} custom={1}>
              <Card className="border-gold/10 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-royal to-royal-dark p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-[var(--font-playfair)]">Online Donation</h3>
                    <p className="text-white/60 text-xs">Secure payment via Paystack</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-5">
                  {/* Donation Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">Donation Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DONATION_TYPES.map((dt) => (
                        <button
                          key={dt.value}
                          type="button"
                          onClick={() => setDonationType(dt.value)}
                          className={`rounded-lg border p-3 text-center transition-all duration-200 cursor-pointer ${
                            donationType === dt.value
                              ? "border-royal bg-royal/5 text-royal"
                              : "border-gold/10 hover:border-gold/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{dt.label}</span>
                          <span className="block text-[10px] mt-0.5 opacity-60">{dt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm font-medium">Amount (GHS)</Label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDonationAmount(String(amt))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                            donationAmount === String(amt)
                              ? "bg-royal text-white"
                              : "bg-muted text-muted-foreground hover:bg-royal/10 hover:text-royal"
                          }`}
                        >
                          GHS {amt}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      placeholder="Or enter custom amount..."
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      min="1"
                      className="h-11 mt-1"
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="donation-name" className="text-foreground text-sm font-medium">
                      Full Name <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="donation-name"
                      placeholder="Your full name"
                      value={donationName}
                      onChange={(e) => setDonationName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="donation-email" className="text-foreground text-sm font-medium">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="donation-email"
                      type="email"
                      placeholder="you@example.com"
                      value={donationEmail}
                      onChange={(e) => setDonationEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleDonation}
                    disabled={donating || !donationAmount || !donationEmail}
                    className="w-full h-12 text-base font-semibold bg-royal hover:bg-royal-dark text-white transition-all duration-300"
                  >
                    {donating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Give GHS {donationAmount || "0"} as {donationType}
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-muted-foreground/60 text-center">
                    Payments are processed securely by Paystack. Cards, MoMo & bank transfers accepted.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────── SCRIPTURAL BASIS (BELOW offering) ──────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                The Word of God
              </span>
            </motion.div>
            <motion.div variants={fadeInUp} custom={1} className="mt-6">
              <blockquote className="relative bg-card rounded-2xl border border-gold/10 shadow-lg px-8 py-10 md:px-16 md:py-14">
                {/* Gold decorative top line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />

                <span className="text-gold text-6xl font-serif leading-none absolute -top-2 left-8 opacity-25 select-none">
                  &ldquo;
                </span>
                <p className="text-lg md:text-xl font-[var(--font-playfair)] text-foreground leading-relaxed italic">
                  &ldquo;Give, and it will be given to you. A good measure, pressed
                  down, shaken together and running over, will be poured into your
                  lap. For with the measure you use, it will be measured to
                  you.&rdquo;
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <span className="w-8 h-[1px] bg-gold/40" />
                  <p className="text-gold text-sm font-semibold tracking-wide">
                    Luke 6:38 (NIV)
                  </p>
                  <span className="w-8 h-[1px] bg-gold/40" />
                </div>
                <span className="text-gold text-6xl font-serif leading-none absolute -bottom-8 right-8 opacity-25 select-none">
                  &rdquo;
                </span>
              </blockquote>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────── INTERNATIONAL TRANSFER ──────── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-royal/[0.03]">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-gold" />
                <span className="w-10 h-[1px] bg-gold" />
              </div>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                For International Partners
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mt-3 mb-4">
                International Transfer
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                USD Bank Account for international wire transfers and donations.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} custom={1}>
              <Card className="overflow-hidden border-gold/10 shadow-xl">
                {/* Header with royal background */}
                <div className="bg-royal p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center ring-2 ring-gold/20">
                    <Building2 className="h-7 w-7 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-[var(--font-playfair)] text-lg">
                      USD Bank Account
                    </h3>
                    <p className="text-gold text-sm">Lead Bank (USA)</p>
                  </div>
                </div>
                <CardContent className="p-6 md:p-8">
                  {/* Table-like layout */}
                  <div className="rounded-lg border border-gold/10 overflow-hidden">
                    {[
                      {
                        label: "Beneficiary",
                        value: "BRIGHT DUMASHIE",
                        icon: Banknote,
                      },
                      {
                        label: "Account Number",
                        value: "210633430016",
                        icon: null,
                      },
                      {
                        label: "Bank",
                        value: "Lead Bank (USA)",
                        icon: Building2,
                      },
                      {
                        label: "Routing Number",
                        value: "101019644",
                        icon: null,
                      },
                      {
                        label: "Account Type",
                        value: "CHECKING",
                        icon: null,
                      },
                      {
                        label: "Bank Address",
                        value: "1801 Main St., Kansas City, MO 64108",
                        icon: null,
                      },
                      {
                        label: "Beneficiary Address",
                        value: "Adenta, Pine Street, Accra, 00233, GH",
                        icon: Globe,
                      },
                    ].map(({ label, value, icon: Icon }, idx) => (
                      <div
                        key={label}
                        className={`flex items-start justify-between gap-4 px-4 py-3.5 ${
                          idx % 2 === 0 ? "bg-gold/[0.02]" : "bg-transparent"
                        } ${idx > 0 ? "border-t border-gold/5" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 flex-shrink-0 min-w-[140px]">
                          {Icon && (
                            <Icon className="h-4 w-4 text-royal/40" />
                          )}
                          <span className="text-sm text-muted-foreground font-medium">
                            {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold text-foreground text-right ${
                              label === "Bank Address" ||
                              label === "Beneficiary Address"
                                ? "max-w-[260px] break-words"
                                : ""
                            }`}
                          >
                            {value}
                          </span>
                          <CopyButton text={value} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────── IMPORTANT NOTICE ──────── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-gold/20 bg-gold/5">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-royal/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-royal/10">
                  <ShieldCheck className="h-5 w-5 text-royal" />
                </div>
                <div>
                  <h3 className="font-bold font-[var(--font-playfair)] text-royal mb-1">
                    Important Notice
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The account details provided above are from the{" "}
                    <span className="text-royal font-semibold">
                      Account Department of the Ministry
                    </span>{" "}
                    and are the only details used for the ministry. Please verify
                    any payment details directly with the ministry before making
                    transfers. For any inquiries, contact us via WhatsApp or email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────── CONTACT FOR SUPPORT ──────── */}
      <section className="py-16 md:py-20 bg-royal relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="text-center mb-10"
            >
              <MessageCircle className="h-8 w-8 text-gold mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-white mb-3">
                Need Help?
              </h3>
              <p className="text-primary-foreground/60 max-w-md mx-auto">
                Reach out to us for questions about your support, offerings, or
                any other inquiries.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              custom={1}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
            >
              <Card
                className="bg-royal-dark/60 backdrop-blur border-gold/20 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)] transition-all duration-300 cursor-pointer group"
                onClick={() => handleWhatsApp("233257870755")}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-green-500/20">
                    <MessageCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">WhatsApp</p>
                    <p className="text-primary-foreground/70 text-sm font-mono">
                      +233 257 870 755
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gold/50 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
              <Card
                className="bg-royal-dark/60 backdrop-blur border-gold/20 hover:border-gold/40 hover:shadow-[0_0_24px_rgba(212,175,55,0.08)] transition-all duration-300 cursor-pointer group"
                onClick={() => handleWhatsApp("233542061290")}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-green-500/20">
                    <MessageCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">WhatsApp</p>
                    <p className="text-primary-foreground/70 text-sm font-mono">
                      +233 542 061 290
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gold/50 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp} custom={2} className="mt-8 text-center">
              <Button
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold gap-2 transition-colors"
                asChild
              >
                <Link href="/contact">
                  <ExternalLink className="h-4 w-4" />
                  Contact Us
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
