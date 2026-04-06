#!/usr/bin/env python3
"""
Process game parquet files into JSON outputs for visualization.
"""

import json
import os
from pathlib import Path

import pandas as pd
import pyarrow.parquet as pq

MAP_PARAMS = {
    "AmbroseValley": (900.0, -370.0, -473.0),
    "GrandRift": (581.0, -290.0, -290.0),
    "Lockdown": (1000.0, -500.0, -500.0),
}

DATE_FOLDERS = [
    "February_10",
    "February_11",
    "February_12",
    "February_13",
    "February_14",
]

KILL_EVENTS = frozenset({"Kill", "BotKill"})
DEATH_EVENTS = frozenset({"Killed", "BotKilled", "KilledByStorm"})
STORM_EVENTS = frozenset({"KilledByStorm"})
POSITION_EVENTS = frozenset({"Position", "BotPosition"})


def clean_match_id(value):
    s = str(value)
    if s.endswith(".nakama-0"):
        return s[:-9]
    return s


def pixel_or_none(value):
    if pd.isna(value):
        return None
    return float(value)


def add_pixels(df):
    df["pixel_x"] = float("nan")
    df["pixel_y"] = float("nan")
    for map_id, (scale, origin_x, origin_z) in MAP_PARAMS.items():
        mask = df["map_id"].astype(str) == map_id
        if not mask.any():
            continue
        u = (df.loc[mask, "x"].astype(float) - origin_x) / scale
        v = (df.loc[mask, "z"].astype(float) - origin_z) / scale
        df.loc[mask, "pixel_x"] = u * 1024.0
        df.loc[mask, "pixel_y"] = (1.0 - v) * 1024.0


def build_file_list(project_root):
    data_root = project_root / "player_data"
    files = []
    for date_name in DATE_FOLDERS:
        folder = data_root / date_name
        if not folder.exists():
            print(f"WARN: Missing folder: {folder}")
            continue
        for name in sorted(os.listdir(folder)):
            path = folder / name
            if path.is_file() and name.endswith(".nakama-0"):
                files.append((path, date_name))
    return files


def process_one_file(path, date_name):
    filename = path.name
    user_id_from_filename = filename.split("_", 1)[0]
    is_bot_file = user_id_from_filename.isdigit()

    df = pq.read_table(path).to_pandas()

    df["user_id"] = str(user_id_from_filename)
    df["is_bot"] = bool(is_bot_file)
    df["date"] = str(date_name)
    df["event"] = df["event"].apply(
        lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
    )
    df["ts"] = pd.to_datetime(df["ts"], errors="coerce")
    df["match_id_clean"] = df["match_id"].astype(str).apply(clean_match_id)
    add_pixels(df)
    return df


def coords_list(df):
    if df.empty:
        return []
    clean = df.dropna(subset=["pixel_x", "pixel_y"])
    if clean.empty:
        return []
    return [[float(x), float(y)] for x, y in zip(clean["pixel_x"], clean["pixel_y"])]


