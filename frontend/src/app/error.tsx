"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log de error naar een error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Oeps! Er is iets misgegaan</h1>
          <p className="text-muted-foreground">
            {error.message || "Er is een onverwachte fout opgetreden."}
          </p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={() => reset()}>Opnieuw proberen</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Terug naar home
          </Button>
        </div>
      </div>
    </div>
  )
}