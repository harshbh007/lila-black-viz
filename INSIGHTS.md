# Player Behavior Insights - LILA BLACK

Three insights discovered using the visualization tool built 
for this assignment.

---

## Insight 1: Mine Pit is the Dominant Combat Hotspot on GrandRift

### What I Saw
When enabling Kill Zones and Death Zones heatmap overlays 
on GrandRift, an overwhelming concentration of red and orange 
markers clusters around the Mine Pit area in the center of the map.
Other named zones like Maintenance Bay, Burnt Zone, and 
Engineer's Quarters show significantly fewer combat events.

### Evidence
- GrandRift has 59 matches in the dataset
- Kill and Death heatmap overlays show Mine Pit with 3-4x 
  as marker density of any other zone
- BotKill events (humans killing bots) are almost exclusively 
  concentrated in and around Mine Pit
- Labour Quarters shows secondary combat activity but at 
  much lower intensity
- Gas Station and Cave House show near-zero combat events

### Actionable Items
Mine Pit is likely positioned at a natural choke point where 
players are forced to converge. This creates an unbalanced 
experience where:
- Players who land near Mine Pit have disproportionate 
  combat exposure
- Players in outer zones (Gas Station, Burnt Zone) have 
  a safe but boring early game
- The map's loot distribution may be incentivizing Mine Pit 
  over other zones

**Metrics affected:** Player engagement rate per zone, 
average kills per match, player retention in outer zones

**Actionable items for level designer:**
1. Add high-value loot to Gas Station and Burnt Zone to 
   incentivize players away from Mine Pit
2. Add additional cover/obstacles around Mine Pit perimeter 
   to reduce one-sided engagements
3. Consider adding a secondary objective in Engineer's Quarters 
   to split player attention
4. Widen the Mine Pit approach paths to reduce bottleneck effect

---

## Insight 2: Loot Distribution is Heavily Concentrated in Small Areas

### What I Saw
When viewing individual match journeys and filtering by Loot 
events (green squares on map), loot pickups cluster in 
very specific small zones rather than being spread across the map.
On AmbroseValley — the most played map with 566 matches — 
loot events appear concentrated around a few buildings while 
large portions of map show zero loot activity.

### Evidence
- 12,885 total Loot events across all matches
- AmbroseValley accounts for majority (566/796 matches = 71%)
- When viewing individual AmbroseValley matches, loot markers 
  cluster in 2-3 specific building clusters
- Large open areas and outer map regions show no loot events
- Players path directly to loot clusters, ignoring open terrain
- Average loot pickups per match: 12,885 / 796 = ~16 per match

### Actionable Items
The loot concentration creates predictable player routing — 
players know exactly where to go and ignore most of the map.
This reduces the exploration value of level design.

**Metrics affected:** Map coverage percentage, 
average player path length, match variety score

**Actionable items for level designer:**
1. Audit loot spawn tables — redistribute some high-value 
   loot to currently empty zones
2. Add loot to outer map areas to encourage exploration 
   of underused terrain
3. Consider dynamic loot spawns that rotate between sessions 
   to prevent predictable routing
4. Track what percentage of map area players actually visit 
   per match — target should be 60%+ coverage

---

## Insight 3: AmbroseValley Dominates Play Time But Has Declining Daily Matches

### What I Saw
AmbroseValley is overwhelmingly the most played map with 566 
out of 796 total matches (71%). However looking at the 
matches_per_date breakdown, total daily matches decline 
significantly from February 10 to February 14.
This combined with AmbroseValley's dominance suggests players 
may be experiencing map fatigue.

### Evidence
- Matches per date: Feb 10: 285, Feb 11: 200, Feb 12: 162, 
  Feb 13: 112, Feb 14: 37 (partial day)
- AmbroseValley: 566 matches (71% of all matches)
- GrandRift: 59 matches (7.4%)
- Lockdown: 171 matches (21.5%)
- The ratio of map selection stays roughly constant across 
  days — AmbroseValley always dominates
- GrandRift is severely underplayed at only 59 total matches
  vs 566 for AmbroseValley

### Actionable Items
The extreme imbalance in map selection (71% on one map) 
suggests either:
1. AmbroseValley is the default/forced map in matchmaking
2. Players actively prefer it (larger map = more content)
3. GrandRift has design issues making it unpopular

The declining match count over 5 days is concerning and 
warrants investigation beyond this dataset.

**Metrics affected:** Map rotation fairness, 
player retention rate, session length per map

**Actionable items for level designer:**
1. Investigate why GrandRift has only 59 matches — 
   is it in the rotation? Is it being avoided?
2. Add map-specific challenges or objectives to 
   incentivize playing GrandRift and Lockdown
3. Review AmbroseValley's design to understand what 
   makes it preferred — apply those learnings to other maps
4. Consider a forced map rotation system to ensure 
   all maps get equal playtesting data
5. Track player satisfaction scores per map to confirm 
   whether preference is positive or just default behavior
