import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose md:text-left">
            Gebouwd met ❤️ voor een efficiënter huishouden.{" "}
            <Link
              href="/privacy"
              className="font-medium underline underline-offset-4"
            >
              Privacy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/yourusername/projectname"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium underline underline-offset-4"
          >
            GitHub
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium underline underline-offset-4"
          >
            Documentatie
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium underline underline-offset-4"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}