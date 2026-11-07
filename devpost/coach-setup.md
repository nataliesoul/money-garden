# Coach connection and privacy

The plain-language coach uses OpenAI chat completions through Snap's Remote Service Gateway. It needs an internet connection and valid development credentials. The established garden lessons remain separate from that service.

## Open a public source copy

The public scene intentionally contains empty `snapToken`, `openAIToken`, and `googleToken` fields. Local development credentials are never part of the public repository or source archive.

Open the project in Lens Studio, sign in with your own account, and review the installed RemoteServiceGatewayToken plugin's normal permission request. Use CLAD's Remote Service Gateway setup workflow to generate and wire the provider tokens on `MoneyGarden_LocalAICredentials`, then save locally. Do not paste credentials into a public issue or commit the authenticated scene. If authorization expires, regenerate through the same workflow.

The project uses RemoteServiceGateway 0.2.0, Utilities 1.1.0 and SnapDecorators 1.1.0 alongside its existing SIK/UIKit packages. Preserve package notices. Do not upgrade the interaction/testing frameworks merely to configure the coach.

## What is sent

Pressing Send transmits the question, a bounded recent conversation, and the current fictional lesson context through the AI service. During a worked example, context describes the tutor's demonstration; during practice, it describes the learner's fictional choices. The model has no tools that can change allocations or lesson progress.

Conversation history is held in memory for the current Lens session. Clear chat removes that local history; it does not delete information already sent to the service. The application does not intentionally log message contents or persist a transcript. Avoid entering personal financial details, account credentials or tax identifiers.

Cancellation ignores a late response locally; it does not promise to withdraw a request already sent to the service. AI answers can be mistaken. Practice tax rates are fictional, and the coach is intended for learning concepts rather than preparing a return or recommending investments.

## Verification

The live service answered a lesson-specific suggested question and a simpler follow-up through actual Preview controls. The final custom keyboard also passed arbitrary character entry and a genuine two-turn conversation: **Why save 200?**, then **Use an example.** Done preserved the draft without sending; Send requested the live answer. No private text setter or canned response was used.

The participant uses Preview only. **Type a question** therefore opens an in-Lens QWERTY keyboard with letters, numbers, punctuation, Shift, Space, Backspace, Clear and Done. Use Prev/Next to review long drafts. The native system keyboard and the attempted UIKit keyboard bridge were replaced after SPECS 27 Preview failed to deliver text. The final input path has no device-keyboard dependency. The original SPECS 27/Plane Preview settings are restored. Physical-device interaction and comfort remain untested.

See `verification.md` for completed evidence, including the earlier failed native-keyboard route and remaining limits. Device behavior and Preview behavior are identified separately.
