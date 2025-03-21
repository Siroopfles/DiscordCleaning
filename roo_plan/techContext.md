# Tech Context: Huishoudelijk Takenbeheersysteem

---

## Tech Stack

### Frontend
- Next.js voor het webdashboard
- TypeScript voor type-veiligheid
- React voor UI componenten
- CSS Modules voor styling
- Tailwind CSS voor utility-first styling
- Tailwind CSS Animate voor basis animaties
- Custom animation hooks voor interacties
- Framer Motion voor geavanceerde animaties

### Backend
- Express.js server framework
- TypeScript voor type-veiligheid
- Node.js runtime

### Database & Caching
- MongoDB voor primaire dataopslag
- Redis voor caching
- RabbitMQ voor message queuing

### Discord Integratie
- @newboom/discord package voor Discord functionaliteit
  * Discord.js v14.18.0 voor bot-ontwikkeling
  * Geïsoleerde Discord service architectuur
  * Type-safe integratie met backend
  * Command systeem met permissie beheer
  * Currency management met rate limiting
  * Real-time monitoring en statistieken
  * Transactie logging en auditing

### Testing & QA
- Jest voor unit tests
- Cypress voor E2E tests
- ESLint + Prettier voor code quality

### DevOps
- Docker voor containerization
- CI/CD pipelines
- Prometheus voor monitoring
- Winston/Bunyan voor logging

## Technische Vereisten

### Performance
- Webdashboard laadtijd < 2 seconden
- Notificatie levering < 5 seconden
- API response tijd < 200ms

### Schaalbaarheid
- Ondersteuning voor 100+ Discord servers
- Horizontaal schaalbare services
- Load balancing capability

### Beveiliging
- HTTPS/TLS encryptie
- JWT authenticatie
- OAuth2 voor externe integraties
- Rate limiting implementatie

### Compatibiliteit
- Modern browsers (laatste 2 versies)
- Mobile-responsive design
- Cross-platform Discord support