def main():
    project_root = Path(__file__).resolve().parent
    os.chdir(project_root)

    output_dir = project_root / "output_data"
    files = build_file_list(project_root)

    print(f"Project root: {project_root}")
    print(f"Data root:    {project_root / 'player_data'}")
    print(f"Output dir:   {output_dir}")
    print(f"Total files found: {len(files)}")

    if not files:
        print("ERROR: No .nakama-0 files found under player_data/February_10..February_14")
        return

    all_frames = []
    errors = []
    ok_files = 0
    bad_files = 0

    for idx, (path, date_name) in enumerate(files, start=1):
        try:
            all_frames.append(process_one_file(path, date_name))
            ok_files += 1
        except Exception as exc:
            bad_files += 1
            msg = f"{path}: {exc!r}"
            errors.append(msg)
            print(f"ERROR (skip): {msg}")

        if idx % 50 == 0 or idx == len(files):
            print(
                f"Progress: {idx}/{len(files)} files "
                f"({ok_files} ok, {bad_files} failed)"
            )

    if not all_frames:
        print("ERROR: No valid files were processed.")
        return

    df = pd.concat(all_frames, ignore_index=True)
    df = df.dropna(subset=["ts"])

    # FIX: Calculate timestamps PER MATCH with proper relative timing
    # This ensures ts_ms starts at 0 for each match and represents milliseconds from match start
    all_frames_with_correct_ts = []
    
    # Group by match_id first to calculate per-match timestamps
    for match_id, match_df in df.groupby("match_id_clean", sort=False):
        # Convert timestamps to int64 nanoseconds since epoch
        match_df = match_df.copy()
        ts_int64 = match_df["ts"].astype('int64')
        
        # Calculate relative timestamps from the minimum timestamp in this match
        min_ts_int = ts_int64.min()
        match_df['ts_ms'] = (ts_int64 - min_ts_int)  # Already in milliseconds
        
        all_frames_with_correct_ts.append(match_df)
    
    # Recombine all frames with corrected timestamps
    df = pd.concat(all_frames_with_correct_ts, ignore_index=True)

    matches = []
    events_by_match = {}

    for match_id, sub in df.groupby("match_id_clean", sort=False):
        # FIX: Calculate duration using the corrected timestamps
        # duration_ms should be the difference between max and min ts_ms for this match
        duration_ms = int(sub['ts_ms'].max() - sub['ts_ms'].min())

        # FIX: Bot counting should include ALL unique bot user_ids per match
        # A player is a bot if their user_id is purely numeric
        bot_user_ids = set(sub.loc[sub["is_bot"], "user_id"].astype(str).unique())
        human_user_ids = set(sub.loc[~sub["is_bot"], "user_id"].astype(str).unique())
        
        # Also check for any numeric user_ids that might not be marked as is_bot
        all_user_ids = set(sub["user_id"].astype(str).unique())
        numeric_ids = {uid for uid in all_user_ids if uid.isdigit()}
        bot_user_ids.update(numeric_ids)  # Add any numeric user_ids to bot set
        
        human_count = len(human_user_ids)
        bot_count = len(bot_user_ids)

        matches.append(
            {
                "match_id": str(match_id),
                "map_id": str(sub["map_id"].iloc[0]),
                "date": str(sub["date"].iloc[0]),
                "human_count": human_count,
                "bot_count": bot_count,
                "total_events": int(len(sub)),
                "duration_ms": duration_ms,
            }
        )

        event_rows = []
        keep_cols = [
            "user_id",
            "map_id",
            "pixel_x",
            "pixel_y",
            "ts_ms",
            "event",
            "is_bot",
            "date",
        ]
        for rec in sub[keep_cols].to_dict(orient="records"):
            event_rows.append(
                {
                    "user_id": str(rec["user_id"]),
                    "map_id": str(rec["map_id"]),
                    "pixel_x": pixel_or_none(rec["pixel_x"]),
                    "pixel_y": pixel_or_none(rec["pixel_y"]),
                    "ts_ms": int(rec["ts_ms"]),
                    "event": str(rec["event"]),
                    "is_bot": bool(rec["is_bot"]),
                    "date": str(rec["date"]),
                }
            )
        events_by_match[str(match_id)] = event_rows

    heatmap_data = {
        map_id: {"kills": [], "deaths": [], "storm_deaths": [], "positions": []}
        for map_id in MAP_PARAMS
    }

    known_map_df = df[df["map_id"].astype(str).isin(MAP_PARAMS.keys())]
    for map_id in MAP_PARAMS:
        map_df = known_map_df[known_map_df["map_id"].astype(str) == map_id]
        heatmap_data[map_id]["kills"] = coords_list(map_df[map_df["event"].isin(KILL_EVENTS)])
        heatmap_data[map_id]["deaths"] = coords_list(map_df[map_df["event"].isin(DEATH_EVENTS)])
        heatmap_data[map_id]["storm_deaths"] = coords_list(
            map_df[map_df["event"].isin(STORM_EVENTS)]
        )

        pos = map_df[map_df["event"].isin(POSITION_EVENTS)].dropna(
            subset=["pixel_x", "pixel_y"]
        )
        if not pos.empty:
            pos = pos.reset_index(drop=True)
            sampled = pos.iloc[9::10]
            heatmap_data[map_id]["positions"] = coords_list(sampled)

    human_ids = set(df.loc[~df["is_bot"], "user_id"].astype(str).unique().tolist())
    bot_ids = set(df.loc[df["is_bot"], "user_id"].astype(str).unique().tolist())

    events_breakdown = {}
    for k, v in df["event"].value_counts().to_dict().items():
        events_breakdown[str(k)] = int(v)

    matches_per_map = {}
    matches_per_date = {}
    for row in matches:
        map_id = row["map_id"]
        date = row["date"]
        matches_per_map[map_id] = matches_per_map.get(map_id, 0) + 1
        matches_per_date[date] = matches_per_date.get(date, 0) + 1

    summary = {
        "total_players": len(human_ids),
        "total_bots": len(bot_ids),
        "total_matches": len(matches),
        "total_events": int(len(df)),
        "events_breakdown": events_breakdown,
        "matches_per_map": matches_per_map,
        "matches_per_date": matches_per_date,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "matches.json").open("w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2, ensure_ascii=False)
    with (output_dir / "events_by_match.json").open("w", encoding="utf-8") as f:
        json.dump(events_by_match, f, indent=2, ensure_ascii=False)
    with (output_dir / "heatmap_data.json").open("w", encoding="utf-8") as f:
        json.dump(heatmap_data, f, indent=2, ensure_ascii=False)
    with (output_dir / "summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n=== Processing Complete ===")
    print(f"Files processed: {ok_files}")
    print(f"Files skipped:   {bad_files}")
    print(f"Total events:    {len(df):,}")
    print(f"Total matches:   {len(matches):,}")
    print(f"Humans:          {len(human_ids):,}")
    print(f"Bots:            {len(bot_ids):,}")
    print(f"Output folder:   {output_dir}")
    print("Wrote files: matches.json, events_by_match.json, heatmap_data.json, summary.json")
    if errors:
        print(f"\nEncountered {len(errors)} read errors. First 10:")
        for err in errors[:10]:
            print(f" - {err}")
    print("\nSummary snapshot:")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
