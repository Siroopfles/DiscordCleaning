import { Header } from "./header"
import { Footer } from "./footer"

interface LayoutProps {
  children: React.ReactNode
  /**
   * Whether to show the header
   * @default true
   */
  showHeader?: boolean
  /**
   * Whether to show the footer
   * @default true
   */
  showFooter?: boolean
  /**
   * Additional CSS classes for the main content area
   */
  className?: string
}

export function Layout({
  children,
  showHeader = true,
  showFooter = true,
  className = "",
}: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className={`flex-1 container py-6 ${className}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

export { Header } from "./header"
export { Footer } from "./footer"