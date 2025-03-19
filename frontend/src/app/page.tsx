import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Layout } from "@/components/layout/layout"

export default function HomePage() {
  return (
    <Layout>
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
            Huishoudelijk Takenbeheersysteem
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Beheer huishoudelijke taken efficiënt met gamification en Discord-integratie.
            Maak samenwerken leuker en productiever.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/register">Begin Nu</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo">Bekijk Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <div className="space-y-2">
                <h3 className="font-bold">Taakbeheer</h3>
                <p className="text-sm text-muted-foreground">
                  Organiseer en beheer taken met categorieën en prioriteiten
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <div className="space-y-2">
                <h3 className="font-bold">Discord Integratie</h3>
                <p className="text-sm text-muted-foreground">
                  Ontvang meldingen en interacteer via Discord
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
              <div className="space-y-2">
                <h3 className="font-bold">Gamification</h3>
                <p className="text-sm text-muted-foreground">
                  Verdien punten en badges voor voltooide taken
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
