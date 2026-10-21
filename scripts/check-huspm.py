"""Mathematical correctness check, not fabricated recommendation-quality data."""
import itertools
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'ml-core'))
from engine import mine_huspm

sequences = [[(0,1),(1,2),(0,8),(1,4)],[(1,3),(0,2),(1,5)],[(0,7),(2,1),(1,2)]]
actual, _ = mine_huspm(sequences, min_support=0.01, utility_ratio=0.001, max_length=3)
oracle = {}
for seq in sequences:
    embeddings = {}
    for length in (1,2,3):
        for positions in itertools.combinations(range(len(seq)),length):
            pattern=tuple(seq[i][0] for i in positions)
            utility=sum(seq[i][1] for i in positions)
            embeddings[pattern]=max(embeddings.get(pattern,0),utility)
    for pattern, utility in embeddings.items():
        count,total=oracle.get(pattern,(0,0))
        oracle[pattern]=(count+1,total+utility)
computed={tuple(p['items']):(p['support_count'],p['utility']) for p in actual}
assert computed==oracle, (computed,oracle)
print(f'PASS: {len(oracle)} patterns match exhaustive MAX-embedding utility/support oracle, including repeated items and gaps.')
