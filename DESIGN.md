# Design Direction

## Product

RSPO Credit Calculator helps Indonesian cooperatives, farmers, and buyers estimate RSPO credit revenue. The interface should feel calm, clear, and practical for people who may not use financial software every day.

## Visual direction

- Energy: 1 (calm); rhythm: 2 (consistent with a few breaks); motion: 1 (subtle interaction feedback).
- Use a compact hierarchy with generous spacing, readable sans-serif typography, and restrained decoration.
- Keep the calculator focused on its four main inputs. Put exchange currency and extraction-rate settings behind the existing settings tabs.
- Keep layouts responsive: stack on narrow screens and place inputs beside results when there is room.
- Keep English and Indonesian UI copy internally consistent with the selected language. The header brand follows the selected language; the footer always keeps the product name `RSPO Credit Calculator` in English.

## Color

- Primary orange: `#e17e00`. Use this exact value for brand accents, navigation and page links, section headings, and primary action backgrounds.
- Primary text on orange surfaces: warm off-white `#f2f1eb`.
- Use the darker orange `#9c5000` for light-mode input labels, borders, and focus indicators when the full primary orange would be too faint.
- Secondary sustainability green: `#24593e` in light mode and `#abd6b4` in dark mode.
- Dark-mode background: `#121212`; use the existing muted dark surfaces and off-white body text.
- Keep the logo's rounded orange background aligned with `#e17e00`.

### Contrast decision

The selected brand orange does not meet WCAG AA contrast for normal text on the light page background. Off-white text on the exact orange primary background also falls below AA. Preserve these chosen colors for brand consistency; do not silently replace them with a different shade. If AA contrast for these combinations becomes a release requirement, revisit the color decision with the product owner.

## Interaction and content

- Keep labels visible, controls comfortably touchable, and links visibly identifiable beyond color alone.
- Reserve the primary orange fill for focused actions and result emphasis. Use the secondary green for sustainability or added-value cues.
- Keep explanatory copy short. Put technical definitions in the glossary and reveal them where terms appear.
- Keep result disclaimers near results, with a link to the full terms.
- Keep theme and language controls available site-wide, with language selection in the header and theme selection in the footer.

## Initial loading on shared hosting

- Keep SEO and social-preview metadata in the initial Blade response; loading must not require a persistent SSR process.
- Show the logo, localized app name, and owner immediately, matching the frontend header's dimensions, spacing, and colors.
- Show static skeletons immediately for the calculator, guide, and FAQ while React loads. Match their responsive layout and hide them when React mounts; do not add a reveal delay or force a minimum loading time.
- Keep the text fallback inside `<noscript>` so JavaScript users do not see a different page before the app loads.
- Apply the saved theme and matching page background before the first paint to avoid a light-to-dark flash.
