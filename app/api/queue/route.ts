import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { queueState } from "@/db/schema";
import { seedState, type QueueState } from "@/lib/triage-data";

const STATE_ID = 1;

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(queueState).where(eq(queueState.id, STATE_ID));
    if (row) return Response.json({ state: JSON.parse(row.payload), updatedAt: row.updatedAt });

    const now = new Date().toISOString();
    await db.insert(queueState).values({ id: STATE_ID, payload: JSON.stringify(seedState), revision: 1, updatedAt: now });
    return Response.json({ state: seedState, updatedAt: now });
  } catch {
    return Response.json({ state: seedState, demo: true });
  }
}

export async function PUT(request: Request) {
  try {
    const next = (await request.json()) as QueueState;
    if (!Array.isArray(next.questions) || !Array.isArray(next.clusters)) {
      return Response.json({ error: "Invalid queue state" }, { status: 400 });
    }
    const db = getDb();
    const updatedAt = new Date().toISOString();
    await db.insert(queueState).values({ id: STATE_ID, payload: JSON.stringify(next), revision: next.revision, updatedAt })
      .onConflictDoUpdate({ target: queueState.id, set: { payload: JSON.stringify(next), revision: next.revision, updatedAt } });
    return Response.json({ state: next, updatedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save" }, { status: 500 });
  }
}
