import pyarrow.parquet as pq
import os
from collections import defaultdict

match_data = defaultdict(lambda: {'min': float('inf'), 'max': float('-inf'), 'files': 0})

days = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14']

for day in days:
    folder = os.path.join('player_data', day)
    for fname in os.listdir(folder):
        fpath = os.path.join(folder, fname)
        try:
            df = pq.read_table(fpath).to_pandas()
            match_id = df['match_id'].iloc[0].replace('.nakama-0', '')
            ts_int = df['ts'].astype('int64')
            match_data[match_id]['min'] = min(match_data[match_id]['min'], ts_int.min())
            match_data[match_id]['max'] = max(match_data[match_id]['max'], ts_int.max())
            match_data[match_id]['files'] += 1
        except:
            continue

print(f"Total matches: {len(match_data)}")
print("\nTop 10 longest matches (all files combined):")
durations = [(mid, (v['max'] - v['min']), v['files']) for mid, v in match_data.items()]
durations.sort(key=lambda x: x[1], reverse=True)
for mid, dur, files in durations[:10]:
    print(f"  {mid[:20]}... duration: {dur}ms = {dur/1000:.1f}s | files: {files}")

print("\nSample of a long match events:")
best_match = durations[0][0]
print(f"Match: {best_match}")