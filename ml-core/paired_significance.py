"""Paired significance analysis for locked VEDU next-item experiments.

Uses the saved per-user ranks only. It never retrains models or changes the LMS.
Unsupported targets are retained as NDCG@3 = 0, matching the all-target report.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import rankdata, wilcoxon


GRU = "GRU-next-item"
BASELINES = [
    "BPR-MF",
    "Item-KNN (sklearn external)",
    "Popularity (train-only)",
]


def ndcg_at_3(rank: pd.Series) -> np.ndarray:
    values = pd.to_numeric(rank, errors="coerce").to_numpy(dtype=float)
    return np.where(np.isfinite(values) & (values <= 3), 1 / np.log2(values + 1), 0.0)


def bootstrap_ci(delta: np.ndarray, seed: int, repetitions: int) -> tuple[float, float]:
    if not len(delta):
        return float("nan"), float("nan")
    rng = np.random.default_rng(seed)
    means = np.empty(repetitions, dtype=float)
    for start in range(0, repetitions, 100):
        size = min(100, repetitions - start)
        sample = rng.integers(0, len(delta), size=(size, len(delta)))
        means[start : start + size] = delta[sample].mean(axis=1)
    low, high = np.quantile(means, [0.025, 0.975])
    return float(low), float(high)


def rank_biserial(delta: np.ndarray) -> float:
    nonzero = delta[delta != 0]
    if not len(nonzero):
        return 0.0
    ranks = rankdata(np.abs(nonzero), method="average")
    total = ranks.sum()
    return float((ranks[nonzero > 0].sum() - ranks[nonzero < 0].sum()) / total)


def compare(path: Path, baseline: str, repetitions: int) -> dict[str, object]:
    frame = pd.read_csv(path)
    frame = frame[frame["split"] == "test"].copy()
    keys = ["user_hash", "target", "target_time"]
    left = frame[frame["model"] == GRU][keys + ["rank"]].rename(columns={"rank": "gru_rank"})
    right = frame[frame["model"] == baseline][keys + ["rank"]].rename(columns={"rank": "baseline_rank"})
    paired = left.merge(right, on=keys, how="inner", validate="one_to_one")
    if len(paired) != frame[frame["model"] == GRU][keys].drop_duplicates().shape[0]:
        raise ValueError(f"Incomplete paired population in {path} for {baseline}")

    gru = ndcg_at_3(paired["gru_rank"])
    other = ndcg_at_3(paired["baseline_rank"])
    delta = gru - other
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    bootstrap_seed = int(digest[:8], 16) ^ int(path.parent.name.removeprefix("seed-"))
    low, high = bootstrap_ci(delta, bootstrap_seed, repetitions)
    nonzero = delta[delta != 0]
    if len(nonzero):
        test = wilcoxon(nonzero, zero_method="wilcox", alternative="two-sided", method="auto")
        statistic, p_value = float(test.statistic), float(test.pvalue)
    else:
        statistic, p_value = 0.0, 1.0

    seed = int(path.parent.name.removeprefix("seed-"))
    protocol = path.parent.parent.name
    dataset = path.parent.parent.parent.name
    return {
        "dataset": dataset,
        "protocol": protocol,
        "seed": seed,
        "comparison": f"{GRU} vs {baseline}",
        "paired_targets": len(delta),
        "gru_ndcg3": gru.mean(),
        "baseline_ndcg3": other.mean(),
        "mean_delta_ndcg3": delta.mean(),
        "bootstrap_ci95_low": low,
        "bootstrap_ci95_high": high,
        "wilcoxon_statistic": statistic,
        "wilcoxon_p_value": p_value,
        "rank_biserial_effect": rank_biserial(delta),
        "significant_0_05": p_value < 0.05,
        "rank_file_sha256": digest,
        "bootstrap_repetitions": repetitions,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--bootstrap", type=int, default=2000)
    args = parser.parse_args()
    if args.bootstrap < 1000:
        raise ValueError("Use at least 1000 paired bootstrap repetitions")

    files = sorted(Path(args.artifacts).glob("*/*/seed-*/per_user_ranks.csv"))
    if len(files) != 20:
        raise ValueError(f"Expected 20 locked rank files, found {len(files)}")
    rows = [compare(path, baseline, args.bootstrap) for path in files for baseline in BASELINES]
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).sort_values(["dataset", "protocol", "seed", "comparison"]).to_csv(output, index=False)
    print(f"Wrote {len(rows)} paired comparisons to {output}")


if __name__ == "__main__":
    main()
