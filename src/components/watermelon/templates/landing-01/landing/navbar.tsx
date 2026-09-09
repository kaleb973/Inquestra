"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { GithubIcon, NewTwitterIcon, Menu01Icon, Cancel01Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled 
          ? "bg-background/80 backdrop-blur-md border-border/50 shadow-sm py-3" 
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
             <Activity className="w-full h-full text-emerald-400" />
          </div>
          <span className="font-mono font-bold text-sm tracking-widest uppercase">Inquestra</span>
        </Link>



        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/app/login" className="flex items-center h-10 bg-transparent text-white/70 font-mono font-bold tracking-widest uppercase px-6 text-xs hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/app/signup" className="flex items-center h-10 bg-primary text-background font-mono font-bold tracking-widest uppercase px-6 text-xs hover:bg-primary/90 transition-colors active:scale-[0.96]">
            Sign up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            className="text-foreground p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <Cancel01Icon className="w-6 h-6" /> : <Menu01Icon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border/50 shadow-lg p-4 flex flex-col gap-4 animate-fade-in-up">
          <Link href="/app/login" className="w-full text-center bg-transparent text-foreground font-mono font-bold tracking-widest uppercase px-4 py-4 text-xs transition-colors mt-2">
            Log in
          </Link>
          <Link href="/app/signup" className="w-full text-center bg-primary text-background font-mono font-bold tracking-widest uppercase px-4 py-4 text-xs hover:bg-primary/90 transition-colors active:scale-[0.96] mt-2">
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
