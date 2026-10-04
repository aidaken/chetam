# Chetam PRD: Personal Assistant in Your Texts

Oct 4, 2026 · @Kenzhebaev

## Overview and pitch

Chetam is a personal AI assistant you text on iMessage. He knows your goals, reads your calendar, chats, and fitness data, tells you where your time should go, and finishes tasks for you after you approve. This PRD covers what to build today at the Neon Build Personal Agents Hack (Sunday October 4, 2026, Terra Gallery, San Francisco), how it works, and how to demo it in two minutes.

**One-liner:** "Chetam is the personal assistant you text. He knows your goals, watches your day, and handles the follow-through."

**Slide tagline:** "A real personal assistant for people who don't have one."

**30-second spoken pitch:** "CEOs have a personal assistant who knows their goals, manages their calendar, and tells them when to leave for a meeting. Everyone else has a to-do list they ignore. Meet Chetam. You just text him. He starts your day: he's read your chats, your calendar, and your fitness app, so he tells you you're 900 calories short of your weekly goal and adds a plan on top of your schedule. He finds the doc you owe a friend and drafts the email. At 3 PM he sees you're still home, tells you to leave now, and offers to email your 4 PM that you'll be a few minutes late. You say yes, and it's sent. He remembers everything, you can see and edit it all, and nothing goes out without your approval. A real personal assistant, for the price of a text."

**Product summary:** Chetam lives in iMessage and behaves like a human assistant. He goes first (morning briefing, leave-now nudges, goal check-ins), answers questions about your messages, email, calendar, fitness, and spending, and acts on your behalf with approval (calendar blocks, emails, gift searches). A web page, Chetam's notebook, shows what he knows and what he did.

## Problem, users, and differentiation

People have goals, but their time follows whatever is loudest, and no tool connects the two. Three pains drive the product:

- **Goals and calendars live apart.** Nothing checks whether your week matches what you said matters.
- **AI assistants forget.** Common complaints are re-asking preferences every session and losing yesterday's decisions, so users re-explain themselves constantly.
- **Logistics eat attention.** Running late, rescheduling, following up on promises buried in chats: only people with a human assistant get relief.

**Target users:** students, founders, engineers, and busy parents or professionals with a packed calendar and clear goals. The demo persona is a busy parent and builder.

**How Chetam differs from existing text assistants.** Products like folk (a friend in your texts for habits, streaks, subscriptions, email, and memory) and Poke already live in messaging apps. Chetam does not compete on breadth or friendliness. He is built around your stated goals and your real calendar, uses live location, and completes multi-step tasks with an inspectable trail.

|  | Typical text assistant | Chetam |
| --- | --- | --- |
| Core idea | Friendly generalist, habit nudges | Makes your time follow your priorities |
| Context | Mostly what you tell it | Calendar, chats, email, fitness, spending, location |
| Actions | Reminders, some tasks | Multi-step tasks after one approval |
| Trust | Opaque memory | Visible, editable memory and action log |

## Features

Nine core features carry the demo, and four stretch features come only if the core works by the halfway point. "Real" means built live today; "Seeded" means hardcoded data labeled as simulated in the voiceover.

