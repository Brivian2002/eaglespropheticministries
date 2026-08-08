"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Church,
  BookOpen,
  GraduationCap,
  Library,
  Film,
  CalendarDays,
  Phone,
  Home,
  User,
  Heart,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigationStore, type PageView, PAGE_PATHS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems: { label: string; view: PageView; icon?: React.ReactNode }[] = [
  { label: "Home", view: "home", icon: <Home className="h-4 w-4" /> },
  { label: "About Us", view: "about", icon: <Church className="h-4 w-4" /> },
  { label: "The Prophet", view: "prophet", icon: <User className="h-4 w-4" /> },
  { label: "Teachings", view: "teachings", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "Book Store", view: "bookstore", icon: <Library className="h-4 w-4" /> },
  { label: "Media", view: "media", icon: <Film className="h-4 w-4" /> },
  { label: "Events", view: "events", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Support", view: "support", icon: <Heart className="h-4 w-4" /> },
  { label: "Contact", view: "contact", icon: <Phone className="h-4 w-4" /> },
];

export function Header() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useNavigationStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled
          ? "bg-background/98 backdrop-blur-lg shadow-md border-gold/20"
          : "bg-background/80 backdrop-blur-md border-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-gold/60 shadow-gold group-hover:shadow-gold/50 transition-shadow">
            <Image
              src="/images/Ministrylogo.jpg"
              alt="Eagles Prophetic Ministries Logo"
              sizes="40px"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold tracking-wide text-royal font-[var(--font-playfair)] leading-tight">
              Eagles Prophetic
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Ministries
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center">
          {navItems.map((item) => {
            const href = PAGE_PATHS[item.view];
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={item.view}
                href={href}
                className={cn(
                  "relative px-2.5 xl:px-3 py-2 text-[11px] xl:text-xs font-medium transition-all duration-300 rounded-md whitespace-nowrap",
                  isActive
                    ? "text-royal bg-royal/5"
                    : "text-muted-foreground hover:text-royal hover:bg-royal/5",
                  item.view === "support" && "text-gold hover:text-gold-dark hover:bg-gold/5"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-gold to-royal rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle + Mobile Menu Button */}
        <div className="flex items-center gap-2">
          <div className="hidden xl:block">
            <ThemeToggle />
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="text-royal">
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 bg-background border-gold/20 p-0"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-5 border-b border-gold/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/40">
                      <Image src="/images/Ministrylogo.jpg" alt="Logo" width={32} height={32} className="object-cover" />
                    </div>
                    <span className="text-sm font-bold text-royal font-[var(--font-playfair)]">EPM</span>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-3">
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => {
                      const href = PAGE_PATHS[item.view];
                      const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                      return (
                        <Link
                          key={item.view}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors rounded-lg",
                            isActive
                              ? "text-royal bg-royal/5 border-l-4 border-gold"
                              : item.view === "support"
                              ? "text-gold hover:text-gold-dark hover:bg-gold/5"
                              : "text-muted-foreground hover:text-royal hover:bg-royal/5"
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
                <div className="border-t border-gold/20 p-4 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                    Preparing the Church for the Second Coming
                  </p>
                  <ThemeToggle className="!w-8 !h-8" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
