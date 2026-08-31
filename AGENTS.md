# AGENTS.md

## Workspace instructions

- Never delete the codebase or laptop files, and never run destructive commands such as `rm -rf` without explicit authorization.
- Do not build ESP32 code with `arduino-cli`; the user builds and uploads it through the installed Arduino IDE.
- For visual website checks, use the existing Brave browser/session. Do not launch Chrome, Chromium, or a Playwright-managed Chromium browser because it causes high CPU usage on the user's laptop. Prefer attaching to the existing Brave session; if Brave is unavailable, report that limitation before using another browser.

## Project context

- This workspace (`/home/basil/Desktop/FYP_BACKUP/market web/Aspid-IoT`) is the static AspidIoT product/marketing website. It is not the main FYP implementation.
- The main FYP is a lightweight-cryptography-based VPN for IoT. The canonical working pipeline is:
  `/home/basil/Desktop/FYP_BACKUP/Git/git4/AspidIOT-App-R/core_codes/16apr_eds3/`
- The `16apr_eds3` pipeline contains the five ESP32 client sketches, `sink_server.cpp`, Ascon AEAD code, BLAKE2s/HMAC support, Monocypher/X25519 support, in-band rekeying, server state/rekey policy data, and telemetry logs. Its README notes that rekeying occurs on the same TCP session after MSG11, server 5 concurrency is implemented, and DB-related issues were addressed in this iteration.
- A related copy exists at:
  `/home/basil/Desktop/FYP_BACKUP/Git/git4/Capstone-1/ESP32_Pipeline_Implementations/16apr_eds3/`
  Treat the `AspidIOT-App-R/core_codes/16apr_eds3` copy as the primary app/runtime copy unless the user says otherwise, and check both before making changes that may need to be synchronized.
- The website's `auth-x.html`, `auth-x.js`, and related assets present Auth-X as a product surface derived from the FYP. Do not mistake the Auth-X page or its visual JavaScript/CSS for the complete VPN implementation.
- BaudTide is a separate open-source serial-monitor product and is not the core FYP VPN.
- When describing, redesigning, or adding website content about the FYP, inspect the `16apr_eds3` README and relevant source files first so technical claims match the actual pipeline.
