import "fastify"

import type { FastifyReply } from "fastify"

import type { users } from "@repo/db/schema"

declare module "fastify" {
  interface FastifyRequest {
    user: typeof users.$inferSelect | null
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<unknown>
  }
}
