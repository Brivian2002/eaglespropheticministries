"use client";

import { useState, useRef, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ExternalLink,
  Facebook,
  Youtube,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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

type FormStatus = "idle" | "sending" | "success" | "error";

export function ContactSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const { toast } = useToast();

  const handleWhatsApp = (number: string) => {
    window.open(
      `https://wa.me/${number.replace(/\s/g, "")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      // EmailJS not configured — show WhatsApp fallback
      const msg = encodeURIComponent(
        `Hello Eagles Prophetic Ministries,\n\nI'm reaching out from the website.\n\nSubject: (please specify)\n\nMessage: (please type your message here)`
      );
      window.open(`https://wa.me/233257870755?text=${msg}`, "_blank", "noopener,noreferrer");
      toast({
        title: "Redirecting to WhatsApp",
        description: "The contact form is being set up. Please send your message via WhatsApp for now.",
      });
      return;
    }

    try {
      const result = await emailjs.sendForm(serviceId, templateId, formRef.current!, publicKey);
      console.log("EmailJS success:", result);
      setStatus("success");
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We will get back to you soon.",
      });
      formRef.current?.reset();
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: unknown) {
      console.error("EmailJS error:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setStatus("error");
      toast({
        title: "Failed to Send",
        description: errorMsg.includes("template")
          ? "Email template issue. Check your EmailJS template uses: first_name, last_name, user_email, phone, subject, message"
          : "Could not connect to EmailJS. Please try again or use WhatsApp.",
        variant: "destructive",
      });
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/Ministeybanner.jpg" alt="" fill className="object-cover" />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Get In Touch
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp} custom={1}
              className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4"
            >
              Contact Us
            </motion.h1>
            <motion.p
              variants={fadeInUp} custom={2}
              className="text-white/70 text-lg max-w-xl mx-auto"
            >
              We&apos;d love to hear from you. Send us a message or reach us directly.
            </motion.p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* CONTACT FORM + QUICK CONTACTS */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* ── Left: Contact Form ── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="lg:col-span-3"
            >
              <motion.div variants={fadeInUp} custom={0}>
                <Card className="border-gold/10 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-[var(--font-playfair)] text-royal flex items-center gap-2">
                      <Send className="h-5 w-5 text-gold" />
                      Send a Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                      {/* Name Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-foreground">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            placeholder="Your first name"
                            required
                            disabled={status === "sending"}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-foreground">
                            Last Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            placeholder="Your last name"
                            required
                            disabled={status === "sending"}
                            className="h-11"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="user_email" className="text-foreground">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="user_email"
                          name="user_email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          disabled={status === "sending"}
                          className="h-11"
                        />
                      </div>

                      {/* Phone (optional) */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">
                          Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+233 XX XXX XXXX"
                          disabled={status === "sending"}
                          className="h-11"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-foreground">
                          Subject <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="What is this about?"
                          required
                          disabled={status === "sending"}
                          className="h-11"
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-foreground">
                          Message <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Type your message here..."
                          required
                          rows={5}
                          disabled={status === "sending"}
                          className="resize-y min-h-[120px]"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={status === "sending" || status === "success"}
                        className={
                          "w-full h-12 text-base font-semibold transition-all duration-300 " +
                          (status === "success"
                            ? "bg-green-600 hover:bg-green-600 text-white"
                            : "bg-royal hover:bg-royal-dark text-white")
                        }
                      >
                        {status === "idle" && (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                        {status === "sending" && (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        )}
                        {status === "success" && (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Message Sent!
                          </>
                        )}
                        {status === "error" && (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Try Again
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* ── Right: Quick Contact Cards ── */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="lg:col-span-2 space-y-5"
            >
              {/* Email Card */}
              <motion.div variants={fadeInUp} custom={0}>
                <Card className="border-gold/10 hover:border-royal/30 transition-all duration-300 group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-royal/10 flex items-center justify-center flex-shrink-0 group-hover:bg-royal/20 transition-colors">
                      <Mail className="h-5 w-5 text-royal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground mb-0.5">
                        Email
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        eaglespropheticministries@gmail.com
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 text-royal hover:bg-royal hover:text-white"
                      asChild
                    >
                      <a href="mailto:eaglespropheticministries@gmail.com" aria-label="Send email">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* WhatsApp Card 1 */}
              <motion.div variants={fadeInUp} custom={1}>
                <Card className="border-gold/10 hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleWhatsApp("+233257870755")}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground mb-0.5">
                        WhatsApp
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        +233 257 870 755
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
                  </CardContent>
                </Card>
              </motion.div>

              {/* WhatsApp Card 2 */}
              <motion.div variants={fadeInUp} custom={2}>
                <Card className="border-gold/10 hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleWhatsApp("+233542061290")}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground mb-0.5">
                        WhatsApp (Alt)
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        +233 542 061 290
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Facebook Card */}
              <motion.div variants={fadeInUp} custom={3}>
                <Card className="border-gold/10 hover:border-blue-500/30 transition-all duration-300 group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground mb-0.5">
                        Facebook
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Message us anytime
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8 text-blue-600 hover:bg-blue-600 hover:text-white"
                      asChild
                    >
                      <a
                        href="https://www.facebook.com/Eaglespropheticministries/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Location Card */}
              <motion.div variants={fadeInUp} custom={4}>
                <Card className="border-gold/10">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground mb-0.5">
                        Location
                      </h3>
                      <p className="text-xs text-muted-foreground">Ghana, West Africa</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        <span>Ghana Time (GMT)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL MEDIA */}
      <section className="py-16 md:py-20 border-t border-gold/10">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="text-sm text-muted-foreground mb-6 font-[var(--font-playfair)]">
            Follow Us on Social Media
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-red-600 hover:text-white"
              asChild
            >
              <a href="https://www.youtube.com/@EaglesPropheticMinistries" target="blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-blue-600 hover:text-white"
              asChild
            >
              <a href="https://www.facebook.com/Eaglespropheticministries/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hover:bg-gray-900 hover:text-white"
              asChild
            >
              <a href="https://www.tiktok.com/@eaglespropheticministrie" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.28 6.28 0 001.86-4.48V8.69a8.22 8.22 0 004.86 1.57V6.79a4.84 4.84 0 01-1.14-.1z"/></svg>
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
