# Office Hours Copilot

Turn a crowded office-hours queue into a clear teaching plan.

Students submit a short description and an optional code snippet. The copilot groups similar questions, surfaces the misconception behind each cluster, and gives TAs the controls to help several students at once. Instructors get a live view of which concepts need attention.

## The demo

Thirty messy CSE questions collapse into six actionable clusters:

```text
student questions → topic clustering → TA intervention → concept analytics
       30                  6               1:many          live signals
```

Switch among **Student**, **TA**, and **Instructor** in the header to experience the full loop.

## What works

- Student queue submission with an optional code snippet
- Automatic topic classification with a no-key demo fallback
- Six seeded clusters across recursion, JUnit, linked lists, loops, Git, and OOP
- TA merge, split, rename, and resolve controls
- Cluster-level summaries and recommended teaching moves
- Instructor analytics for topic demand, cluster volume, and teaching opportunities
- Persistent Cloudflare D1 state with an API fallback for local demos
- Responsive, accessible UI designed for a portfolio walkthrough

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS, Lucide, Recharts
- Drizzle ORM + Cloudflare D1
- OpenAI Sites deployment runtime

## Run locally

```bash
npm install
npm run db:generate
npm run dev
```

Open `http://127.0.0.1:5173`.

## Product direction

The prototype keeps sign-in friction out of the demo. A production version should add school-email SSO, course/section membership, a provider-backed embedding or LLM classifier, optimistic concurrency for simultaneous TA edits, and LMS integrations.

## License

MIT
