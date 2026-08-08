"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Cross, Heart, Eye, Users, Target, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ──────────── ANIMATED GHANA FLAG ──────────── */

function GhanaFlag({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className || ""}`}>
      {/* Flag stripes — with wave animation */}
      <div className="flag-wave-container">
        <div className="flag-stripe flag-red" />
        <div className="flag-stripe flag-gold-stripe" />
        <div className="flag-stripe flag-green-stripe" />
      </div>
      {/* Star in the center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 40 40" className="flag-star drop-shadow-lg">
          <polygon points="20,2 24.5,14.5 38,14.5 27,22.5 31,35 20,27 9,35 13,22.5 2,14.5 15.5,14.5" fill="#000" />
        </svg>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ──────── HERO ──────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/Ministeybanner.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="var(--background)" />
          </svg>
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">Who We Are</span>
            </motion.div>
            <motion.h1
              variants={fadeInUp} custom={1}
              className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4"
            >
              About Us
            </motion.h1>
            <motion.p variants={fadeInUp} custom={2} className="text-white/70 text-lg max-w-2xl mx-auto">
              A prophetic move of the endtime hosts of God.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ──────── ABOUT CONTENT WITH FLAG ──────── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-5xl mx-auto">
            <motion.div variants={fadeInUp} custom={0}>
              <Card className="overflow-hidden border-gold/10 shadow-xl">
                <div className="flex flex-col md:flex-row">
                  {/* Left: Animated Flag with Round Logo */}
                  <div className="relative w-full md:w-2/5 min-h-[320px] md:min-h-[420px] flex items-center justify-center overflow-hidden">
                    {/* Ghana Flag as background */}
                    <GhanaFlag className="absolute inset-0" />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Round Logo in front of flag */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                      className="relative z-10"
                    >
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-gold/40">
                        <Image
                          src="/images/Ministrylogo.jpg"
                          alt="EPM Logo"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </motion.div>
                  </div>
                  <CardContent className="flex-1 p-8 md:p-10">
                    <Badge className="bg-gold/10 text-gold border-gold/30 mb-4">Est. 2000</Badge>
                    <h2 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-royal mb-4">
                      Eagles Prophetic Ministries
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Eagles Prophetic Ministries is a vibrant, Spirit-led ministry
                      called to be a prophetic voice to this generation. Founded in
                      Ghana, we are dedicated to grooming servants of God toward
                      fulfilling the divine mandate upon their lives.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      As an endtime ministry, our primary focus is to expose the
                      deceptions of the evil one, minister the mind of Christ to the
                      Body of Christ, and ultimately prepare the Church for the second
                      coming of our Lord Jesus Christ.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ──────── MISSION & VISION ──────── */}
      <section className="py-20 md:py-28 bg-royal">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-5xl mx-auto">
            <motion.div variants={fadeInUp} custom={0} className="text-center mb-16">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">Our Purpose</span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4">Mission &amp; Vision</h2>
              <div className="section-divider w-24 mx-auto" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={fadeInUp} custom={1}>
                <Card className="border-gold/20 h-full">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-6">
                      <Target className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold font-[var(--font-playfair)] text-royal mb-4">Our Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To groom and equip servants of God for the work of the ministry,
                      revealing biblical truths, teaching the mind of Christ, and
                      preparing the Body of Christ for the return of our Lord Jesus
                      Christ.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp} custom={2}>
                <Card className="border-gold/20 h-full">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-6">
                      <Eye className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold font-[var(--font-playfair)] text-royal mb-4">Our Vision</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      To see a Church that is spiritually prepared, biblically
                      grounded, and prophetically awakened — a people who walk in
                      the fullness of God&apos;s purpose and are ready for the
                      second coming of the Lord.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──────── CORE VALUES ──────── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-5xl mx-auto">
            <motion.div variants={fadeInUp} custom={0} className="text-center mb-16">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">What We Stand For</span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mt-3 mb-4">Core Values</h2>
              <div className="section-divider w-24 mx-auto" />
            </motion.div>

            <motion.div variants={fadeInUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Cross, title: "Christ-Centered", desc: "Jesus Christ at the center of all we do." },
                { icon: ShieldCheck, title: "Truth & Integrity", desc: "Committed to biblical truth without compromise." },
                { icon: Heart, title: "Love & Service", desc: "Serving God and His people with genuine love." },
                { icon: Users, title: "Community", desc: "Building a united Body of Christ for the endtimes." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-gold/10 hover:border-gold/30 transition-colors group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-royal/5 flex items-center justify-center mb-4 group-hover:bg-royal/10 transition-colors">
                      <Icon className="h-5 w-5 text-royal" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 font-[var(--font-playfair)]">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