| # | Feature | What it does | Priority | Real or seeded |
| --- | --- | --- | --- | --- |
| 1 | Proactive morning briefing | Texts first with the day: school drop-off leave time, open gym slot, 4 PM meeting, owed doc. One "yes" runs every action. | Core | Agent and actions real, inputs mixed |
| 2 | Goal-aware planning | Compares the calendar to goals (ship the app, workouts) and proposes blocks, e.g. Thursday 2 to 5 for the app. | Core | Real (Google Calendar) |
| 3 | Fitness goal tracking | Reads weekly active calories from a fitness app, calculates the gap against the goal, and adds a catch-up plan on top of the schedule. | Core | Seeded (JSON); Strava or Apple Health on roadmap |
| 4 | Reads your other chats | Pulls commitments and plans from threads with friends and family (Sam's doc, Alex's meeting, Dad's birthday). | Core | Seeded (fake threads) |
| 5 | Location-aware leave-now nudge | Checks location and travel time before a meeting and says when to leave. | Core | Toggle plus fixed or maps-API travel time |
| 6 | Acting for you, with approval | Emails attendees and others from Chetam's labeled inbox, creates calendar events, drafts and sends the owed doc from Drive. | Core | Real (AgentMail, Executor) |
| 7 | Niche gift research | Searches the web using personal context (Dad restores vintage radios, grows chilies) and returns specific links under a budget. | Core | Real (Exa) |
| 8 | Memory you control by text | Ask what he knows, correct it, or say "forget that". | Core | Real (Neon) |
| 9 | Notebook page | Web view of goals, memory, upcoming nudges, and an action log with reasons. | Core | Real (Assistant UI plus Neon) |
| 10 | Spending vs goals | Logs spending by text or email receipts and nudges against goals like food under $150. Information only, not financial advice. | Stretch | Seeded or text-logged |
| 11 | Email triage and lookups | "What's the latest from Alex?" and inbox summaries. | Stretch | Real (Gmail via Executor) |
| 12 | More MCP plug-ins | Notion, Drive, tasks through Executor so abilities grow without new code. | Stretch | Real |
| 13 | Subscription and refund recovery | Finds forgotten charges and disputes them (Kernel and AgentMail). | Stretch | Real if time |

**Rule for every feature:** read-only lookups run automatically. Anything that sends, changes, or contacts another person needs an explicit yes.

## User experience

Everything day to day happens in the iMessage thread, and one web page handles setup and trust. Chetam's texts stay short, one or two lines, so he reads like a person.

**Setup (about 2 minutes, once)**

1. The user texts Chetam's number. He replies: "Hey, I'm Chetam. Tell me what you're working toward and I'll help you spend your time on it," and sends a setup link.
2. On the link, the user connects Google Calendar and Gmail, installs the location Shortcut, and optionally connects a fitness app.
3. The user tells Chetam their goals in plain text: "My priority this month is shipping the app. I want 2,000 active calories a week."

**Daily use (all in iMessage)**

- Chetam texts first: morning briefing, goal check-ins, leave-now nudges, end-of-day follow-ups.
- The user asks naturally: "What do I have tomorrow?", "What did Sam ask me for?", "How's my workout week?"
- The user manages memory by text: "What do you know about me?", "Forget the meeting with Priya."
- Approval is a one-word reply ("yes", "send"). One approval can authorize a bundle of actions.

**Chetam's notebook (web page)**

Shows goals, everything Chetam knows (editable and deletable), upcoming nudges, and an action log with the reason for each action. It is also where accounts are connected. It is read-mostly: texting stays the main control surface.

**Why texting plus a page:** setup needs OAuth screens that cannot happen in a text, and the notebook gives judges and users a visual proof of memory and actions that a text thread cannot.

## Architecture

One agent loop handles every case: a trigger wakes it, it loads memory, calls tools, and replies by text, asking for approval before anything that touches another person.

&#91;embedded content: architecture · 4 triggers, 1 agent, memory and tools\]

Triggers enter at the top, the agent sits in the middle between the text channel and memory, and tools hang below it. The notebook page reads the same database as the agent.

**One request, step by step**

1. A trigger fires: a schedule (7:30 AM briefing), a location ping, a text from the user, or a calendar change.
2. The agent loads context from Neon: goals, people, commitments, recent actions, and the seeded chats and fitness data.
3. It calls tools. Reads (calendar, email, search, travel time) run automatically.
4. It drafts a short reply. If the plan includes a write (calendar event, email to someone), the reply asks for approval first.
5. On "yes", it runs every approved action, writes each one to the action log with its reason, and texts the result.

## Tech stack

Each hackathon co-host tool does a real job in the product, so the sponsors are used because they are needed, not bolted on. Sponsor roles come from the event page; confirm connector coverage with the Executor team on site.

| Layer | Tool | Job in Chetam |
| --- | --- | --- |
| Agent framework | Mastra | Agent loop, tool calling, scheduled workflows for proactive texts, observability |
| Database | Neon Postgres | Memory: goals, people, commitments, seeded chats, fitness data, action log |
| Model access | Neon AI Gateway | LLM calls for reasoning and drafting |
| Tools and MCP | Executor | Gateway to Google Calendar, Gmail, and Drive tools, so adding an integration is mostly connecting a tool |
| Email to others | AgentMail | Chetam's own labeled inbox for emailing attendees and contacts |
| Web search | Exa | Niche gift research and on-demand lookups |
| Chat UI | Assistant UI | The notebook page: memory view, goals, action log |
| Hosting | Fly.io | Webhook server, scheduler, and optional MCP endpoint |
| iMessage | Sendblue or Linq | Two-way iMessage over webhooks, no Mac needed; check sandbox access or credits at the event |
| Travel time | Google Routes API (or a fixed value) | Leave-now calculation |
| Phone data | iPhone Shortcuts | Posts location to the server (or a fake toggle for the demo) |
| Optional | Kernel | Browser automation for the stretch refund flow |

**Build the agent channel-agnostic.** The agent core takes a text in and returns a text out. Start with a plain web chat, then plug the iMessage provider in as a thin adapter, so a provider delay never blocks the demo.

## Data model and agent tools

Six Neon tables hold everything Chetam knows, and about fifteen tools let the agent read and act. Keep both small: the demo needs these and nothing more.

**Neon tables**

| Table | Key columns | Notes |
| --- | --- | --- |
| users | id, name, phone, timezone, home\_location | One demo user is enough |
| goals | id, user\_id, title, metric, target, period | e.g. ship the app; 2,000 active calories per week; food under $150 per month |
| memories | id, user\_id, fact, source, created\_at, deleted | Editable and deletable from text and the notebook; "forget" sets deleted |
| threads | id, user\_id, contact, messages (JSON) | Seeded fake iMessage chats (Sam, Alex, Mom) |
| fitness\_log | id, user\_id, date, active\_calories, workout | Seeded JSON loaded into a table |
| actions | id, user\_id, type, summary, reason, approved, created\_at | The action log shown in the notebook |

Optional: transactions (date, merchant, amount, category) for the spending-vs-goals stretch feature.

**Agent tools**

| Tool | Type | Source |
| --- | --- | --- |
| get\_calendar(range) | Read | Google Calendar via Executor |
| create\_event(title, start, end) | Write, needs approval | Google Calendar via Executor |
| search\_threads(contact or query) | Read | Neon (seeded chats) |
| get\_fitness\_progress() | Read | Neon (seeded) |
| find\_drive\_file(query) | Read | Google Drive via Executor |
| send\_email(to, subject, body) | Write, needs approval | AgentMail (or Gmail via Executor) |
| web\_search(query) | Read | Exa |
| get\_travel\_time(origin, destination) | Read | Routes API or fixed value |
| get\_location() | Read | Shortcut ping or fake toggle |
| get\_goals() and get\_memories() | Read | Neon |
| add\_memory(fact) and forget\_memory(id) | Write, no approval needed (user's own data) | Neon |
| log\_action(type, summary, reason) | Write | Neon |
| propose\_actions(list) | Approval gate | Sends the bundle to the user and waits for "yes" |

**Approval gate:** the agent never calls a write tool that affects the calendar or another person directly. It calls propose\_actions with the bundle, texts the user a summary, and executes only on an affirmative reply.

## Real versus hardcoded

Build the agent loop, memory, and a few real actions for real; hardcode the inputs that are hard to get and do not change the story. Hackathon demos with seeded data are normal, as long as you say what is simulated. I have not seen this event's judging criteria, so ask an organizer or check the event page.

| Part | Decision | How |
| --- | --- | --- |
| Agent loop, tool calling, approval gate | Real | Mastra |
| Memory and action log | Real | Neon tables, persisted across messages |
| Texting with Chetam | Real | iMessage provider; web chat as fallback |
| Calendar blocks | Real | Google Calendar via Executor |
| Email to Sam and to Alex | Real | AgentMail, shown arriving in a real inbox |
| Drive file lookup | Real | Google Drive via Executor |
| Gift search | Real | Exa, run with the dad's interests as the query |
| Notebook page | Real | Assistant UI over Neon |
| Proactive triggers | Real, but fired on demand | Manual button or short timer so nobody waits until 3 PM |
| Other iMessage chats (Sam, Alex, Mom) | Hardcoded | Seeded threads, labeled as simulated |
| Fitness app data | Hardcoded | JSON with 1,100 of 2,000 active calories |
| Location and traffic | Hardcoded | Toggle with a fixed travel time; Shortcut as a bonus |
| Spending data | Hardcoded | Seeded transactions or text logging |

**What judges tend to punish:** faking the core agent without saying so, brittle live demos, and overclaiming. A hardcoded input that works every time beats a live integration that fails on stage.

**Line for the pitch:** "In this demo my other chats, fitness data, and location are simulated. The agent, memory, calendar, email, and search are live. Real chat and fitness access is next, and it will be opt-in."

## Demo

The demo is a two-minute screen recording of one iMessage thread, with Chetam texting first, plus two cut-aways (Alex's inbox and the notebook page). The persona is a sample user (a busy parent and app builder), so say that in the voiceover.

**Seed this data first**

| Source | Seeded content |
| --- | --- |
| Chat with Sam | Yesterday Sam texted "Can you send me the project doc by Friday?"; user replied "yep, will do." |
| Chat with Alex | "Let's meet at 4 tomorrow at the cafe on Market St." |
| Chat with Mom | "Don't forget Dad's birthday Saturday. He's been talking about his radio workshop all month." |
| Dad facts in memory | Restores vintage radios, drinks pour-over coffee, just started growing chili peppers; gift budget under $60 |
| Drive | A file named "Project Proposal v3" |
| Calendar | 8:15 AM school drop-off (recurring), free slot 9:30 to 10:30 AM, 4 PM with Alex (his email on the invite), a couple of other meetings, nothing blocked for the app on Thursday |
| Goals | Ship the app this month; 2,000 active calories per week; food under $150 per month |
| Fitness (simulated app) | 1,100 of 2,000 active calories so far, last workout 4 days ago |
| Location | Home, with the fake toggle ready; travel to the cafe 55 minutes at first, 65 minutes by 3 PM |

**Scene script.** Chetam's replies are targets for tone and content, not fixed wording. Keep every reply to one or two short lines in the real build; the morning briefing is the one longer message.

**Scene 1: Morning briefing (about 35 seconds, Chetam texts first)**

- **Chetam:** "Morning. Here's your day: 8:15 school drop-off, traffic is light, leave by 7:55. Your weekly goal is 2,000 active calories and your fitness app shows 1,100 with 4 days left, about 900 short. I added a plan on top of your schedule: gym 9:30 to 10:30 today, a 30 minute brisk walk Thursday evening, a Saturday morning session. 4 PM with Alex at the cafe on Market St, he confirmed in your chat last night. You told Sam you'd send the project doc by Friday, so I found it in your Drive and drafted the email. Want me to do all of that?"
- **You:** "yes do it"
- **Chetam:** "Done. Gym, walk, and Saturday session are on your calendar, the doc is on its way to Sam, and I'll text you at 7:50 to leave for school."
- Shows: chats read, calendar and fitness checked against goals, a catch-up plan, several real actions from one approval.

**Scene 2: Goal-aware plan (about 10 seconds)**

- **Chetam:** "You said shipping the app is your priority, but nothing is blocked for it this week. Want me to block Thursday 2 to 5?"
- **You:** "yes" → **Chetam:** "Done, it's on your calendar."

**Scene 3: Dad's birthday with niche gift search (about 20 seconds)**

- **Chetam:** "Your mom reminded you about your dad's birthday Saturday. Want me to add it to your calendar, remind you Friday evening, and look for gift ideas?"
- **You:** "yes, he's into radios, find something he'd actually want, not generic"
- **Chetam:** "Searching. He restores vintage radios and just started growing chilies, so I skipped the usual gift guides. Three under $60: 1) \[link\] vacuum tube tester or tube care kit, 2) \[link\] repair book with schematics for his era of radios, 3) \[link\] chili starter set with rare varieties. Save these to your notebook and remind you Friday to order?"
- **You:** "yes"
- Replace the \[link\] placeholders with real Exa results found before recording.

**Scene 4: Leave now, the star moment (about 25 seconds, around 3 PM in the story)**

- **Chetam:** "You're still at home and traffic got heavier. The cafe is now a 65 minute drive. Leave now to arrive around 3:55. Want me to tell Alex you may be a few minutes late?"
- **You:** "yes" → **Chetam:** "Sent. I emailed Alex from my assistant inbox."
- Cut to Alex's real inbox showing the email from "Chetam, assistant to Aidar".

**Scene 5: Quick lookup (about 8 seconds)**

- **You:** "what's the latest from Alex?" → **Chetam:** "He replied: no worries, see you at 4:10."

**Scene 6: Trust close (about 12 seconds)**

- **You:** "what do you know about me?"
- **Chetam:** "Your goals: ship the app, 2,000 active calories a week. You owe Sam a doc, and your dad's birthday is Saturday. Everything I know and every action I took is in my notebook."
- Cut to the notebook page: memory list with delete buttons, goals, and the action log showing each action with its reason.

**Stretch scene if time allows:** "how's my food budget?" → "$128 of $150 spent with 12 days left. Want me to plan a few cheaper meals?" then "spent $18 on lunch" → "Logged, you're at $146."

**Voiceover, one line per scene**

1. "CEOs have a personal assistant. Everyone else has a to-do list they ignore. Meet Chetam. He's read my chats, calendar, and fitness app, sees I'm 900 calories short, and with one yes handles the gym, the school run, and the doc I owe Sam."
2. "He knows my goals and plans around them."
3. "He catches what I'd forget and finds a gift that actually fits my dad."
4. "He tells me when to leave and handles the follow-up."
5. "I can ask him anything about my messages and email."
6. "And I can see everything he knows. Nothing goes out without my approval. My other chats, fitness data, and location are simulated in this demo; everything else is live."

**Recording tips**

- Pre-record and trim any pause longer than a second; fire the proactive triggers manually.
- Show the real inbox for the email to Alex so judges see it happened.
- Do not fake what you have not built. If location is flaky, use the toggle and say "simulated location."

## Build plan

Lock the demo scenario in the first hour, make the whole story work end to end with hardcoded inputs by the midpoint, then swap in real pieces one at a time. The event page lists a 9 AM to 7 PM day with teams of up to five; I do not know your team size or how many hours remain, so the split below assumes four people and uses elapsed hours, not clock times. Adjust it to your actual time.

**Roles (four people)**

| Role | Owns | First deliverable |
| --- | --- | --- |
| Agent lead | Mastra agent loop, approval gate, scheduled triggers, prompts | Agent answers a text and calls one tool end to end |
| Integrations | Executor connections (Calendar, Gmail, Drive), AgentMail, Exa, travel time | Create a real calendar event and send a real email from code |
| Channel and data | iMessage provider and webhook, Neon schema, seeded chats and fitness data | Text in, text out over iMessage (or web chat) with the seeded data loaded |
| Notebook and demo | Assistant UI notebook page, recording, voiceover, pitch | Notebook shows memory and action log from Neon |

With fewer people, the agent lead also takes the notebook, and integrations also takes the channel.

**Phases**

1. **Hour 0 to 1: lock the scenario.** Agree on the six demo scenes, create the Neon schema, load the seeded data, and get a plain web chat talking to a stub agent.
2. **Hour 1 to midpoint: story works with fakes.** The agent handles scenes 1 to 6 end to end with seeded inputs and logged actions. Nothing external is real yet except the model.
3. **Midpoint: cut line.** Check each scene. Anything not working gets cut or faked and labeled. Stretch features (spending, refund flow, extra MCP plug-ins) start only if every core scene passes.
4. **Midpoint to final stretch: go real, in this order.** Calendar writes, the real email to Alex, the Drive lookup and email to Sam, the Exa gift search, then iMessage (if it is still on web chat), then the Shortcut location ping.
5. **Last hour: freeze and record.** No new features. Rehearse the two-minute demo three times, record a backup video, and test the live path on the actual venue network.

**Definition of done for the demo**

- Scenes 1, 4, and 6 work live without manual fixing; these carry the pitch.
- A real calendar event appears and a real email lands in a real inbox.
- Every simulated input is labeled in the voiceover.
- A pre-recorded backup exists in case the live demo fails.

## Trust, safety, and guardrails

Chetam can read private data and message other people, so every guardrail below is a product feature and part of the pitch.

- **Approval before acting.** Anything that sends, changes, or contacts another person needs an explicit yes. Read-only lookups run automatically.
- **Visible, editable memory.** Users can ask what Chetam knows, correct it, or delete it by text or from the notebook. Deleted means gone.
- **Honest sender identity.** Emails to other people come from a labeled assistant inbox ("Chetam, assistant to Aidar"), not impersonating the user.
- **Untrusted content.** Text from emails, chats, documents, and web pages is data, never instructions. Tool results cannot give the agent commands. Emails and chats can contain injected instructions, so this rule is enforced in the prompt and by the approval gate.
- **Least privilege.** Each integration gets only the scopes it needs (calendar write, mail send, Drive read). Production would use scoped OAuth tokens stored encrypted.
- **Action log.** Every action is recorded with its reason and shown in the notebook.
- **Fitness.** Chetam reports numbers against goals the user set and suggests moderate catch-up plans. It is not medical advice, and it never pushes extreme targets or shames missed goals.
- **Money.** Information only, not financial advice. Chetam can track and remind but cannot pay for or buy anything. Spending data is the most sensitive data in the app and is never shared without approval.
- **Purchases.** Chetam finds and suggests items, and a human completes any purchase.
- **Reading other chats.** In production this is opt-in with explicit permission. Reading personal iMessage threads is not possible through an iMessage API provider, which only sees conversations with Chetam's number; a Mac bridge could do it but needs the user's Mac signed in to Messages. In this demo those threads are seeded and labeled as simulated.

## Risks, fallbacks, and roadmap

The biggest risks are iMessage setup time, flaky location, and scope creep; each has a cheap fallback.

| Risk | Likelihood | Fallback |
| --- | --- | --- |
| iMessage provider setup is slow or needs paid access | High | Build channel-agnostic, demo on web chat first, add iMessage if time allows; ask sponsors about credits |
| Location Shortcut is flaky | Medium | Fake location toggle with a fixed travel time; label it simulated |
| OAuth or connector setup for Calendar and Gmail eats hours | Medium | Ask the Executor team on site; pre-authorize one demo account early |
| Live email or calendar call fails on stage | Medium | Backup recording; rehearse on the venue network |
| Scope creep across integrations | High | Cut line at the midpoint; stretch features only after every core scene passes |
| Name "Chetam" is taken | Unknown | Check the name, domain, and handles before building branding |
| Overlap with existing products (folk, Poke) | Certain | Pitch the goal-aware, location-aware, finish-the-task angle, not "an AI that texts you" |

**Roadmap (say in the pitch, do not build today)**

- Real access to the user's own iMessage threads, opt-in, via a Mac bridge or device-side agent
- Fitness data from Apple Health or Strava
- Bank-linked spending through a provider's sandbox first, then production approval
- Chetam's memory as an MCP server, so other assistants can use it
- Multi-person features, like coordinating with a friend's assistant after both approve
