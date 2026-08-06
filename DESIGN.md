---
name: Cinematic Artisan
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3a3938'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1c1b1a'
  surface-container: '#201f1e'
  surface-container-high: '#2b2a29'
  surface-container-highest: '#363433'
  on-surface: '#e6e2df'
  on-surface-variant: '#cac6bc'
  inverse-surface: '#e6e2df'
  inverse-on-surface: '#31302f'
  outline: '#939188'
  outline-variant: '#48473f'
  surface-tint: '#cac6bc'
  primary: '#ffffff'
  on-primary: '#323129'
  primary-container: '#e6e2d7'
  on-primary-container: '#66645c'
  inverse-primary: '#605e56'
  secondary: '#ccc6bc'
  on-secondary: '#333029'
  secondary-container: '#4c4941'
  on-secondary-container: '#bdb8ae'
  tertiary: '#ffffff'
  on-tertiary: '#343029'
  tertiary-container: '#eae1d7'
  on-tertiary-container: '#69635c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6e2d7'
  primary-fixed-dim: '#cac6bc'
  on-primary-fixed: '#1c1c15'
  on-primary-fixed-variant: '#48473f'
  secondary-fixed: '#e8e2d7'
  secondary-fixed-dim: '#ccc6bc'
  on-secondary-fixed: '#1e1b15'
  on-secondary-fixed-variant: '#4a463f'
  tertiary-fixed: '#eae1d7'
  tertiary-fixed-dim: '#cdc5bc'
  on-tertiary-fixed: '#1f1b15'
  on-tertiary-fixed-variant: '#4b463f'
  background: '#141312'
  on-background: '#e6e2df'
  surface-variant: '#363433'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 84px
    letterSpacing: -0.04em
  display-md:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 24px
  margin-desktop: 80px
  gutter: 24px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
  unit-xl: 64px
---

## Brand & Style

The design system is rooted in the "Atheistic of Production"—the feeling of being in a high-end film studio or a premium game dev suite. The visual language avoids digital perfection in favor of physical tangibility, emphasizing a world built from matte graphite, aged silver, and bone.

The style is a fusion of **Tactile Minimalism** and **Filmic Noir**. It evokes a sense of deep focus and creative gravitas. Every element should feel like a physical object placed under a soft studio light, where edges catch a faint glimmer and depths are swallowed by warm, charcoal shadows. The interface does not "pop" with saturation; it "glows" with illumination.

**Key Principles:**
- **Illuminated, Not Lit:** Light feels volumetric and soft, as if passing through a lens.
- **Physical Weight:** UI elements have micro-contrast and edge-lighting to suggest they are three-dimensional artifacts.
- **Warmth in Darkness:** The "dark mode" is not cold or blue; it uses a brown-based gray scale to maintain a human, handcrafted feel.

## Colors

The palette is strictly low-saturation, relying on the interplay of "warm bone" and "matte graphite" to create hierarchy. 

- **Primary (Ivory/Bone):** Used for primary headlines and high-priority actions. It provides a soft, readable contrast against the dark background without the harshness of pure white.
- **Secondary (Muted Warm Gray):** Reserved for body text, metadata, and secondary icons. It recedes into the background to maintain focus on key content.
- **Background (Matte Graphite):** A deep, warm charcoal. It is never pure black (#000), ensuring that soft shadows and light leaks remain visible.
- **Accents (Aged Silver & Bronze-Brown):** Used for subtle borders, inner shadows, and state indicators. These colors should feel metallic and structural.

**Constraint:** Absolutely no blue, purple, gold, or saturated orange tones are permitted. All "colored" states must be derived from the bronze/silver spectrum.

## Typography

The typography system follows an editorial hierarchy. Large headings are tight, bold, and authoritative, while technical labels utilize a monospaced font to lean into the "development tool" heritage of the platform.

- **Headlines:** Set in **Manrope** for its modern yet sophisticated proportions. For large display sizes, use tight letter spacing to create a cinematic title feel.
- **Body:** **Hanken Grotesk** provides high legibility and a contemporary edge for long-form reading and tooltips.
- **Technical/Labels:** **JetBrains Mono** is used for small UI labels, tags, and data points, reinforcing the platform's professional, creative production nature.

Primary text uses the **Ivory** token; secondary/supporting text uses the **Muted Warm Gray** token.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy with expansive margins to evoke a sense of luxury and focus.

- **Desktop:** 12-column grid with a maximum content width of 1440px. Large 80px side margins act as "letterboxing" for the interface.
- **Tablet:** 8-column grid with 40px margins.
- **Mobile:** 4-column grid with 24px margins.

**Spacing Rhythm:** Use a 4px/8px base unit. Section-level spacing should be aggressive (64px+) to allow the "lighting" and "vignettes" of the background to breathe. Content within cards should use a denser 16px or 24px rhythm to feel structured and precise.

## Elevation & Depth

Depth is communicated through **Atmospheric Illumination** rather than traditional drop shadows.

- **Ambient Lighting:** Instead of generic shadows, use a subtle "inner glow" on the top-left edge of surfaces and a soft "bloom" on the bottom-right to simulate a light source in a 3D space.
- **Filmic Shading:** Backgrounds use subtle radial gradients (vignettes) to draw the eye toward the center of the screen or specific active modules.
- **Micro-Contrast:** Surfaces are distinguished by 1px borders of #4A453E (Tertiary) with a lower opacity (20-30%) on the bottom and right edges, and a slightly brighter "silver" catch-light on the top and left.
- **Bloom:** Active elements (like the primary button or a selected card) should have a soft, low-opacity outer glow that mimics light bleeding through a camera lens.

## Shapes

The shape language is **Rounded**, balancing professional structure with a premium, organic feel. 

- **Base Radius:** 0.5rem (8px) for standard buttons and input fields.
- **Large Radius:** 1rem (16px) for cards and modular containers.
- **Extra Large Radius:** 1.5rem (24px) for hero elements or promotional banners.

Avoid perfectly sharp corners, as they feel too "digital." The rounded corners should feel like machined metal or molded artifacts.

## Components

### Buttons
- **Primary:** Sculpted appearance. Uses a subtle vertical gradient from #E8E4D9 to a slightly darker beige. Text is matte black (#1A1918). Add a soft "light wrap" (1px white inner stroke at 10% opacity) on the top edge.
- **Secondary:** Transparent background with an Aged Silver border. On hover, the background fills with a 5% opacity Ivory glow.
- **Ghost:** No border, Muted Warm Gray text. On hover, text shifts to Ivory with a soft bloom.

### Cards
- **Construction:** Surfaces use the Matte Graphite background with a 1px border of #4A453E. 
- **Illumination:** Apply a soft vignette inside the card so the corners are slightly darker than the center.
- **Hover State:** The card's edge-light should brighten, and a subtle light leak effect (radial gradient) should follow the cursor position within the card.

### Inputs & Selects
- **Styling:** Recessed into the surface using a subtle inner shadow. Borders are Tertiary (#4A453E). Typography is always the Label (Monospace) or Body MD.
- **Focus:** The border transitions to Aged Silver with a soft 4px external bloom.

### Chips & Tags
- Small, monospaced text. Pill-shaped (Rounded-XL). Background is a very dark bronze tint (#2A2724) to distinguish from the main surface.

### Scrims & Overlays
- Use a deep charcoal blur (not black) to darken the background. Overlays should appear to fade in with a volumetric light effect, sliding up from the bottom of the frame.