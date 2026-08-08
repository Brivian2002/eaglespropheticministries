"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen, Cross, Eye, GraduationCap, Heart, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export function ProphetPage() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/Ministeybanner.jpg" alt="" fill className="object-cover" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-royal-dark via-royal-dark/60 to-transparent" />

        <div className="relative z-10 container mx-auto px-4 md:px-8 py-20 md:py-28">
          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div variants={fadeInUp} custom={0} className="flex-shrink-0">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-gold/30 via-transparent to-gold/30 blur-xl" />
                <div className="relative w-60 h-60 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-gold/60 shadow-2xl">
                  <Image src="/images/TheProphet.jpg" alt="Prophet Gabriel Christ Alorgo" fill className="object-cover object-top" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-dark/30 to-transparent" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-36 h-1 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full" />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} custom={1} className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <span className="w-12 h-[1px] bg-gold" />
                <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">Meet The Prophet</span>
                <span className="w-12 h-[1px] bg-gold" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white leading-tight mb-4">
                Prophet Gabriel
                <br />
                <span className="text-gradient-gold">Christ Alorgo</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 font-[var(--font-playfair)] mb-2">Founder &amp; Lead Shepherd</p>
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse-gold" />
                <span className="text-gold text-sm font-medium tracking-wide">Eagles Prophetic Ministries</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* BIOGRAPHY */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} custom={0} className="text-center mb-16">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">His Story</span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mt-3 mb-4">Biography</h2>
              <div className="section-divider w-24 mx-auto" />
            </motion.div>

            <motion.div variants={fadeInUp} custom={1}>
              <div className="bg-card rounded-2xl border border-gold/10 shadow-lg p-8 md:p-12">
                <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
                  <p className="text-foreground/90">
                    <span className="text-royal font-semibold font-[var(--font-playfair)] text-xl">Prophet Gabriel Christ Alorgo</span> is a vibrant servant of the Lord Jesus, born in the year 2000 in Ghana. He carries the calling of a <span className="text-royal font-medium">prophet</span> and a <span className="text-royal font-medium">teacher</span>.
                  </p>
                  <p>
                    His ministry is centered on <span className="text-royal font-medium">grooming servants of God</span> toward fulfilling the mandate of God upon their lives. With deep conviction and unwavering dedication, he has devoted his life to equipping the saints for the work of the ministry.
                  </p>
                  <p>
                    As a <span className="text-royal font-medium">prophetic voice to his generation</span>, his top priority is to expose the deceptions of the evil one, minister the mind of Christ to the Body of Christ, and ultimately prepare the Church for the second coming of our Lord Jesus Christ.
                  </p>
                  <div className="border-l-4 border-gold/50 pl-6 py-2 bg-gold/5 rounded-r-lg">
                    <p className="italic text-foreground/80 font-[var(--font-playfair)]">
                      &ldquo;He is the lead shepherd of <span className="text-gold font-semibold">Eagles Prophetic Ministries</span>, a prophetic move of the endtime hosts of God.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gold/10">
                  {[
                    { icon: Cross, label: "Prophet" },
                    { icon: GraduationCap, label: "Teacher" },
                    { icon: Eye, label: "Seer" },
                    { icon: Heart, label: "Shepherd" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-royal/5 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-royal" />
                      </div>
                      <span className="text-sm font-medium text-foreground/70">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROPHETIC MANDATE */}
      <section className="py-20 md:py-28 bg-royal relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212,175,55,0.5) 1px, transparent 0)`, backgroundSize: "40px 40px" }} />

        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-5xl mx-auto">
            <motion.div variants={fadeInUp} custom={0} className="text-center mb-16">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">The Commission</span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4">Prophetic Mandate</h2>
              <div className="section-divider w-24 mx-auto" />
            </motion.div>

            <motion.div variants={fadeInUp} custom={1} className="text-center mb-16">
              <blockquote className="relative bg-royal-dark/50 backdrop-blur border border-gold/20 rounded-2xl px-8 py-10 md:px-16 md:py-12 max-w-3xl mx-auto">
                <span className="text-gold text-5xl font-serif leading-none absolute -top-2 left-6 opacity-30">&ldquo;</span>
                <p className="text-xl md:text-2xl lg:text-3xl font-[var(--font-playfair)] text-white leading-relaxed">
                  Preparing the Church for the <span className="text-gradient-gold font-bold">Second Coming</span> of the Lord Jesus Christ.
                </p>
                <span className="text-gold text-5xl font-serif leading-none absolute -bottom-6 right-6 opacity-30">&rdquo;</span>
              </blockquote>
            </motion.div>

            <motion.div variants={fadeInUp} custom={2} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: BookOpen, title: "Revealing Biblical Truths", description: "Uncovering the deep mysteries of Scripture and presenting them with clarity and power." },
                { icon: Eye, title: "Teaching the Mind of Christ", description: "Imparting the mind and heart of Christ to believers through anointed teaching of the Word." },
                { icon: Users, title: "Raising Servants of God", description: "Grooming and equipping servants of God toward fulfilling the divine mandate upon their lives." },
                { icon: Heart, title: "Spiritual Preparation", description: "Preparing believers spiritually for the return of the Lord Jesus Christ." },
              ].map(({ icon: Icon, title, description }) => (
                <Card key={title} className="bg-royal-dark/50 border-gold/20 hover:border-gold/40 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <Icon className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2 font-[var(--font-playfair)]">{title}</h3>
                    <p className="text-sm text-primary-foreground/60 leading-relaxed">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MINISTRY LEADERSHIP */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} custom={0} className="text-center mb-16">
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">Leadership</span>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mt-3 mb-4">Ministry Leadership</h2>
              <div className="section-divider w-24 mx-auto" />
            </motion.div>

            <motion.div variants={fadeInUp} custom={1}>
              <Card className="overflow-hidden border-gold/10 shadow-xl">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-1/3 h-64 md:h-auto bg-gradient-to-br from-royal to-royal-dark flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                      <Image src="/images/Ministeybanner.jpg" alt="" fill className="object-cover" />
                    </div>
                    <div className="relative z-10 text-center p-6">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gold/60 mb-4">
                        <Image src="/images/Ministrylogo.jpg" alt="Ministry Emblem" fill className="object-cover" />
                      </div>
                      <h3 className="text-white font-bold text-lg font-[var(--font-playfair)]">Eagles Prophetic</h3>
                      <p className="text-gold text-sm">Ministries</p>
                    </div>
                  </div>
                  <CardContent className="flex-1 p-8 md:p-10">
                    <Badge className="bg-gold/10 text-gold border-gold/30 hover:bg-gold/20 mb-4">Ministry Leadership</Badge>
                    <h3 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-royal mb-2">Founder &amp; Lead Shepherd</h3>
                    <p className="text-lg text-gold font-[var(--font-playfair)] mb-6">Eagles Prophetic Ministries</p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Under the visionary leadership of Prophet Gabriel Christ Alorgo, Eagles Prophetic Ministries operates as a prophetic move of the endtime hosts of God — dedicated to raising a generation of believers who are spiritually prepared, biblically grounded, and prophetically awakened.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {["Prophetic Ministry", "Teaching Ministry", "Endtime Preparation", "Spiritual Warfare"].map((tag) => (
                        <Badge key={tag} variant="outline" className="border-royal/20 text-royal text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}