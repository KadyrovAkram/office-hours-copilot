import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { queueState } from "@/db/schema";
import { seedState, type QueueState } from "@/lib/triage-data";

const STATE_ID = 1;
let demoState: QueueState;
let demoUpdatedAt = new Date().toISOString();

function normalizeSeedTimes(state: QueueState) {
  const newest = state.questions[0]?.submittedAt;
  if (!newest || Date.now() - new Date(newest).getTime() < 24 * 60 * 60 * 1000) return state;
  return {
    ...state,
    questions: state.questions.map((question, index) => ({
      ...question,
      submittedAt: new Date(Date.now() - (index + 2) * 78000).toISOString(),
    })),
  };
}

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(queueState).where(eq(queueState.id, STATE_ID));
    if (row) {
      const parsed = JSON.parse(row.payload) as QueueState;
      const state = normalizeSeedTimes(parsed);
      if (state !== parsed) {
        const updatedAt = new Date().toISOString();
        await db.update(queueState).set({ payload: JSON.stringify(state), updatedAt }).where(eq(queueState.id, STATE_ID));
        return Response.json({ state, updatedAt });
      }
      return Response.json({ state, updatedAt: row.updatedAt });
    }

    const now = new Date().toISOString();
    const state = normalizeSeedTimes(seedState);
    await db.insert(queueState).values({ id: STATE_ID, payload: JSON.stringify(state), revision: 1, updatedAt: now });
    return Response.json({ state, updatedAt: now });
  } catch {
    demoState ??= normalizeSeedTimes(seedState);
    return Response.json({ state: demoState, updatedAt: demoUpdatedAt, demo: true });
  }
}

export async function PUT(request: Request) {
  let next: QueueState;
  try {
    next = (await request.json()) as QueueState;
  } catch {
    return Response.json({ error: "Invalid queue state" }, { status: 400 });
  }
  if (!Array.isArray(next.questions) || !Array.isArray(next.clusters)) {
    return Response.json({ error: "Invalid queue state" }, { status: 400 });
  }

  try {
    const db = getDb();
    const updatedAt = new Date().toISOString();
    await db.insert(queueState).values({ id: STATE_ID, payload: JSON.stringify(next), revision: next.revision, updatedAt })
      .onConflictDoUpdate({ target: queueState.id, set: { payload: JSON.stringify(next), revision: next.revision, updatedAt } });
    return Response.json({ state: next, updatedAt });
  } catch {
    demoState = next;
    demoUpdatedAt = new Date().toISOString();
    return Response.json({ state: demoState, updatedAt: demoUpdatedAt, demo: true });
  }
}
