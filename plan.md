# Rework Product Plan

Updated: 2026-07-19

## North Star

Rework helps teams remember what they decided and move it forward. Chat should feel as immediate as WhatsApp, while rooms and channels should give the work durable context like Discord, a lightweight project tool, and a trusted team memory.

Progress is tracked by product deliverables, not by lines of code.

## Current Progress

| Area | Status | Progress | Notes |
| --- | --- | ---: | --- |
| Workspace and room shell | Done | 100% | Discord-style rooms, channel navigation, members, files, calls, AI panel, and task board are connected. |
| Chat foundation | In progress | 65% | Realtime messages, reconnect behavior, typing state, attachments, and grouped bubbles exist. Replies, reactions, search, and notifications remain. |
| Memory foundation | In progress | 82% | AI retrieval, stale-memory review, deliberate message capture, provenance UI, reinforce/forget controls, and room access boundaries are connected. Correction, pause controls, and citations continue next. |
| Identity and account trust | In progress | 65% | Password auth plus provider discovery, signed OAuth state, verified-email linking, and callback handling are implemented. Provider console setup and production callback testing remain. |
| Tasks and decisions | In progress | 45% | Kanban exists. Message-to-task, decision records, ownership, due dates, and activity history remain. |
| Integrations | Planned | 0% | GitHub, calendar, document, and notification integrations are future milestones. |

## Roadmap

### Phase 0: Make The Current Product Coherent

- [x] Establish the room as the main work surface.
- [x] Add channel-like navigation for general chat, decisions, memory, and tasks.
- [x] Keep chat, files, calls, AI memory, and tasks available without leaving the room.
- [x] Refresh workspace discovery, login, and registration surfaces.
- [x] Verify the frontend with lint and a production build.

### Phase 1: Capture And Trust

- [x] Create a living product plan with progress and definitions of done.
- [x] Let a user deliberately save a useful chat message as room memory.
- [x] Enforce room access checks on every memory search, query, stale review, reinforce, and delete path.
- [x] Show memory provenance: source message, creator, confidence, importance, and last reinforced date.
- [x] Add explicit memory controls for remember, reinforce, and forget.
- [ ] Add memory correction and a room-level pause for automatic capture.
- [x] Add real Google and GitHub OAuth with signed state and verified provider identity.
- [x] Link provider accounts to an existing Rework account without creating duplicates.
- [ ] Configure provider credentials and test production callback URLs.

### Phase 2: Turn Conversation Into Work

- [ ] Add message replies, reactions, mentions, bookmarks, and message search.
- [ ] Convert a message into a task with owner, status, due date, and source link.
- [ ] Convert a message or thread into a decision record with rationale and participants.
- [ ] Add room activity history so changes are explainable.
- [ ] Add notifications for mentions, assignments, decisions, and memory updates.

### Phase 3: Make Team Memory Reliable

- [ ] Add memory scopes for room, channel, project, and personal notes.
- [ ] Show citations and source links in every AI answer.
- [ ] Add freshness, contradiction, and confidence signals that users can correct.
- [ ] Let members review what the room remembers and why it was remembered.
- [ ] Add onboarding summaries for people joining an existing room.

### Phase 4: Connect The Work

- [ ] Connect GitHub issues, pull requests, and repository activity.
- [ ] Connect calendar events, meeting notes, and follow-up tasks.
- [ ] Connect documents and shared files with permission-aware retrieval.
- [ ] Add webhooks and small automations for recurring team workflows.

### Phase 5: Expand Carefully

- [ ] Add mobile-first/PWA workflows after the core room experience is stable.
- [ ] Add organization-level administration, billing, retention, and audit controls.
- [ ] Add cross-room knowledge only when permissions and provenance are strong enough.

## Current Sprint Definition Of Done

- A member can save a chat message as memory from the room.
- The saved memory records its originating message.
- A user outside a private room cannot search, query, reinforce, or delete that room's memories.
- The frontend lint and production build pass.
- This file is updated with the completed work and the next remaining risks.

The current sprint is complete. The next sprint is memory correction/citations, message-to-task and decision capture, and production OAuth configuration.

## Product Guardrails

- Chat stays fast and useful without requiring AI.
- AI never presents private or cross-room information without permission.
- Memory is visible, editable, attributable, and removable.
- Provider buttons never pretend to work until the backend callback is configured.
- Build the smallest workflow that saves a team repeated effort before adding enterprise complexity.
