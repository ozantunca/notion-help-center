# I vibe coded my way out of a SaaS subscription

The renewal email arrived like it always does. Predictable, polite, no surprises. Four years of HelpKit, four years of a help center that just worked, and now another invoice waiting for my approval.

I hovered over the pay button for a second. Then I opened a new project instead.

---

## First, let me praise HelpKit

This isn't a takedown. HelpKit is genuinely great software, and if you want a hosted help center built on Notion, you should use it. I did — happily — for four years.

The setup is fast, the design is clean, and it just works. You write in Notion, HelpKit publishes it. No servers, no maintenance, no babysitting. The team clearly cares about the product. I recommended it to people without hesitation. I still would.

But when the renewal came this time, something felt different. Not because HelpKit got worse — it didn't. More because I had a nagging curiosity I wanted to scratch. *Could I build this myself?* And a new word had crept into my vocabulary that made that question feel less intimidating than it used to.

---

## Vibe coding a replacement

If you haven't heard the term, "vibe coding" is programming with an AI as your primary collaborator — less writing code line by line, more describing what you want and steering the output. It's fast, exploratory, and a little chaotic in the best possible way. You stay in flow because the slow parts (boilerplate, plumbing, googling API signatures) mostly disappear.

I'd been curious about trying it on something real — not a toy, not a tutorial, but an actual project I'd actually use. HelpKit's renewal was the forcing function. My curiosity was the fuel.

So I started describing what I wanted: a help center that reads from Notion, renders fast, looks good, and lives on my own infrastructure. Claude did most of the heavy lifting. I directed, reviewed, corrected, redirected. It took a weekend.

---

## What I built

**[notion-help-center](https://github.com/ozantunca/notion-help-center)** is an open-source, self-hosted help center powered by Notion and Next.js.

The core idea is simple: you keep writing content in Notion, exactly like you always have. The app pulls your collections and articles into a local SQLite database, converts them to markdown, and serves them as a fast, clean help center on your own domain.

A few things I made sure to include:

- **Full-text search** — powered by Lunr.js, index precomputed at sync time
- **Article feedback** — readers can rate articles; ratings land in the database
- **Admin UI at `/admin`** — upload a logo, set brand colors, edit nav links — all without touching code
- **Docker-ready** — persistent volumes for data and media, a `docker-compose.example.yml` to get started
- **No platform lock-in** — Apache-2.0, your domain, your data, no recurring bill

The sync is a single command:

```bash
npm run sync
```

That fetches everything from Notion, converts pages to markdown, downloads and rehooves images, and builds the search index. Run it locally during development, or wire it into your build pipeline.

For a quick local preview without connecting Notion at all:

```bash
npm install && npm run seed && npm run dev
```

---

## How it works

1. You maintain a knowledge base in a Notion database (the [HelpKit Knowledge Base Template](https://helpkit.notion.site/HelpKit-Knowledge-Base-Academy-Template-32b504ebbf8a4a31baa2637f1ea24490) works perfectly)
2. `npm run sync` pulls your collections and articles into SQLite, converts Notion blocks to markdown
3. Next.js serves pages server-side from that SQLite database
4. Deploy once with Docker; write in Notion forever

You can see it live at **[help.wavevisual.com](https://help.wavevisual.com)**.

---

## The result

I have a help center running on my own infrastructure, on my own domain, for zero recurring cost. It does everything HelpKit did for me. I can extend it whenever I want because I own the code. And I built it in a weekend.

None of that would have felt realistic a few years ago. Now it does — and that's the more interesting story here. Vibe coding didn't just save me a subscription fee. It changed my sense of what's tractable for a solo developer to build and own.

---

## If this sounds useful to you

If you're running a Notion-based team and paying for a hosted help center, this might be worth a look.

The repo is at **[github.com/ozantunca/notion-help-center](https://github.com/ozantunca/notion-help-center)**. Issues and PRs are welcome. If you build something with it, I'd love to hear about it.

And if you'd rather not self-host — seriously, go use HelpKit.
