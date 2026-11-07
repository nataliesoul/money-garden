# Money Garden custom keyboard + AI coach checkpoint — 2026-11-06

The botanical tutor-first Lens includes real contextual AI chat through RemoteServiceGateway. Type opens an in-Lens QWERTY keyboard composed of persistent SIK/UIKit buttons; symbols/digits, Shift, Backspace, draft Clear and draft-page navigation are supported. Done reviews the draft and never sends. A separate Send requests the provider. Native OS keyboard dependencies were removed after documented Preview limitations.

Actual keyboardLive PASSED19:09:39.700 (46.790s): Shift/X/Backspace/Clear; genuine key-entered "Why save 200?" including digits/question mark; Done preserves requestId and empty history; Send returns a live answer; separately key-entered "Use an example." returns a contextual200-credit example with150 repair/50 remaining. History1→2 and Back/reopen preserve learner reserve300/unallocated700 exactly. No private draft setters or handlers were used. keyboardView captured the genuine draft; clean coach-keyboard.png and coach-typed-answer.png are current evidence.

keyboardPages has authoritative Lens-side PASSED19:12:37.094 (102.782s) after the native call timed out115s including startup overhead. It continued uninterrupted:141 actual SIK characters, Prev shows140/Next1, draft Clear resets page0, Done sends nothing, Back preserves lesson. No reset/retry. Native timeout is a transport-window limitation, not an assertion failure.

Earlier current-coach evidence: coachLive PASSED18:57:38.957 (36.172s) for pending Cancel/Clear and5-second late-response observations, two real suggestion/follow-up replies and exact500/300/100 learner-plan preservation. coachChecks PASSED19:02:09.331 (20.267s): empty Send error, suggestion draft-only, Clear/Back preservation, worked-example context500/300 while learner0/0. Its first attempt timed out before Lens RUNS, then passed after supported runner readiness recovery; no assertion failure. Network/context code is unchanged by custom keyboard.

Selected current-coach regressions: practice18:59:54.431 (9.869s), tutor19:00:57.086 (47.386s), utilities19:01:27.470 (11.005s). Earlier custom-theme baseline has all eight PASSED; see devpost/verification.md for historical evidence and full-replay transport distinction.

All observed provider replies fit one response page; response paging remains unexercised. Forced offline/missing-auth, physical Specs reach/comfort/performance, and audio listening remain unverified. AI answers are contextual but nondeterministic; tested examples are not a guarantee of every response.

RSG sample groups and guide disabled; local credential object remains active. Parent must sanitize live credentials from local export before publishing. Final scene welcome/diagnostics hidden; final native compile/runtime/save/export follows. No package upgrades, final hackathon submission or Lens publication by tester.
