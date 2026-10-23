export type Role = "student" | "ta" | "instructor";
export type Priority = "high" | "medium" | "low";

export type Question = {
  id: string;
  student: string;
  summary: string;
  detail: string;
  code?: string;
  clusterId: string;
  submittedAt: string;
  resolved: boolean;
};

export type Cluster = {
  id: string;
  title: string;
  topic: string;
  color: string;
  priority: Priority;
  insight: string;
  suggestedFix: string;
  resolved: boolean;
};

export type QueueState = { questions: Question[]; clusters: Cluster[]; revision: number };

export const seedClusters: Cluster[] = [
  { id: "recursion", title: "Base cases & recursive returns", topic: "Recursion", color: "#6d5dfc", priority: "high", insight: "Most students recurse correctly but discard the returned value or miss the empty-input base case.", suggestedFix: "Draw one call stack together, then compare the base case and return path.", resolved: false },
  { id: "junit", title: "JUnit cannot find tests", topic: "Testing", color: "#f08b42", priority: "high", insight: "The queue mixes JUnit 4 imports with the JUnit 5 runner configured by the course starter.", suggestedFix: "Share the JUnit 5 import checklist and run one known-good test.", resolved: false },
  { id: "linked-list", title: "Linked-list pointer updates", topic: "Data structures", color: "#18a47b", priority: "medium", insight: "Students update current.next before saving the rest of the list.", suggestedFix: "Walk through the three-pointer pattern on the board.", resolved: false },
  { id: "loops", title: "Loop bounds & off-by-one", topic: "Control flow", color: "#df5c78", priority: "medium", insight: "Several submissions use <= length and index one position beyond the array.", suggestedFix: "Broadcast a quick half-open interval reminder: [0, length).", resolved: false },
  { id: "git", title: "Git merge conflicts", topic: "Tooling", color: "#4f86df", priority: "low", insight: "Most conflicts are generated files that should not have been committed.", suggestedFix: "Send the course .gitignore and demonstrate accepting one conflict.", resolved: false },
  { id: "interfaces", title: "Interfaces & polymorphism", topic: "OOP", color: "#a66b45", priority: "medium", insight: "Students understand implementation but are unsure which methods belong on the interface type.", suggestedFix: "Use one substitution example and contrast compile-time vs runtime types.", resolved: false },
];

const questionTemplates: Array<[string, string, string, string?]> = [
  ["recursion", "My recursive method always returns 0", "The smaller calls seem right in the debugger, but the original call is zero.", "return count(xs.substring(1));"],
  ["recursion", "StackOverflowError on empty input", "It works for normal strings but crashes when the string is empty."],
  ["recursion", "Why is my recursive result ignored?", "I call the method again but Java says the return value is unused."],
  ["recursion", "Palindrome recursion fails on one letter", "Even-length words pass but odd-length words fail in the middle."],
  ["recursion", "Tracing recursive calls", "I cannot tell what value each frame returns."],
  ["recursion", "Binary search never stops", "Low and high become the same but it keeps calling itself."],
  ["junit", "No tests found", "VS Code says zero tests even though my @Test annotations are there.", "import org.junit.Test;"],
  ["junit", "assertEquals is undefined", "The starter test file compiles but mine cannot find assertEquals."],
  ["junit", "JUnit runner mismatch", "My tests are green locally and fail on the grader."],
  ["junit", "BeforeEach is not running", "My list stays null in every test."],
  ["junit", "Expected exception test", "How do I test that my method throws IllegalArgumentException?"],
  ["linked-list", "Reverse loses half my list", "After changing next, I can no longer reach the remaining nodes."],
  ["linked-list", "Removing the head node", "My remove method works everywhere except index zero."],
  ["linked-list", "NullPointerException in traversal", "current becomes null before the loop finishes."],
  ["linked-list", "Insert duplicates a node", "The new node appears twice after inserting in the middle."],
  ["linked-list", "Tail is stale after remove", "Printing works but adding afterward attaches to the wrong node."],
  ["loops", "Array loop crashes on last item", "I get ArrayIndexOutOfBoundsException only at the end.", "for (int i = 0; i <= values.length; i++)"],
  ["loops", "Missing final character", "My loop stops before adding the last letter."],
  ["loops", "Nested loop repeats too much", "I expect n results but get n squared."],
  ["loops", "Infinite while loop", "The counter changes in the if branch but not the else branch."],
  ["loops", "Fencepost error in substring", "The last token is always missing."],
  ["git", "Merge conflict after pulling", "Git shows <<<<<<< in three Java files and I am afraid to delete them."],
  ["git", "Cannot push rejected", "It says the remote contains work that I do not have."],
  ["git", "Why is bin committed?", "Every compile creates dozens of changed .class files."],
  ["git", "Detached HEAD", "I checked out an old commit and now my new work is not on main."],
  ["interfaces", "Cannot instantiate interface", "Java says Shape is abstract when I call new Shape()."],
  ["interfaces", "Method not visible on interface type", "The object has the method but the variable cannot call it."],
  ["interfaces", "Override annotation error", "I copied the method but @Override is red."],
  ["interfaces", "Casting subclass", "Do I need to cast every Shape to Circle?"],
  ["interfaces", "Default method conflict", "Two interfaces provide the same default method."],
];

const names = ["Maya", "Leo", "Priya", "Noah", "Sofia", "Ethan", "Avery", "Jordan", "Kai", "Mina"];

export const seedState: QueueState = {
  clusters: seedClusters,
  questions: questionTemplates.map(([clusterId, summary, detail, code], index) => ({
    id: `q-${index + 1}`,
    student: names[index % names.length],
    summary,
    detail,
    code,
    clusterId,
    submittedAt: new Date(Date.now() - (index + 2) * 78000).toISOString(),
    resolved: false,
  })),
  revision: 1,
};

export function classifyQuestion(text: string) {
  const value = text.toLowerCase();
  if (/junit|test|assert|beforeeach/.test(value)) return "junit";
  if (/linked|node|pointer|head|tail/.test(value)) return "linked-list";
  if (/loop|array|index|bound|while/.test(value)) return "loops";
  if (/git|merge|push|pull|commit/.test(value)) return "git";
  if (/interface|override|class|polymorph|cast/.test(value)) return "interfaces";
  return "recursion";
}
