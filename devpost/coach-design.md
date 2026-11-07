# Plain-language coach — build scope

Requested by the participant after the custom UI revision: "I want to be able to chat to a coach in plane language." Interpreted as plain-language conversation. This file records the intended behavior; completed verification belongs in `verification.md`.

## Conversation

- Let learners write their own question, send it, and ask follow-up questions. Suggested questions help someone get started but do not replace free-form input.
- Explain unfamiliar words simply, use one concrete example, and offer one useful next step. Do not make every response another quiz question.
- Ground replies in the garden currently displayed. During teaching, use the tutor's demonstration values; during practice, use the learner's scenario and choices. Clearly distinguish fictional practice rates from real tax rules.
- Preserve the learner's allocations, predictions, lesson page and progress when opening and closing the coach. Model output cannot change lesson state or execute commands.
- Keep a bounded conversation in memory, provide a way to clear it, and make longer replies readable through paging or scrolling at the existing readable type size.

## Interaction and presentation

The participant confirmed they have Preview only, without Specs available. Provide a custom in-Lens keyboard for arbitrary questions through the same SIK controls as the garden. Include letters, numbers, punctuation, space, backspace and Done; completing a draft must not send it automatically. Suggested questions remain optional. Reuse the custom botanical presentation and supported SIK/UIKit interaction. Keep the garden and its current example available as the conversation's context.

Show an editable draft and an explicit Send action. Explain briefly that questions are sent to AI and that fictional examples should be used. Show thinking, cancellation, retry, unavailable service and error states in plain language. Closing or clearing a conversation must prevent an old response from appearing in a new conversation.

## AI integration and privacy

Use the supported Remote Service Gateway workflow for genuine model responses. Do not disguise canned answers or test doubles as a live AI coach. Limit prompt size, conversation history and response length. Do not send unrelated project data, credentials or personal account information.

Do not request bank credentials, tax identifiers or other sensitive financial information. No persistent transcript storage or message-content logging is intended. A free-form question can contain user-supplied information, so the previous blanket claim that no personal financial information is collected must be revised once chat is enabled.

Local development credentials must be excluded or blanked in the public source and source archive. Document setup and service availability honestly. The established lessons remain usable when chat is unavailable.

## Acceptance evidence required

1. Enter and send a free-form question through the real input UI, receive a live model response, then ask a contextual follow-up.
2. Verify replies use the displayed example, explain simply, and fit the readable conversation layout.
3. Verify opening/closing and clearing chat preserve the lesson and handle pending replies safely.
4. Verify suggested questions, loading/error controls and response paging through supported interactions.
5. Compile and inspect the final Preview, rerun affected lesson interactions, and record any device-only or unverified behavior explicitly.
6. Audit published scene/configuration files and archives for credentials before updating the public repository.
