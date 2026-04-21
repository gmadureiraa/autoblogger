"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, Mail, Lock, User, Chrome, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const ease = [0.22, 1, 0.36, 1] as const

function LoginPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const initialMode = params.get("mode") === "signup" ? "signup" : "login"
  const redirectTo = params.get("next") || "/gerar"

  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    supabaseConfigured,
  } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!email || !password) {
      setError("Preenche email e senha")
      return
    }
    setLoading(true)
    try {
      if (mode === "login") {
        const { error: err } = await signInWithPassword(email, password)
        if (err) setError(err)
        else router.push(redirectTo)
      } else {
        const { error: err, needsConfirmation } = await signUpWithPassword(
          email,
          password,
          name.trim() || undefined
        )
        if (err) setError(err)
        else if (needsConfirmation) {
          setMessage(
            "Conta criada. Confirma pelo email antes de logar (se email confirmation estiver ligado)."
          )
        } else {
          router.push(redirectTo)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError("")
    setLoading(true)
    const { error: err } = await signInWithGoogle()
    if (err) {
      setError(err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
                AutoBlogger
              </span>
            </a>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </span>
          </div>
        </nav>
      </div>

      <main className="w-full px-6 py-12 lg:px-12 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
              {mode === "login" ? "// AUTOBLOGGER: LOGIN" : "// AUTOBLOGGER: SIGNUP"}
            </span>
            <div className="flex-1 border-t border-border" />
            <span className="inline-block h-2 w-2 bg-[#10b981] animate-blink" />
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl tracking-tight text-foreground mb-3">
            {mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            {mode === "login"
              ? "Acessa seus artigos salvos e continue produzindo."
              : "Comece de graca. 5 artigos por mes, sem cartao."}
          </p>
        </motion.div>

        {!supabaseConfigured && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#eab308] bg-[#eab308]/10 px-5 py-4 mb-6 flex items-start gap-3"
          >
            <AlertTriangle size={14} className="text-[#eab308] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-mono text-foreground font-bold mb-1">
                Auth nao configurado
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                Plugue NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no
                Vercel. Enquanto isso voce pode usar o app sem login — os artigos ficam
                salvos no navegador.
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-0 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 px-5 py-3 text-xs font-mono tracking-widest uppercase border-2 border-foreground transition-colors ${
              mode === "login"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 px-5 py-3 text-xs font-mono tracking-widest uppercase border-2 border-foreground -ml-[2px] transition-colors ${
              mode === "signup"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar conta
          </button>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="border-2 border-foreground"
        >
          <div className="p-5 flex flex-col gap-4">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                  NOME
                </label>
                <div className="flex items-stretch border-2 border-foreground focus-within:border-[#10b981] transition-colors">
                  <span className="flex items-center justify-center w-10 bg-foreground text-background">
                    <User size={12} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="flex-1 bg-transparent px-3 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                EMAIL
              </label>
              <div className="flex items-stretch border-2 border-foreground focus-within:border-[#10b981] transition-colors">
                <span className="flex items-center justify-center w-10 bg-foreground text-background">
                  <Mail size={12} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 bg-transparent px-3 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mb-2 block">
                SENHA
              </label>
              <div className="flex items-stretch border-2 border-foreground focus-within:border-[#10b981] transition-colors">
                <span className="flex items-center justify-center w-10 bg-foreground text-background">
                  <Lock size={12} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "minimo 6 caracteres" : "••••••"}
                  className="flex-1 bg-transparent px-3 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-destructive bg-destructive/10 px-3 py-2"
                >
                  <span className="text-[11px] font-mono text-destructive">{error}</span>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-2 border-[#10b981] bg-[#10b981]/10 px-3 py-2"
                >
                  <span className="text-[11px] font-mono text-[#10b981]">{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || !supabaseConfigured}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className={`group flex items-center justify-center gap-0 text-sm font-mono tracking-wider uppercase ${
                loading || !supabaseConfigured
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-foreground text-background cursor-pointer"
              }`}
            >
              <span className="flex items-center justify-center w-10 h-10 bg-[#10b981]">
                <ArrowRight size={16} strokeWidth={2} className="text-background" />
              </span>
              <span className="flex-1 py-2.5">
                {loading
                  ? "Carregando..."
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </span>
            </motion.button>

            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 border-t border-foreground/20" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                ou
              </span>
              <div className="flex-1 border-t border-foreground/20" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || !supabaseConfigured}
              className={`flex items-center justify-center gap-2 border-2 border-foreground py-3 text-xs font-mono tracking-widest uppercase transition-colors ${
                loading || !supabaseConfigured
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <Chrome size={12} />
              Continuar com Google
            </button>
          </div>
        </motion.form>

        <p className="text-[11px] font-mono text-muted-foreground text-center mt-6">
          {mode === "login" ? (
            <>
              Nao tem conta?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-[#10b981] hover:underline"
              >
                Crie uma gratis
              </button>
            </>
          ) : (
            <>
              Ja tem conta?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-[#10b981] hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen dot-grid-bg flex items-center justify-center">
          <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            Carregando...
          </span>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  )
}
