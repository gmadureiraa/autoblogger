"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { LogIn, LogOut, Settings as SettingsIcon } from "lucide-react"
import { useAuth, useClerk, useUser } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const [articleCount, setArticleCount] = useState(0)
  const { user } = useUser()
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()
  const pathname = usePathname() ?? "/"

  // Decide se o link da nav esta ativo. Hash links (#features, #pricing) ativam
  // apenas na home. Demais links matcheam por prefixo (ex: /artigos/abc → /artigos).
  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/"
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false

    // Logado: consulta a API (Neon). Anonimo: le do localStorage.
    if (isSignedIn) {
      ;(async () => {
        try {
          const res = await fetch("/api/posts", { cache: "no-store" })
          if (!res.ok || cancelled) return
          const data = await res.json()
          if (Array.isArray(data?.posts)) setArticleCount(data.posts.length)
        } catch {}
      })()
    } else {
      try {
        const v2 = localStorage.getItem("autoblogger_posts_v2")
        if (v2) {
          const articles = JSON.parse(v2)
          setArticleCount(Array.isArray(articles) ? articles.length : 0)
          return
        }
        const saved = localStorage.getItem("autoblogger_articles")
        if (saved) {
          const articles = JSON.parse(saved)
          setArticleCount(Array.isArray(articles) ? articles.length : 0)
        }
      } catch {}
    }

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 pt-4 lg:px-6 lg:pt-6"
    >
      <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 bg-[#10b981] flex items-center justify-center">
              <span className="text-background font-mono font-bold text-sm">A</span>
            </div>
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
              AutoBlogger
            </span>
          </motion.a>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Gerar", href: "/gerar" },
              {
                label: `Artigos${articleCount > 0 ? ` (${articleCount})` : ""}`,
                href: "/artigos",
              },
              ...(isSignedIn
                ? [{ label: "Integrations", href: "/integrations/wordpress" }]
                : []),
            ].map((link, i) => {
              const active = isActive(link.href)
              return (
                <motion.a
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`text-xs font-mono tracking-widest uppercase transition-colors duration-200 relative ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#10b981]"
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </motion.a>
              )
            })}
          </div>

          {/* Right side */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <ThemeToggle />

            {isLoaded && isSignedIn && (
              <>
                <a
                  href="/settings"
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                  title="Settings"
                >
                  <SettingsIcon size={12} />
                  <span className="hidden lg:inline">
                    {user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "conta"}
                  </span>
                </a>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
                  title="Sair"
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}

            {isLoaded && !isSignedIn && (
              <>
                <motion.a
                  href="/sign-in"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="hidden sm:inline-flex items-center gap-1.5 border border-foreground/30 px-3 py-2 text-[10px] font-mono tracking-widest uppercase hover:border-foreground transition-colors"
                >
                  <LogIn size={12} />
                  Entrar
                </motion.a>
                <motion.a
                  href="/sign-up"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#10b981] text-background px-4 py-2 text-xs font-mono tracking-widest uppercase"
                >
                  Comecar agora
                </motion.a>
              </>
            )}
          </motion.div>
        </div>
      </nav>
    </motion.div>
  )
}
