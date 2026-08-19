import "dotenv/config"

import Fastify from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"

import authRoutes from "./routes/auth.js"
import oauthRoutes from "./routes/oauth.js"
import oauthLinkRoutes from "./routes/oauth-link.js"
import onboardingRoutes from "./routes/onboarding.js"

import authPlugin from "./plugins/auth.js"
import vocabularyRoutes from "./routes/vocabulary.js"
import practiceRoutes from "./routes/practice.js"
import dashboardRoutes from "./routes/dashboard.js"
import historyRoutes from "./routes/history.js"
import settingsRoutes from "./routes/settings.js"

const app = Fastify({
  logger: true,
})

await app.register(cookie)

await app.register(cors, {
  origin: "http://localhost:4321",
  credentials: true,
})

await app.register(authPlugin)

await app.register(authRoutes, {
  prefix: "/api/v1/auth",
})

await app.register(oauthRoutes, {
  prefix: "/api/v1/auth",
})

app.register(oauthLinkRoutes, {
  prefix: "/api/v1/auth/link",
})

app.register(onboardingRoutes, {
  prefix: "/api/v1/onboarding",
})

await app.register(vocabularyRoutes, {
  prefix: "/api/v1/vocabulary",
})

await app.register(practiceRoutes, {
  prefix: "/api/v1/practice",
})

await app.register(dashboardRoutes, {
  prefix: "/api/v1/dashboard",
})

await app.register(historyRoutes, {
  prefix: "/api/v1/history",
})

await app.register(settingsRoutes, {
  prefix: "/api/v1/settings",
})

app.get("/api/v1/health", async () => {
  return {
    status: "ok",
  }
})

await app.listen({
  port: 3001,
  host: "0.0.0.0",
})
