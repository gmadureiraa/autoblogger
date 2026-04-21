export default function Loading() {
  return (
    <div className="min-h-screen dot-grid-bg">
      <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
        <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#10b981] flex items-center justify-center">
                <span className="text-background font-mono font-bold text-xs">A</span>
              </div>
              <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold text-foreground">
                AutoBlogger
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              inicializando gerador...
            </span>
          </div>
        </nav>
      </div>

      <div className="px-4 lg:px-6 py-12 max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="h-3 w-32 bg-foreground/10 mb-4 animate-pulse" />
          <div className="h-10 w-96 max-w-full bg-foreground/15 animate-pulse" />
          <div className="h-3 w-2/3 bg-foreground/10 mt-4 animate-pulse" />
        </div>

        <div className="border border-foreground/20 bg-background/40 p-6 flex flex-col gap-5 animate-pulse">
          <div className="flex gap-2">
            <div className="h-7 w-24 bg-foreground/15" />
            <div className="h-7 w-24 bg-foreground/10" />
          </div>
          <div className="h-24 w-full bg-foreground/10" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 flex-1 bg-foreground/10" />
            ))}
          </div>
          <div className="h-10 w-40 bg-[#10b981]/40" />
        </div>
      </div>
    </div>
  )
}
