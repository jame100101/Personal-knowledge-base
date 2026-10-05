# Better Interface scoped review — 2026-10-05

**Final status:** Approve within the tested scope. All findings below were resolved and replayed; the initial tables preserve the audit trail. Read the final replay at the end for the current state.

## Scope and coverage

Read-only inspection of the local demo at `http://127.0.0.1:3002`: public search, desktop/mobile article reading, admin mobile drawer + nested folder modal, editor leave confirmation, language and theme controls. Vue/Nuxt, scoped CSS, shared `--kb-*` tokens; no production operations or source edits performed by this reviewer. Inspected README, REQUIREMENTS and newly created DESIGN.md. No AGENTS.md found. Loaded `better-interface` and all six owning skills, plus focus/keyboard, forms, motion/zoom, layout adaptivity, contrast and animation references.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Actual 390px search/input arrow/escape, drawer+modal Esc hierarchy/focus restoration, dirty editor navigation cancellation, language ArrowDown; source semantics/focus/reduced-motion | Search announcement and autofocus issues addressed during review; admin search focus fix needs final replay |
| Layout | Actual 320/390/1440 widths, nested dialog, editor layout, admin menu elementFromPoint hit testing; screenshots | Menu clipping reproduced at 320px; main agent changed to in-flow menu; final replay required |
| Writing | Search help/empty controls, recovery buttons, leave confirmation names, editor validation and disabled-image explanation | No additional actionable findings in inspected copy; live production-auth errors not tested |
| Typography | Rendered 320px form sizes, editor textarea after scrolling, hierarchy/layout screenshots | Mobile textarea 13px and admin search 12px reproduced; main agent added mobile 16px override; final replay required |
| Colors | Actual computed text/background compositing in both themes, 320px visible search/editor; ancestor images/gradients excluded | No AA text failures in measured samples; admin search focus border 1.878:1 was inadequate; native gray language button observed |
| UI | Read CSS/Motion durations and guard implementation, actual reduced-motion pages, dialog/drawer sequences | No running animations under reduced motion in sampled pages; theme-switch transition suppression still to verify |

## Findings (current implementation may change during main-agent fixes)

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Layout | `app/components/admin/AdminExplorerItem.vue:322`; `app/components/admin/AdminExplorer.vue:615` | Absolute row menu at y342–681 clipped by .explorer-scroll ending y596 at 320×740; 下移 and 删除文件夹 centers do not hit their buttons | Main agent has removed absolute placement and made menu a grid-column-wide flow item; scroll each action into view and retest | Critical actions clipped at 320px. Screenshot `after/audit-menu-320.png`, JSON `menu-audit.json` |
| HIGH | Accessibility | `app/components/admin/AdminExplorer.vue:528` | Input outline suppressed; only 1px #38414b border against #0b0d0f (1.878:1), no shadow | Main agent removed outline:0 to retain global 2px focus ring; keyboard-focus replay pending | No adequate visible focus indicator on frequently used search input |
| MEDIUM | Typography | `app/components/admin/DocumentEditor.vue:430`; `app/components/admin/AdminExplorer.vue:732` | Actual textarea 13px and search 12px at mobile width override shared 16px rule | Mobile scoped 16px rules now added; replay pending | Below-16px inputs trigger iOS viewport zoom; tested computed font size, not physical iOS Safari |
| MEDIUM | Accessibility | `app/components/common/SearchDialog.vue:72` | Arrow keys changed .active only, focus stayed on input, no announced result | Main agent added stable role=status showing position/count/title; replay pending | Nonvisual users otherwise do not know which result Enter opens |
| MEDIUM | Colors | `app/components/common/LanguageSelector.vue` | Dark drawer language trigger rendered with gray native button background | Explicit transparent/token background; replay pending | Unstyled control disagrees with dark theme surface; observed in menu screenshot |
| LOW | Accessibility | `app/components/common/UiDialog.vue:23` | querySelector('[autofocus], input, button') chooses first DOM button before autofocus input; folder modal focused Close | First search autofocus, then fallback input/button | Avoids unnecessary navigation before typing |

## Verification

Passed runtime observations:

- `node .tools/ui-refactor/interface-audit.mjs`: search opened by Ctrl+K and received input focus; Esc closed it and unlocked scrolling. Mobile drawer first focus was close control; folder modal Esc restored create-folder trigger and retained drawer scroll lock; second Esc closed drawer and returned to navigation trigger. Dirty editor navigation opened confirm on Keep editing; Esc kept edited title and drawer open. Latest language ArrowDown focused English.
- `node .tools/ui-refactor/contrast-audit.mjs`: both themes at 320px, no horizontal page overflow, no failed measured visible text pairs, no running animations when reduced motion requested. Complete raw pairs in JSON. This is sampling, not whole-site WCAG conformance.
- `node .tools/ui-refactor/menu-audit.mjs`: proved menu clipping through boxes and pointer hit tests, proved mobile textarea computed 13px, desktop and mobile admin-search focus style evidence.
- Visually inspected `after/audit-light-search-320.png`, `after/audit-menu-320.png`, `after/1440-light-reading.png`. Existing latter screenshot predates some contrast fixes; current MarkdownRenderer uses code-text for toolbar/copy, so old screenshot's low code-label contrast is not reported as still present.

