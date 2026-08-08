"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Youtube, Facebook } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PAGE_PATHS, type PageView } from "@/lib/store";

const footerNav: { label: string; view: PageView }[] = [
  { label: "Home", view: "home" },
  { label: "About Us", view: "about" },
  { label: "The Prophet", view: "prophet" },
  { label: "Teachings", view: "teachings" },
  { label: "Book Store", view: "bookstore" },
  { label: "Media", view: "media" },
  { label: "Events", view: "events" },
  { label: "Support", view: "support" },
  { label: "Contact", view: "contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-royal text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Ministry Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold font-[var(--font-playfair)] text-gold">
              Eagles Prophetic Ministries
            </h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              A prophetic move of the endtime hosts of God. Preparing the Church
              for the Second Coming of the Lord Jesus Christ.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-8 h-[1px] bg-gold/50" />
              <span className="text-xs text-gold tracking-widest uppercase">Prophetic Voice</span>
              <span className="inline-block w-8 h-[1px] bg-gold/50" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold font-[var(--font-playfair)] text-gold">Quick Links</h3>
            <nav className="grid grid-cols-2 gap-1">
              {footerNav.map((item) => (
                <Link
                  key={item.view}
                  href={PAGE_PATHS[item.view]}
                  className={item.view === "support"
                    ? "text-gold hover:text-gold-light text-sm inline-flex items-center"
                    : "text-primary-foreground/70 hover:text-gold text-sm inline-flex items-center"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold font-[var(--font-playfair)] text-gold">Reach Us</h3>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+233257870755"
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>+233 257 870 755</span>
              </a>
              <a
                href="mailto:eaglespropheticministries@gmail.com"
                className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="break-all">eaglespropheticministries@gmail.com</span>
              </a>
            </div>

            {/* Social Media Links */}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-xs text-primary-foreground/50 uppercase tracking-widest">Follow Us</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/60 hover:text-gold hover:bg-gold/10" asChild>
                  <a href="https://www.youtube.com/@EaglesPropheticMinistries" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/60 hover:text-gold hover:bg-gold/10" asChild>
                  <a href="https://www.facebook.com/Eaglespropheticministries/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/60 hover:text-gold hover:bg-gold/10" asChild>
                  <a href="https://www.tiktok.com/@eaglespropheticministrie" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.28 6.28 0 001.86-4.48V8.69a8.22 8.22 0 004.86 1.57V6.79a4.84 4.84 0 01-1.14-.1z"/></svg>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Eagles Prophetic Ministries. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/40 italic">
            &ldquo;Preparing the Church for the Second Coming&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}
