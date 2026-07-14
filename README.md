# tarx-palantir-connector

Open-source beachhead: **TARX-OS** (local-first sovereign AI runtime + bridge infrastructure) ↔ Palantir AIP Logic / Foundry.

Routes AIP Logic and OpenAI-compatible calls to **on-device inference** so enterprise data never needs a cloud middle layer for the runtime hop.

**Zero lock-in.** Open Enterprise/Gov weights path on the TARX side. Not a Palantir product. Not a clone of Apollo — an **open complementary beachhead** for operators who think in autonomous deployment / lifecycle terms.

## Status

- GitHub: https://github.com/tarx-ai/tarx-palantir-connector (public)
- License: Apache 2.0
- Claim-safe: **not affiliated with or endorsed by Palantir Technologies**

## Thesis (why this exists)

| Enterprise pain | TARX answer |
|-----------------|-------------|
| SaaS middleware tax on AI | Bridge infrastructure you control |
| Closed weight stacks | Zero lock-in; Enterprise/Gov open weights path |
| Cloud-only inference | Local-first OpenAI-compatible surface |
| Fleet / lifecycle thinking (Apollo-class) | TARX nodes/runtime as **sovereign units** you lifecycle-manage |

## One-line change

```typescript
// Before: cloud inference
const client = new OpenAI({ baseURL: "https://aip.palantir.com/v1" })

// After: TARX local — same API shape, data stays on device
const client = new OpenAI({
  baseURL: "http://127.0.0.1:11435/v1",
  apiKey: "none",
})
```

Default local surfaces (founder / product ports):

| Port | Role |
|------|------|
| `11435` | Prime model compat proxy (OpenAI-compatible) |
| `11440` | TARX bridge (health, product runtime) |
| `11443` | Local chat model (Computer) |

## Architecture

```
Palantir Foundry AIP Logic
    → Data Connection source "tarx-local"
    → 127.0.0.1:11435/v1/chat/completions  (OpenAI-compatible)
    → TARX-OS bridge + local inference (on device)
    → Optional Ontology sync via OSDK when connected
```

**Language note:** product docs say **bridge / runtime / Computer** — never “daemon.”

## Apollo-aware (conceptual)

If your org uses Apollo-class autonomous deployment & lifecycle:

- Treat each TARX install or certified **TARX on Machines** node as a **sovereign deployment unit**
- Map health canaries → lifecycle health
- Keep **private Supercomputer routing** off public connector docs

No live Apollo API is required for this beachhead.

## Foundry instance (this repo’s lab context)

- Org: tarx.usw-3.palantirfoundry.com  
- Ontology: TARX Ontology (lab)  
- Objects: example aviation objects for offline/sync experiments  

## Key files

| File | Purpose |
|------|---------|
| `examples/aip-logic-local-inference.ts` | AIP Logic → TARX local |
| `examples/osdk-offline-sync.ts` | Offline-first sync patterns |
| `config/data-connection-source.json` | REST API source config |

## DDIL matrix

| Scenario | Cloud AIP alone | TARX local | TARX + mesh (when peers exist) |
|----------|-----------------|------------|---------------------------------|
| Full connectivity | Yes | Yes | Yes |
| Degraded | Partial | Yes | Yes |
| No connectivity | No | Yes | Yes |
| Air-gapped | No | Yes | Yes |

## Related public / upcoming seeds

- `tarx-ai/tarx-os` — runtime / product surface  
- `tarx-ai/tarx-mcp` — MCP tether  
- `tarx-ai/tarx-hardware` — hardware program  
- `tarx-ai/tarx-weights` — weights policy docs (seed)  
- `tarx-ai/tarx-palantir` — umbrella beachhead docs (seed)

## Disclaimer

Not affiliated with or endorsed by Palantir Technologies.  
Integration uses public Data Connection / OSDK patterns.  
NVIDIA references (if any) mean **architectural influence** only — not partnership.