Not verified / boundary:

- Real screen-reader announcements (only DOM roles and keyboard/focus tested), actual iOS zoom, browser 200% zoom, forced-color paint, RTL layout and pseudo-localization were not tested.
- No production authentication or database/storage write flows. No network-failure injection in this reviewer run.
- Reading/theme runtime replay was blocked by development vue-tsc overlay: UiDialog showModal() followed by leading parenthesized expression without semicolon. Reported to main agent; do not remove overlay to falsely pass UI tests.
- No claim that every article or every state was inspected. This review complements main-agent full regression tests.

## Initial verdict (superseded by final replay below)

The initial review blocked on two HIGH findings and the development type-check/runtime error. All were subsequently fixed and replayed successfully.

## Final replay update

`node .tools/ui-refactor/interface-audit.mjs` and `node .tools/ui-refactor/final-interface-replay.mjs` rerun after fixes:

- Both HIGH findings resolved: all seven menu actions can scroll into view and pass center-point hit testing; search input renders `2px solid rgb(216,255,100)` outline.
- Mobile textarea/search both render 16px; language trigger background transparent; search status is present and reads `1 / 2 · Chunking`.
- Folder modal autofocus now lands on its name input. Nested Esc/focus/scroll-lock and dirty editor cancellation remain correct.
- Development type-check overlay no longer blocks the page; the ASI error is fixed.
- `reading-audit.mjs`: 320/1440px article has no page overflow, body 16/17px at line-height1.85, descending heading scale. Mobile outline collapses and scrolls to the intended hash. Theme switch observation captures its actual transition list.

Last two non-blocking findings (both resolved in final replay):

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| MEDIUM | Accessibility | `app/components/knowledge/TableOfContents.vue:10` | Compact outline activation removes the focused link; actual focus falls to body | After collapsing and scrolling, set target heading tabindex=-1 and focus with preventScroll | Keeps keyboard users at their reading destination rather than restarting the global tab order |
| MEDIUM | UI | `app/app.vue:5`; `app/composables/useTheme.ts:18` | Actual theme flip starts many color/background/border transitions across sidebar, tags and outline | Briefly suppress transitions while committing theme, then restore on next frame | Avoids asynchronous color smearing; measured via document.getAnimations in reading-audit.json, reduced motion remains correctly respected |

No HIGH or MEDIUM findings remain in the inspected flow after the final replay recorded below. Verdict: **Approve**, limited to the stated coverage boundaries. This does not certify production auth/data-write behavior, all content, true assistive-technology output, actual iOS, 200% browser zoom, RTL or pseudo-localization.

## Public production read-only performance observation

URL verified from `docs/SOFTWARE_ENGINEERING_2026-10-05.md` (README does not list a production domain): `https://knowledge.damnatiox.com`.

One fresh unauthenticated Chromium context, 1440×1000, local computer, no CPU/network throttling: HTTP200, no JS exceptions or failed requests. SSR state contained **314 published documents, 71 publicly visible folders, zero drafts**. This is anonymous visibility, not the full database count. All article bodies total 1,092,476 characters / 1,782,145 UTF-8 bytes. Decoded home HTML 2,351,316 bytes; transfer828,508 bytes. Nuxt JSON script 1,435,561 characters. Another36 resources transfer2,507,180 bytes. TTFB944ms, DOMContentLoaded6265ms. Two >50ms initial long tasks (58/73ms).

`useKnowledge.ts:31–42` requests `select('*')` for folders and documents with no range/limit pagination, and all those article bodies are serialized into the initial home state. No client `/rest/v1/` requests appeared during this navigation because SSR supplied them. This is an existing payload/scaling cost; a later data-layer optimization should separate navigation metadata from requested article bodies and searchable indexes, without silently changing current search semantics.

Six query/input updates through the existing production search yielded second-animation-frame observations of25.3,25.5,26.7,26.9,27.4 and159.1ms. Inputs included individual prefixes and the body term依赖倒置 (two matches). This is a single frame-to-render experiment, not field INP, not pure filter execution time and not a statistical performance claim. Evidence: `production-readonly-performance.json` and its matching `.mjs` script. No login, private data, mutations or production writes.


## Final remaining-list closure

Reran `node .tools/ui-refactor/reading-audit.mjs` after the last fixes. At320px, selecting the compact article outline closes it and leaves actual focus on `<h2 id="item-04nmrnl" tabindex="-1">下一步</h2>`, with the expected URL hash. At1440px, the theme flip now starts only the intended icon opacity/transform transitions; zero color/background/border transitions appeared in the captured animation list. Both pages remain free of horizontal overflow and preserve the recorded typography.

The proposed mobile-admin-header language-menu concern does not apply: that header contains no LanguageSelector.

**Remaining actionable findings in reviewed scope: none. Final verdict: Approve.** Broader coverage limitations and existing production payload/scaling observations remain as documented; they are not represented as full-site accessibility certification or production INP measurements. Latest runtime evidence: `reading-audit.json`.
