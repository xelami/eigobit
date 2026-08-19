import type { FastifyPluginAsync } from "fastify"

import { getAuthenticatedUser } from "../authenticated-user.js"

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest("user", null)

  app.decorate("authenticate", async (request, reply) => {
    request.user = await getAuthenticatedUser(request)

    if (!request.user) {
      return reply.code(401).send({
        error: "Unauthorized",
      })
    }
  })
}

export default authPlugin
