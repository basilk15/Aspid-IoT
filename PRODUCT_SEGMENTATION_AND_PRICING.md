# AspidIoT product segmentation and pricing proposal

**Decision date:** 26 September 2026  
**Status:** Strategy proposal, not a published price list  
**Currency and market assumption:** USD, business customers with ESP32-class devices and a customer-controlled gateway or sink

## Recommendation

**Treat Tunnel-X as a separately priced product in the Secure-X family.** Auth-X establishes device identity and the session. Tunnel-X protects the data sent after that session is established. This is the natural split in the 16 April EDS-3 pipeline, and the website now has a Tunnel-X product page.

Price **Auth-X** and **Tunnel-X** as separate products, and offer **Secure-X** as their bundle. Tunnel-X can be licensed without Auth-X only when a tested adapter to a compatible external identity/session provider exists; it cannot protect data without a trusted session. Keep **BaudTide** open source and outside this commercial price list. Focus engineering and sales on proving this one device-to-sink use case.

| Offering | Customer buys | Implementation boundary | Commercial role |
| --- | --- | --- | --- |
| **Auth-X** | Device admission, challenge proof, key agreement, and confirmed session setup | Handshake through MSG6 | Entry product for customers that already have a transport or data pipeline |
| **Tunnel-X** | Authenticated encryption of device telemetry, per-session state, replay/sequence enforcement, gateway verification, and in-band rekey | MSG7 data frames; MSG8–MSG12 rekey and policy | Separate target license for customers with a compatible external identity/session provider; can also be added by upgrading Auth-X to Secure-X |
| **Secure-X** | Auth-X + Tunnel-X as one integrated device-to-sink security path | Complete current pipeline | Default offer for initial design partners |
| **BaudTide** | Open-source serial monitoring | Separate repository and workflow | Community tool; no charge in this proposal |

### Why Tunnel-X next

1. **The code is already there.** The ESP32 client encrypts fixed-format telemetry with Ascon AEAD; the C++ sink checks the session SPI and next sequence, verifies the tag, decrypts, and logs the sample. The pipeline rotates security associations in-band on the same TCP session. Building a product around these capabilities is closer than inventing a new category.
2. **The buyer outcome is clear.** Auth-X answers whether a device can establish trust. Tunnel-X answers whether its data arrives confidentially and intact over the life of the session. Together they make a complete initial security story for an embedded team.
3. **The product boundary is useful.** A customer can adopt Auth-X with an existing data path, license Tunnel-X with a compatible external session provider after the adapter is validated, or buy the integrated Secure-X path. The session handoff is the contract between them.

The first customer profile should be an **IoT OEM or systems integrator securing a small ESP32-to-gateway telemetry fleet**. The site's camera, industrial, robotics, and remote-infrastructure scenarios are valuable future markets, but the present implementation should be sold against the narrower working use case first.

### What can be claimed today

The primary implementation is [AspidIOT-App-R/core_codes/16apr_eds3](../../Git/git4/AspidIOT-App-R/core_codes/16apr_eds3/README.md). The runtime copy contains five ESP32 clients, a C++ TCP sink, device-specific authentication, X25519/HKDF session derivation, Ascon-protected frames, per-device rekey policy, telemetry logs, and a five-concurrent-client server limit. The ESP32 sketches currently **generate sample sensor values**. The desktop app can start and observe this pipeline and change per-device rekey policy.

This is a **protected application telemetry path over TCP**, not yet a general IP VPN with arbitrary traffic routing, multi-site networking, or camera-video transport. The Auth-X and Tunnel-X labels are product packaging around parts of one current protocol; they are not yet independently deployable modules. The top-level app README is older than the current dashboard/runtime code, so product claims should be checked against the source and an actual test run before publication.

## Recommended commercial sequence

### Stage 1: paid design-partner pilot, available first

| Item | Proposed terms |
| --- | --- |
| Price | **$2,500 fixed** for an eight-week pilot |
| Scope | Up to **5 concurrent ESP32-class devices**, one customer-controlled sink, one telemetry use case, and one integration workshop |
| Deliverables | Working device-to-sink demonstration, documented deployment steps, an agreed test report covering authentication, protected frames, failed-frame rejection, and rekey |
| Support | Scheduled engineering support during the pilot; no production uptime SLA |
| Conversion | Credit **50% of the pilot fee** against the first annual Secure-X license if signed within 90 days of pilot completion |

This is a proposal for a **scoped engineering engagement**, not a claim that the present build is production ready. Put pilot acceptance criteria, hardware/network responsibilities, and any custom firmware work in the statement of work. A free, supervised technical evaluation of up to five lab devices can precede a paid pilot when useful; do not promise a self-service cloud free tier until it exists.

### Stage 2: production list prices after hardening

These are target list prices for a customer-hosted gateway license with standard software updates and email support. **They should not be advertised as available now.** “Active device” means a unique registered device with at least one accepted authenticated session during the billing month. Registered devices with no accepted session that month are not billed. Each tier includes its stated number of monthly active devices; additional devices are billed at the overage rate.

| Product / tier | Monthly base | Active devices included | Each additional active device | Suitable customer |
| --- | ---: | ---: | ---: | --- |
| Auth-X Team | **$99/month** | 50 | **$0.75/month** | Small team using its own transport |
| Tunnel-X Team | **$149/month** | 50 | **$1.10/month** | Small team with a compatible external identity/session provider |
| Secure-X Team | **$199/month** | 50 | **$1.50/month** | Small fleet needing identity and protected telemetry |
| Auth-X Fleet | **$399/month** | 500 | **$0.45/month** | OEM with an established data plane |
| Tunnel-X Fleet | **$599/month** | 500 | **$0.65/month** | OEM with an external session provider and protected telemetry need |
| Secure-X Fleet | **$799/month** | 500 | **$0.90/month** | OEM with a larger device-to-sink deployment |
| Enterprise | **Custom quote** | Contracted | Contracted | Multiple sites, dedicated deployment, integration, or negotiated support/SLA |

