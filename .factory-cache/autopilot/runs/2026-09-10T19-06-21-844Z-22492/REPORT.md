# Factory Autopilot 2026-09-10T19-06-21-844Z-22492

Status: paused
Ready for human review: NO
Local site: https://autopilot.local
Updated: 2026-09-14T09:22:45.763Z
Reported uncached input + output tokens: 11172904
Attempts without usage telemetry: 33 (unknown usage is not zero; budget is a lower bound)

SOURCE INPUT REQUIRED: order-confirmed: A real approved existing local WooCommerce order identity and its access key, with source-supported product, coupon, shipping and payment records (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/063-build-checkout/order-confirmed.source-dependency.json)
VISUAL DEFERRED: blog-article (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789205594554/blog-article/blog-article/comparison.json)
VISUAL DEFERRED: blog-archive (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789205594554/blog-archive/blog-archive/comparison.json)
VISUAL DEFERRED: contact (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789207960722/contact/contact/comparison.json)
VISUAL DEFERRED: about (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/044-build-about/build-readiness/about/about/comparison.json)
VISUAL DEFERRED: product (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/056-build-product/build-readiness/product/product/comparison.json)
VISUAL DEFERRED: product-expanded (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/056-build-product/build-readiness/product-expanded/product-expanded/comparison.json)
VISUAL DEFERRED: product-reviews-state (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/056-build-product/build-readiness/product-reviews-state/product-reviews-state/comparison.json)
VISUAL DEFERRED: product-files-state (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/056-build-product/build-readiness/product-files-state/product-files-state/comparison.json)
VISUAL DEFERRED: cart (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/060-build-cart/build-readiness/cart/cart/comparison.json)
VISUAL DEFERRED: checkout (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789292350649/checkout/checkout/comparison.json)
VISUAL DEFERRED: checkout-login (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789292350649/checkout-login/checkout-login/comparison.json)
VISUAL DEFERRED: checkout-registration (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/resume-page-check-1789292350649/checkout-registration/checkout-registration/comparison.json)
VISUAL DEFERRED: home (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/076-build-home/build-readiness/home/home/comparison.json)
VISUAL DEFERRED: home-active (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/076-build-home/build-readiness/home-active/home-active/comparison.json)
VISUAL DEFERRED: account (.factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/077-build-account/build-readiness/account/account/comparison.json)
AGENT_EXECUTION_FAILED: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/082-audit-round-0-58751f426784b007e333-shared-components; {"message":"You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at Sep 19th, 2026 10:14 AM."}
2026-09-14T09:20:17.037766Z  WARN codex_core::shell_snapshot: Failed to create shell snapshot for powershell: Shell snapshot not supported yet for PowerShell
2026-09-14T09:20:19.353995Z  WARN codex_rmcp_client::rmcp_client: stored OAuth refresh credentials could not be bound to their issuer for MCP server `figma`; using the stored access token without refresh
2026-09-14T09:22:43.356007Z ERROR codex_core::tools::router: error=exec_command failed: CreateProcess { message: "Rejected(\"This action was rejected due to unacceptable risk.\\nReason: Automatic approval review failed: You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at Sep 19th, 2026 10:14 AM.\\nThe agent must not attempt to achieve the same outcome via workaround, indirect execution, or policy circumvention. Proceed only with a materially safer alternative, or if the user explicitly approves the action after being informed of the risk. Otherwise, stop and request user input.\")" }


| Task | Model | Result | Evidence |
|---|---|---|---|
| discovery:snapshot | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/001-discovery-snapshot |
| discovery:snapshot | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/002-discovery-snapshot |
| discovery:snapshot | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/003-discovery-snapshot |
| discovery:detail-home | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/004-discovery-detail-home |
| discovery:detail-home | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/005-discovery-detail-home |
| discovery:detail-home | see historical execution.json | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/006-discovery-detail-home |
| discovery:detail-home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/007-discovery-detail-home |
| discovery:detail-home | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/008-discovery-detail-home |
| discovery:detail-careers | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/009-discovery-detail-careers |
| discovery:detail-catalogues | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/010-discovery-detail-catalogues |
| discovery:detail-blog | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/011-discovery-detail-blog |
| discovery:detail-blog | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/012-discovery-detail-blog |
| discovery:detail-contact | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/013-discovery-detail-contact |
| discovery:detail-about | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/014-discovery-detail-about |
| discovery:detail-product | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/015-discovery-detail-product |
| discovery:detail-product | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/016-discovery-detail-product |
| discovery:detail-cart | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/017-discovery-detail-cart |
| discovery:detail-checkout | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/018-discovery-detail-checkout |
| discovery:detail-checkout | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/019-discovery-detail-checkout |
| discovery:detail-product-archive | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/020-discovery-detail-product-archive |
| discovery:detail-account | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/021-discovery-detail-account |
| foundation:shared | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/022-foundation-shared |
| foundation:shared | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/023-foundation-shared |
| build:careers | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/024-build-careers |
| build:careers | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/025-build-careers |
| build:careers | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/026-build-careers |
| build:careers | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/027-build-careers |
| build:careers | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/028-build-careers |
| build:careers | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/029-build-careers |
| build:careers | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/030-build-careers |
| build:catalogues | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/031-build-catalogues |
| build:catalogues | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/032-build-catalogues |
| build:blog | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/033-build-blog |
| build:blog | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/034-build-blog |
| build:blog | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/035-build-blog |
| build:blog | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/036-build-blog |
| build:blog | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/037-build-blog |
| build:blog | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/038-build-blog |
| build:contact | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/039-build-contact |
| build:contact | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/040-build-contact |
| build:about | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/041-build-about |
| build:about | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/042-build-about |
| build:about | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/043-build-about |
| build:about | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/044-build-about |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/045-build-product |
| build:product | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/046-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/047-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/048-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/049-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/050-build-product |
| build:product | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/051-build-product |
| build:product | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/052-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/053-build-product |
| build:product | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/054-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/055-build-product |
| build:product | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/056-build-product |
| build:cart | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/057-build-cart |
| build:cart | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/058-build-cart |
| build:cart | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/059-build-cart |
| build:cart | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/060-build-cart |
| build:checkout | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/061-build-checkout |
| build:checkout | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/062-build-checkout |
| build:checkout | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/063-build-checkout |
| build:checkout | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/064-build-checkout |
| build:product-archive | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/065-build-product-archive |
| build:product-archive | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/066-build-product-archive |
| build:product-archive | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/067-build-product-archive |
| build:home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/068-build-home |
| build:home | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/069-build-home |
| build:home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/070-build-home |
| build:home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/071-build-home |
| build:home | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/072-build-home |
| build:home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/073-build-home |
| build:home | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/074-build-home |
| build:home | gpt-5.6-terra | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/075-build-home |
| build:home | gpt-5.6-terra | needs_work | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/076-build-home |
| build:account | gpt-5.6-terra | passed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/077-build-account |
| audit:round-0 | gpt-5.6-sol | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/078-audit-round-0 |
| audit:round-0 | gpt-5.6-sol | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/079-audit-round-0 |
| audit:round-0 | gpt-5.6-sol | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/080-audit-round-0 |
| audit:round-0 | gpt-5.6-sol | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/081-audit-round-0 |
| audit:round-0-58751f426784b007e333-shared-components | gpt-5.6-sol | failed | .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/082-audit-round-0-58751f426784b007e333-shared-components |

Measured visual acceptance and independent review are both required. Missing evidence never means PASS.
State: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/state.json
Latest comparison: .factory-cache/autopilot/runs/2026-09-10T19-06-21-844Z-22492/comparison-1789346670154/summary.json
