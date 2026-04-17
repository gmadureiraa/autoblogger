"use client"

import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="w-full border-t-2 border-foreground"
    >
      {/* Footer CTA */}
      <div className="px-6 py-10 lg:px-12 flex flex-col items-center gap-4 border-b-2 border-foreground">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          PRONTO PARA COMECAR?
        </span>
        <motion.a
          href="/signup"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-0 bg-foreground text-background text-sm font-mono tracking-wider uppercase cursor-pointer"
        >
          <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
            <ArrowRight size={16} strokeWidth={2} className="text-background" />
          </span>
          <span className="px-5 py-2.5">Criar meu blog agora</span>
        </motion.a>
      </div>

      {/* Footer links */}
      <div className="px-6 py-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
              AutoBlogger
            </span>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
              por Kaleidos | 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Gerar Artigo", href: "/gerar" },
              { label: "Meus Artigos", href: "/artigos" },
              { label: "Pricing", href: "#pricing" },
              { label: "Signup", href: "/signup" },
              { label: "Kaleidos", href: "https://kaleidos.cc" },
            ].map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease }}
                className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
