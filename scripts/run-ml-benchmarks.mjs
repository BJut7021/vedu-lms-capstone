import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.VEDU_BASE_URL || "http://localhost:8080";
async function request(path, auth, body) {
  const response = await fetch(base + "/api" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(`${path}: ${response.status} ${value.message}`);
  return value;
}
const auth = await request("/auth/login", null, {
  username: process.env.VEDU_ADMIN_USERNAME || "admin",
  password: process.env.VEDU_ADMIN_PASSWORD || "Demo@123",
  expectedRole: "ADMIN",
});
try {
  for (const dataset of ["kaggle_logs", "kaggle_recommender"]) {
    const job = await request("/platform/ml/train", auth, {
      dataset,
      config: {
        epochs: 8,
        seed: 42,
        min_support: 0.02,
        utility_ratio: 0.01,
        max_length: 3,
      },
    });
    console.log(dataset, "job", job.jobId);
    let result;
    for (let poll = 0; poll < 180; poll++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      result = await request(`/platform/ml/jobs/${job.jobId}`, auth);
      if (result.status !== "RUNNING") break;
    }
    if (result.status !== "SUCCEEDED")
      throw new Error(result.error || "Training timeout");
    const { users, items, patterns, ...report } = result.report;
    mkdirSync(new URL("../docs/experiments/", import.meta.url), {
      recursive: true,
    });
    writeFileSync(
      new URL(`../docs/experiments/${dataset}-seed42.json`, import.meta.url),
      JSON.stringify(
        {
          ...report,
          jobId: job.jobId,
          generatedAt: new Date().toISOString(),
          patternExamples: patterns
            .slice(0, 20)
            .map((p) => ({ ...p, items: p.items.map((i) => items[i]) })),
          patternDisplayLimit: 100,
        },
        null,
        2,
      ),
    );
    console.log(
      dataset,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(report.metrics).map(([model, m]) => [
            model,
            {
              recall3: m.test["Recall@3"],
              ndcg3: m.test["NDCG@3"],
              n: m.test.evaluated_users,
            },
          ]),
        ),
      ),
    );
  }
} finally {
  await request("/auth/revoke", null, {
    refreshToken: auth.refreshToken,
  }).catch(() => {});
}
