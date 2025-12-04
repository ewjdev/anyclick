Fun section — “Go-Kart Cursor” mode

Prompt: If we’ve hijacked click/touch, how wild can we get? Turn any scoped provider set to “fun” into a tiny race course.

- Core gimmick: Cursor becomes a go-kart. The parent element is the outer wall, siblings are lanes/obstacles, children are inner tracks; hit-testing maps DOM boxes to boundaries you can bounce off.
- Movement: Arrow/WASD/tilt to drive; scroll wheel = turbo; long-press to drift; collisions leave skid marks and gentle haptics.
- Goals: Lap timer, checkpoint gates on key siblings, micro-quests like “collect 3 buttons” or “park inside the form.”
- Power-ups: Hover a link to grab “boost”, hover a button to get “shield”, input fields drop “sticky tires” for precise steering.
- Visuals: Thin neon outlines on boundaries, mini shadows for depth, spark trails on boosts; respect current theme for contrast.
- Safety/accessibility: One-tap “calm mode” to revert to normal cursor; preserve focus/keyboard nav under the hood; no blocking real input.
- Multiplayer sprinkle: Optional multi-pointer view so teammates can race/guide; simple ghost lap sharing.
- Extensibility: Track generation seeded per scope; allow custom rule sets per component (e.g., modal = tight hairpin).