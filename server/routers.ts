import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createTreasure, deleteTreasure, getStats, getStatusHistory, getTreasure, listTreasures, updateTreasure } from "./db";
import { z } from "zod";

const statusSchema = z.enum(["Found", "Lost", "Stolen"]);
const treasureFields = z.object({
  name: z.string().trim().min(2).max(100),
  islandName: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  value: z.number().int().min(0).max(1000000000),
  terrain: z.string().trim().min(2).max(50),
  burialDepth: z.number().min(0).max(10000),
  status: statusSchema,
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  treasures: router({
    list: publicProcedure.query(() => listTreasures()),
    get: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getTreasure(input.id)),
    history: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getStatusHistory(input.id)),
    stats: publicProcedure.query(() => getStats()),
    create: publicProcedure.input(treasureFields).mutation(({ input }) => createTreasure(input)),
    update: publicProcedure.input(treasureFields.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const current = await getTreasure(input.id);
      if (!current) throw new Error("Treasure not found");
      const { id, ...payload } = input;
      return updateTreasure(id, payload, current.status !== payload.status);
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await deleteTreasure(input.id);
      return { success: true } as const;
    }),
    exportCsv: publicProcedure.query(async () => {
      const rows = await listTreasures();
      const header = "Name,Island,Value,Depth (m),Terrain,Status,Latitude,Longitude,Last Updated";
      const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      return [header, ...rows.map((row) => [row.name, row.islandName, row.value, row.burialDepth, row.terrain, row.status, row.latitude, row.longitude, row.updatedAt.toISOString()].map(escape).join(","))].join("\n");
    }),
  }),
});

export type AppRouter = typeof appRouter;
