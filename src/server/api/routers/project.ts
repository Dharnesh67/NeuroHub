import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
export const projectRouter = createTRPCRouter({
    create: publicProcedure.input(z.object({
        name: z.string(),
        githubUrl: z.string(),
    })).mutation(async ({ ctx, input }) => {
        return ctx.db.project.create({
            data: input,
        })
    })
})