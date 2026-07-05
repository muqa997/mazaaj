"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
  const t = useTranslations("nav");
  const [isOpen, setIsOpen] = useState(false);
  const { count, openDrawer } = useCart();

  const links = [
    { href: "/", label: t("home") },
    { href: "/#about", label: t("about") },
    { href: "/menu", label: t("menu") },
    { href: "/#game-lounge", label: t("gameLounge") },
    { href: "/#delivery", label: t("delivery") },
    { href: "/#contact", label: t("contact") },
  ];

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 pt-safe backdrop-blur-xl bg-background/70 border-b border-primary/10"
    >
      <div className="flex items-center justify-between px-5 py-3 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-glass shrink-0">
            <Image
              src="/logo.png"
              alt="mazaaj"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[15px] text-primary">كافيه مزاج</span>
            <span className="text-[10px] text-primary/45 tracking-[0.2em]">mazaaj</span>
          </div>
        </Link>

        {/* روابط سطح المكتب */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-primary/70 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="cart"
            onClick={openDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 active:scale-90 transition-transform"
          >
            <ShoppingBag size={18} className="text-primary/70" strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="menu"
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 active:scale-90 transition-transform md:hidden"
          >
            {isOpen ? (
              <X size={18} className="text-primary/70" strokeWidth={1.8} />
            ) : (
              <MenuIcon size={18} className="text-primary/70" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {/* قائمة الجوال المنسدلة */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-primary/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-primary/80 transition-colors active:bg-primary/5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between px-3 pt-2">
                <LanguageSwitcher />
                <DarkModeToggle />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