**Pricing relationship:** Standalone Auth-X plus standalone Tunnel-X bases total $248 for Team or $998 for Fleet. Secure-X at $199 or $799 saves $49 or $199 on those bases (about 20%) and has a lower combined overage rate. An Auth-X customer can instead upgrade to Secure-X: within the same tier the incremental base is **$100 Team** or **$400 Fleet**, and the incremental overage rate is **$0.75 Team** or **$0.45 Fleet**. A Secure-X device is counted once, never once per component. Tunnel-X's higher standalone price covers the separate session-provider integration and support boundary; custom adapter engineering remains quoted separately. Do not activate a standalone Tunnel-X subscription until the external session interface is designed, documented, and tested.

**Billing rules:** Bill monthly in arrears for overage, give usage alerts at 80% and 100% of included devices, and never interrupt an established security session because of a billing threshold. Offer **15% off the base subscription for annual prepayment**; keep device overage monthly. Customer provides and pays for its gateway infrastructure, connectivity, and retained telemetry storage. Price hosted operation, custom firmware/SDK work, on-site installation, and formal SLA support separately by quote. There is no per-message or per-GB charge in the customer-hosted base license.

**Examples:** 100 monthly active devices cost **$136.50 for Auth-X Team**, **$204 for Tunnel-X Team**, or **$274 for Secure-X Team**. Buying the two standalone licenses would total $340.50 at that usage; Secure-X saves $66.50. At 500 active devices, Fleet costs **$399 Auth-X**, **$599 Tunnel-X**, or **$799 Secure-X**; the bundle saves $199 against separate licenses. Team and Fleet break even at 450 active devices for Auth-X and Secure-X. Tunnel-X Team remains cheaper through 459 active devices and Fleet becomes cheaper at 460.

### Conditions before offering production subscriptions

- Prove more than five concurrent devices under sustained load, reconnects, rekeys, packet loss, and process restarts. The current five-client limit is a prototype ceiling, not a scale claim.
- Replace generated sample readings with a documented application payload or SDK contract; test at least one real customer sensor integration.
- Define the Auth-X-to-Tunnel-X handoff as a stable API/SDK boundary. For Tunnel-X sold separately, document the external session-provider contract, trusted key/state import, authentication of that handoff, failure behavior, and compatibility tests.
- Document provisioning, secret storage and rotation, device revocation, upgrade/rollback, deployment, log retention, and recovery procedures; review the protocol and implementation independently before production use.
- Add reliable usage metering for monthly active devices and validate that the gateway, dashboard, and billing figures agree.
- Establish support response targets and an SLA only after operating the service with design partners.

## Pricing rationale and market references

These are **reference points, not direct feature-equivalent competitors**. The proposal prices a specialized embedded security workflow and customer integration; it does not attempt to win on raw MQTT message cost.

| Reference, checked 25 September 2026 | Published pricing signal | Implication for AspidIoT |
| --- | --- | --- |
| [AWS IoT Core pricing](https://aws.amazon.com/iot-core/pricing/) | Example US/EU connectivity rate of **$0.08 per million connection-minutes** and first-tier MQTT message example of **$1 per million messages** | Infrastructure transport is cheap; charge for the security product and integration outcome, not for bytes alone. |
| [Tailscale pricing](https://tailscale.com/pricing) | Standard **$8/user/month**, Premium **$18/user/month**, with tagged-resource pricing; Edge/IoT at scale is contact sales | A generic secure network has a different meter and broader network scope. Avoid claiming Tunnel-X replaces a full overlay VPN. |
| [EMQX pricing](https://www.emqx.com/en/pricing) | Serverless starts free; Dedicated Flex starts at **$234/month** | Buyers can get managed MQTT cheaply; position Secure-X around device admission, lightweight session protection, and lifecycle control. |
| [Mender pricing](https://mender.io/pricing/plans) | Basic starts **$34/month for up to 50 devices**; Professional **$291/month for up to 250 devices** | A base fee plus a device allowance is familiar in embedded software. |
| [Particle pricing](https://www.particle.io/pricing/) | Basic **$299/month per 100-device block** with data operations | The proposed Secure-X Team example for 100 devices sits near an established IoT platform price, while offering a narrower security function. |

The dollar figures above are **AspidIoT recommendations**, not prices derived mechanically from competitors. Test willingness to pay with 5–10 qualified OEM/integrator conversations and at least three paid pilots. Track pilot conversion, deployment effort, support hours per customer, and gross margin; revise prices after real evidence rather than publishing permanent discounts early.

## Immediate website and sales implication

Show Auth-X, Tunnel-X, and Secure-X as three distinct proposed licenses on the pricing page, with Secure-X clearly identified as the bundle. Label every subscription figure as a target after hardening, and label standalone Tunnel-X as dependent on a tested external session-provider interface. A Tunnel-X-focused pilot may be scoped with a customer that already has a compatible session provider; adapter engineering is quoted separately. Keep the existing Tunnel-X product page aligned with that distinction. Do not offer production subscriptions until the readiness conditions above are met. BaudTide remains identified as an open-source community tool, with no dependency on the paid Secure-X offer.
