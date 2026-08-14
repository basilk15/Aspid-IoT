# Hero design QA

## Evidence

- Source visual truth: /tmp/codex-clipboard-e012c788-3fa4-49af-88e6-2da244c1b598.png
- Logo-first implementation screenshot: /tmp/aspid-iot-qa-intro.png
- Orbit-reveal implementation screenshot: /tmp/aspid-iot-qa-orbit-normalized.png
- Extended orbit timing screenshot: /tmp/aspid-iot-qa-orbit-long.png
- Final longer orbit hold screenshot: /tmp/aspid-iot-qa-orbit-longest.png
- Combined comparison: /tmp/aspid-iot-qa-comparison.png
- Source pixels: 685 × 425.
- Raw implementation capture: 675 × 419.
- Normalized implementation pixels: 685 × 425.
- CSS viewport: 685 × 425, device pixel ratio 1.5.
- Normalization: resized the raw browser capture to the source pixel dimensions for visual comparison.

## State and interaction coverage

- Initial state: centered AspidIoT logo/name and tagline; orbit opacity 0, circle opacity 0, feature words hidden.
- Orbit-hold state: on the current mobile preview at CSS viewport 481 × 532, the 360svh hero reaches progress 0.521 after 720px of scrolling; orbit opacity 0.99, circle opacity 0.65, feature words remain hidden.
- First orbit reveal: hero progress 0.509 in the normalized comparison state; orbit opacity 1, circle opacity 0.65, feature words remain hidden.
- Full sequence: continued scroll reveals the feature words and allows the page to enter the Features section.
- Return path: scrolling back to the top resets the hero to the logo-first state.
- Console errors: none. Existing Three.js CDN deprecation and .encoding compatibility warnings remain; no new errors were introduced.

## Comparison

The full-view comparison uses the supplied hero image and the centered orbit-reveal state. The logo asset, dark circular core, teal orbit band, cyan/magenta palette, and two-line cryptographic tagline are all present. The implementation keeps the existing navigation chrome because the supplied image is a hero-only reference crop.

A focused crop was not required: the source image is a single hero composition and the logo, orbit, tagline, and spacing are readable in the full viewport comparison.

## Findings

- No actionable P0, P1, or P2 findings remain.

## Comparison history

1. Initial pass: the narrow responsive mark was too small compared with the supplied visual and the orbit band was too subdued.
2. Fixes: expanded the mobile hero brand cap, delayed mobile feature words until after the orbit reveal, and increased the Three.js orbit geometry/material contrast.
3. Timing pass: the orbit-only stage was too brief on mobile because the hero ended after roughly two large scrolls.
4. Timing fix: extended the mobile hero to 300svh, increased the desktop scrub distance, slowed scrub smoothing, and moved feature-word thresholds later.
5. Follow-up timing pass: the orbit still needed more breathing room, so the mobile hero was extended to 360svh and the feature-word thresholds moved later again.
6. Post-fix evidence: /tmp/aspid-iot-qa-comparison.png at the normalized 685 × 425 viewport plus /tmp/aspid-iot-qa-orbit-longest.png for the final mobile orbit hold. The logo-first state, extended orbit hold, later text reveal, top reset, and section transition were rechecked.

## Follow-up polish

- P3: the product navigation is intentionally visible in the implementation but is outside the supplied hero-only reference crop.

final result: passed
