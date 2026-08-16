# Cassetta — Design Direction

## Three candidate directions

### Theme Name: Signal Archive
Very Brief Intro: أرشيف تقني تحريري يحول حركة البروتوكول إلى مادة ملموسة: أشرطة، مسارات، علامات زمنية، وورق أرشيفي. الإحساس المقصود هو الثقة والوضوح والذاكرة القابلة للمراجعة.
Probability: 0.083

### Theme Name: Terminal Field Notes
Very Brief Intro: واجهة أدوات عملية مستوحاة من دفاتر مهندس أنظمة ومخرجات الطرفية، مع تباين حاد ومساحات بيضاء وطبقات ملاحظات. الإحساس المقصود هو الدقة والسرعة وقابلية الفهم.
Probability: 0.021

### Theme Name: Protocol Night Shift
Very Brief Intro: اتجاه ليلي عالي التباين يترجم الرسائل والبروتوكولات إلى خطوط ضوئية ومسارات شبكية. الإحساس المقصود هو التركيز والعمق، مع بقاء اللون البرتقالي كإشارة تحذير لا كزينة.
Probability: 0.067

## Chosen direction: Signal Archive

### Design Movement
Editorial modernism with Swiss information design, archival printmaking, and restrained developer-tool ergonomics.

### Core Principles
1. Every visual element must explain a system state, a protocol transition, or a decision; decoration is subordinate to meaning.
2. Contrast is structural: deep ink surfaces carry command-line density, while parchment surfaces create readable inspection zones.
3. Repetition is intentional: sprocket holes, timestamp ticks, braces, and signal traces form a visual language for deterministic behavior.
4. Asymmetry creates hierarchy: content should flow through a left-to-right narrative rather than a centered marketing grid.

### Color Philosophy
The brand is anchored in ink navy (#111827) because recordings and failures deserve a serious, audit-friendly surface. Warm parchment (#F3EBDD) communicates a human-readable artifact rather than an opaque log. Vermilion orange (#E85D3F) is reserved for active signals, diffs, and action points; it should feel ownable and diagnostic, never neon.

### Layout Paradigm
A split-field narrative: a narrow archival rail on the left, an editorial content column, and a wider evidence stage on the right. Hero content enters from the left while protocol lanes and cassette artifacts create a diagonal reading path. Sections alternate between dark evidence surfaces and pale inspection surfaces instead of stacking identical cards.

### Signature Elements
- A cassette-reel / curly-brace mark used as a visual anchor and favicon.
- Thin orange signal traces that connect headings to evidence, commands, and state changes.
- Archival labels with compact monospace metadata: `CAPTURED`, `NORMALIZED`, `REPLAYABLE`, `CI-SAFE`.

### Interaction Philosophy
Interactions should feel like inspecting an artifact: reveal the next layer, preserve context, and never hide the important state behind ornamental animation. Buttons use direct verbs such as `Record a session`, `Replay offline`, and `Inspect the diff`.

### Animation
Use short 160–220ms ease-out transitions for controls and 30–60ms staggered reveals for protocol rows. Signal traces may draw in once on first view, but never loop continuously. Respect reduced-motion preferences. Keyboard actions and command-style interactions are instant.

### Typography System
Use **Space Grotesk** for display headings and navigation, paired with **IBM Plex Mono** for protocol identifiers, CLI commands, status labels, and code. Body copy uses Space Grotesk at a relaxed measure. Headings are tight and slightly oversized; metadata remains compact and uppercase with deliberate letter spacing.

### Brand Essence
Cassetta is a local-first replay and contract toolkit for engineers who need AI tool workflows to be reproducible, reviewable, and safe to ship. Personality: **forensic, dependable, sharp**.

### Brand Voice
Headlines are precise and slightly provocative; CTAs are operational; microcopy names the evidence and the next action. Avoid vague promises and generic onboarding language.

Example lines:
- “Record once. Reproduce without the network.”
- “Turn an agent failure into a committed regression test.”

### Wordmark & Logo
The wordmark is set in Space Grotesk with a custom cut into the first “a” echoing a cassette reel. The standalone mark is a geometric cassette reel fused with mirrored JSON braces and one vermilion signal notch; it must never be replaced by a generic database or terminal icon.

### Signature Brand Color
**Signal Vermilion — #E85D3F.** It owns the moment where a captured protocol becomes an actionable diff.

## Implementation reminder
The landing experience is a product surface for an open-source developer tool, not a SaaS dashboard mockup. All components should reinforce Signal Archive: archival labels, evidence lanes, asymmetric layout, dark ink / parchment contrast, and restrained vermilion signals.
