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

The live service answered a lesson-specific suggested question and a follow-up requesting simpler wording through actual Preview controls. This establishes live conversation for those inputs, not arbitrary typed input.

The installed UIKit `SystemKeyboardModule` supplies the modern keyboard bridge and paired-phone compatibility. SPECS 27 Preview does not display the system keyboard; native text injection did not change the draft. A No Simulation attempt did not provide a working SIK test path, and the original SPECS 27 Preview configuration was restored. Free-form typing remains unverified on physical Specs. On-device validation must enter an original question, finish the keyboard input, Send, and receive a relevant answer before claiming the full typed path passed.

See `verification.md` for completed evidence. Compilation or successful credential setup alone does not establish that keyboard input works. Device behavior and Preview behavior are identified separately.
