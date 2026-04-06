import pyarrow.parquet as pq
import os, glob

# Check what's inside player_data folder
print("Files in player_data:")
print(os.listdir('player_data'))

print("\nFiles in player_data/February_10:")
files = os.listdir('player_data/February_10')
print(f"Total files: {len(files)}")
print("First 5 files:", files[:5])

# Try reading first file
if files:
    filepath = os.path.join('player_data', 'February_10', files[0])
    print(f"\nReading: {filepath}")
    df = pq.read_table(filepath).to_pandas()
    print(f"Columns: {df.columns.tolist()}")
    print(f"Rows: {len(df)}")
    print(f"ts dtype: {df['ts'].dtype}")
    print(f"ts sample:\n{df['ts'].head(3)}")
    print(f"\nFull filename: {files[0]}")
    print(f"Split by underscore: {files[0].split('_')}")