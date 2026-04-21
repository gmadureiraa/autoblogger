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
              carregando artigo...
            </span>
          </div>
        </nav>
      </div>

      <div className="px-4 lg:px-6 py-12 max-w-4xl mx-auto">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-3 w-20 bg-foreground/10" />
          <div className="h-10 w-3/4 bg-foreground/15" />
          <div className="h-3 w-1/3 bg-foreground/10" />

          <div className="border border-foreground/20 bg-background/40 p-6 flex flex-col gap-4 mt-4">
            <div className="h-4 w-full bg-foreground/10" />
            <div className="h-4 w-11/12 bg-foreground/10" />
            <div className="h-4 w-10/12 bg-foreground/10" />
            <div className="h-4 w-full bg-foreground/10" />
            <div className="h-4 w-9/12 bg-foreground/10" />
            <div className="h-4 w-11/12 bg-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
