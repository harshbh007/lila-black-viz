import json
import os

# Load existing events
print("Loading events_by_match.json...")
with open('output_data/events_by_match.json', 'r') as f:
    events_by_match = json.load(f)

# Load matches
with open('output_data/matches.json', 'r') as f:
    matches = json.load(f)

print("Fixing timestamps...")
fixed_events = {}
fixed_matches = []

for match_id, events in events_by_match.items():
    if not events:
        fixed_events[match_id] = events
        continue
    
    # Sort by original ts_ms
    sorted_events = sorted(events, key=lambda e: e['ts_ms'])
    
    # Get min ts_ms for this match
    min_ts = sorted_events[0]['ts_ms']
    max_ts = sorted_events[-1]['ts_ms']
    
    # If duration is tiny (< 2000ms), spread events evenly
    # across a synthetic 0-600000ms (10 minute) timeline
    # based on their relative order
    raw_duration = max_ts - min_ts
    
    if raw_duration < 2000:
        # Spread events across 10 minutes synthetically
        # based on relative position in sequence
        total_events = len(sorted_events)
        synthetic_duration = 600000  # 10 minutes in ms
        
        for i, event in enumerate(sorted_events):
            # Use relative ts position scaled to 10 minutes
            if raw_duration > 0:
                relative = (event['ts_ms'] - min_ts) / raw_duration
            else:
                relative = i / max(total_events - 1, 1)
            event['ts_ms'] = int(relative * synthetic_duration)
    else:
        # Use relative timestamps normally
        for event in sorted_events:
            event['ts_ms'] = event['ts_ms'] - min_ts
    
    fixed_events[match_id] = sorted_events

# Fix matches duration
for match in matches:
    mid = match['match_id']
    if mid in fixed_events and fixed_events[mid]:
        ts_values = [e['ts_ms'] for e in fixed_events[mid]]
        match['duration_ms'] = max(ts_values) - min(ts_values)
    fixed_matches.append(match)

print("Saving fixed files...")
with open('output_data/events_by_match.json', 'w') as f:
    json.dump(fixed_events, f)

with open('output_data/matches.json', 'w') as f:
    json.dump(fixed_matches, f)

# Verify
sample_match = list(fixed_events.keys())[0]
sample_events = fixed_events[sample_match]
ts_vals = [e['ts_ms'] for e in sample_events]
print(f"\nVerification:")
print(f"Sample match: {sample_match}")
print(f"Events: {len(sample_events)}")
print(f"Min ts_ms: {min(ts_vals)}")
print(f"Max ts_ms: {max(ts_vals)}")
print(f"Duration: {max(ts_vals)/1000:.1f}s")
print("\nDone! Now copy output_data to frontend/public/output_data")