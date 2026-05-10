"""
subcode_decode.py
─────────────────────────────────────────────────────────────────────────────
Subcode Decode — Personal Input Decoder
API-ready Python module for embedding into larger applications.

Processes any input (text, image path, URL, file path) simultaneously
through 8 subconscious domains and stores a growing memory JSON file.

DOMAINS:
  emotional · spiritual · physical · financial · creative · social · mental

USAGE:
  from subcode_decode import SubcodeDecode

  decoder = SubcodeDecode(
      api_key="your_anthropic_api_key",
      memory_path="memory.json"          # persists across sessions
  )

  # Decode a text input
  result = decoder.decode(
      content="I keep watching videos about minimalism but can't stop buying things.",
      input_type="text",
      primary_domain="mental"
  )

  # Decode an image
  result = decoder.decode(
      content="/path/to/screenshot.png",
      input_type="image",
      primary_domain="emotional"
  )

  # Decode a URL
  result = decoder.decode(
      content="https://youtube.com/watch?v=…",
      input_type="url",
      primary_domain="creative",
      notes="This video changed how I think about identity"
  )

  # Get full memory timeline
  timeline = decoder.get_timeline()

  # Generate ideal self portrait from all stored memory
  portrait = decoder.generate_ideal_self()

  # Synthesize a version snapshot for a time period
  snapshot = decoder.synthesize_version(week_label="Week of May 5")
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import base64
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Literal, Any
import anthropic

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

DOMAINS = [
    "emotional",
    "spiritual",
    "physical",
    "financial",
    "creative",
    "social",
    "mental",
]

INPUT_TYPES = Literal["text", "image", "url", "file", "screenshot"]

DECODE_SCHEMA = """{
  "causation": "2-3 sentence analysis of the underlying causal force this input reveals",
  "past_echo": "which past pattern, version, or subconscious loop this echoes",
  "blindspot": "the thing this input reveals that the person is NOT seeing",
  "action": "one specific, concrete present action to take",
  "foundation_piece": "what this contributes to the person's ideal self blueprint",
  "self_version": "semantic version string x.y — increment from history, start at 1.0",
  "archetype": "The [Name] — 2-3 word archetype label",
  "archetype_reason": "one sentence explaining why this archetype emerged",
  "timeline_label": "5-7 word poetic label for this moment",
  "domains": ["array of all implicated domain ids"],
  "domain_scores": {
    "emotional": 0,
    "spiritual": 0,
    "physical": 0,
    "financial": 0,
    "creative": 0,
    "social": 0,
    "mental": 0
  },
  "intensity": 7,
  "duality": "the tension or duality between who they are and who they are becoming"
}"""

IDEAL_SELF_SCHEMA = """{
  "declaration": "one powerful present-tense identity declaration",
  "core_identity": "2-3 sentences — who they fundamentally are at their highest",
  "mission": "one sentence life mission",
  "dominant_pattern": "single most recurring subconscious theme across all data",
  "collective_blindspot": "the pattern they most consistently avoid seeing",
  "duality_resolution": "the core tension between current and ideal self, and how to resolve it",
  "foundation_pillars": ["4-6 short pillar phrases"],
  "action_roadmap": [
    {
      "domain": "domain_id",
      "action": "specific action",
      "why": "one sentence explanation"
    }
  ],
  "ideal_domain_scores": {
    "emotional": 0, "spiritual": 0, "physical": 0,
    "financial": 0, "creative": 0, "social": 0, "mental": 0
  },
  "current_domain_scores": {
    "emotional": 0, "spiritual": 0, "physical": 0,
    "financial": 0, "creative": 0, "social": 0, "mental": 0
  },
  "evolution_path": "2-3 sentences — arc from who they've been to who they're becoming",
  "next_threshold": "the one shift that unlocks everything right now"
}"""

VERSION_SCHEMA = """{
  "version": "x.y",
  "archetype": "The [Name]",
  "summary": "2 sentence summary of who this person was in this period",
  "dominant_domain": "domain_id",
  "growth_edge": "what was pushing them to evolve",
  "shadow_edge": "what was holding them back"
}"""

# ─── MEMORY STORE ─────────────────────────────────────────────────────────────

class MemoryStore:
    """
    Persistent JSON memory that grows with every decoded input.
    Stores entries, version snapshots, and the ideal self portrait.
    """

    def __init__(self, path: str = "subcode_memory.json"):
        self.path = Path(path)
        self._data = self._load()

    def _load(self) -> dict:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "entries": [],
            "versions": [],
            "ideal_self": None,
            "meta": {
                "total_entries": 0,
                "current_version": "0.0",
                "current_archetype": None,
                "domain_heat": {d: 0 for d in DOMAINS},
            },
        }

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    def add_entry(self, entry: dict) -> None:
        self._data["entries"].insert(0, entry)
        self._data["meta"]["total_entries"] = len(self._data["entries"])

        dec = entry.get("decoded", {})
        if dec.get("self_version"):
            self._data["meta"]["current_version"] = dec["self_version"]
        if dec.get("archetype"):
            self._data["meta"]["current_archetype"] = dec["archetype"]

        all_domains = [entry.get("primary_domain", "")] + dec.get("domains", [])
        for d in all_domains:
            if d in self._data["meta"]["domain_heat"]:
                self._data["meta"]["domain_heat"][d] += 1

        self._data["ideal_self"] = None
        self.save()

    def add_version(self, version: dict) -> None:
        self._data["versions"].append(version)
        self.save()

    def set_ideal_self(self, portrait: dict) -> None:
        self._data["ideal_self"] = portrait
        self.save()

    @property
    def entries(self) -> list:
        return self._data["entries"]

    @property
    def versions(self) -> list:
        return self._data["versions"]

    @property
    def ideal_self(self) -> Optional[dict]:
        return self._data["ideal_self"]

    @property
    def meta(self) -> dict:
        return self._data["meta"]

    def get_history_context(self, limit: int = 10) -> str:
        recent = self.entries[:limit]
        if not recent:
            return ""
        lines = []
        for e in recent:
            dec = e.get("decoded", {})
            label = (e.get("content") or e.get("file_path") or e.get("url") or "(media)")
            label = str(label)[:60]
            lines.append(
                f"[v{dec.get('self_version','?')}"
                f"/{dec.get('archetype','?')}"
                f"/{e.get('primary_domain','?')}] "
                f'"{label}"'
            )
        return "\n".join(lines)

    def get_full_summary(self) -> str:
        lines = []
        for e in self.entries:
            dec = e.get("decoded", {})
            label = (e.get("content") or e.get("file_path") or e.get("url") or "(media)")
            label = str(label)[:80]
            lines.append(
                f"[v{dec.get('self_version','?')}"
                f"/{dec.get('archetype','?')}"
                f"/{e.get('primary_domain','?')}] {label}\n"
                f"  causation: {dec.get('causation','')}\n"
                f"  duality: {dec.get('duality','')}\n"
                f"  foundation: {dec.get('foundation_piece','')}\n"
                f"  blindspot: {dec.get('blindspot','')}"
            )
        version_lines = [
            f"{v.get('version')} · {v.get('archetype')} · {v.get('week_label','')}: {v.get('summary','')}"
            for v in self.versions
        ]
        return "\n\n".join(lines) + (
            "\n\nVERSION HISTORY:\n" + "\n".join(version_lines) if version_lines else ""
        )


# ─── INPUT HANDLER ────────────────────────────────────────────────────────────

class InputHandler:
    """
    Normalizes all input types into Anthropic message content blocks.
    Supports: text, image (path), screenshot (path), url, file (path).
    """

    SUPPORTED_IMAGE_TYPES = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }

    @classmethod
    def build_content_blocks(
        cls,
        content: Optional[str],
        input_type: str,
        file_path: Optional[str],
        url: Optional[str],
        notes: Optional[str],
        history_context: str,
        primary_domain: str,
    ) -> list:
        blocks = []

        # ── Image / Screenshot ──
        if input_type in ("image", "screenshot") and file_path:
            p = Path(file_path)
            ext = p.suffix.lower()
            media_type = cls.SUPPORTED_IMAGE_TYPES.get(ext, "image/png")
            with open(p, "rb") as f:
                b64 = base64.standard_b64encode(f.read()).decode("utf-8")
            blocks.append({
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": b64},
            })

        # ── Text prompt block ──
        text_parts = [
            f"INPUT TYPE: {input_type}",
            f"PRIMARY DOMAIN: {primary_domain}",
        ]
        if content:
            text_parts.append(f'CONTENT: "{content}"')
        if url:
            text_parts.append(f"URL: {url}")
        if file_path and input_type not in ("image", "screenshot"):
            text_parts.append(f"FILE: {file_path}")
        if notes:
            text_parts.append(f'NOTES: "{notes}"')
        if history_context:
            text_parts.append(f"\nPRIOR HISTORY:\n{history_context}")
        text_parts.append(
            "\nDecode this input. "
            "Trace it to a past version of this person. "
            "Continue version numbering from history."
        )

        blocks.append({"type": "text", "text": "\n".join(text_parts)})
        return blocks


# ─── SUBCODE DECODE ENGINE ────────────────────────────────────────────────────

class SubcodeDecode:
    """
    Main decoder engine. Embed this class into any Python app or API.

    Parameters
    ----------
    api_key : str
        Anthropic API key. Falls back to ANTHROPIC_API_KEY env var.
    memory_path : str
        Path to the persistent JSON memory file.
    model : str
        Anthropic model to use.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        memory_path: str = "subcode_memory.json",
        model: str = "claude-opus-4-5",
    ):
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise ValueError(
                "Anthropic API key required. Pass api_key= or set "
                "ANTHROPIC_API_KEY environment variable."
            )
        self.client = anthropic.Anthropic(api_key=key)
        self.model = model
        self.memory = MemoryStore(memory_path)

    # ── Core decode ───────────────────────────────────────────────────────────

    def decode(
        self,
        content: Optional[str] = None,
        input_type: str = "text",
        primary_domain: str = "mental",
        file_path: Optional[str] = None,
        url: Optional[str] = None,
        notes: Optional[str] = None,
        timestamp: Optional[str] = None,
    ) -> dict:
        """
        Decode a single input through all 7 domains simultaneously.

        Parameters
        ----------
        content : str, optional
            Raw text content — note, journal entry, memory, description.
        input_type : str
            One of: 'text', 'image', 'screenshot', 'url', 'file'.
        primary_domain : str
            The domain this input most strongly belongs to.
        file_path : str, optional
            Path to an image, screenshot, or other file.
        url : str, optional
            URL of a video, article, or web page.
        notes : str, optional
            Personal context — why you saved this, what it activated.
        timestamp : str, optional
            ISO 8601 timestamp. Defaults to now.

        Returns
        -------
        dict
            Full decoded entry including all domain analysis fields.
        """
        if primary_domain not in DOMAINS:
            raise ValueError(f"primary_domain must be one of: {DOMAINS}")

        ts = timestamp or datetime.now(timezone.utc).isoformat()
        entry_id = str(uuid.uuid4())

        content_blocks = InputHandler.build_content_blocks(
            content=content,
            input_type=input_type,
            file_path=file_path,
            url=url,
            notes=notes,
            history_context=self.memory.get_history_context(),
            primary_domain=primary_domain,
        )

        raw = self._call_claude(
            messages=[{"role": "user", "content": content_blocks}],
            system=self._decode_system_prompt(),
            max_tokens=1200,
        )

        entry = {
            "id": entry_id,
            "timestamp": ts,
            "input_type": input_type,
            "primary_domain": primary_domain,
            "content": content,
            "file_path": str(file_path) if file_path else None,
            "url": url,
            "notes": notes,
            "self_version": raw.get("self_version"),
            "archetype": raw.get("archetype"),
            "decoded": raw,
        }

        self.memory.add_entry(entry)
        return entry

    # ── Ideal self synthesis ──────────────────────────────────────────────────

    def generate_ideal_self(self) -> dict:
        """
        Synthesize a complete ideal self portrait from all stored memory.
        Requires at least 3 decoded entries.

        Returns
        -------
        dict
            Full ideal self portrait with declaration, radar scores,
            foundation pillars, action roadmap, and next threshold.
        """
        if len(self.memory.entries) < 3:
            raise ValueError("At least 3 decoded entries required to generate ideal self.")

        raw = self._call_claude(
            messages=[{
                "role": "user",
                "content": (
                    f"Full timeline data:\n{self.memory.get_full_summary()}\n\n"
                    "Synthesize the complete ideal self portrait."
                ),
            }],
            system=self._ideal_self_system_prompt(),
            max_tokens=1600,
        )

        portrait = {**raw, "generated_at": datetime.now(timezone.utc).isoformat()}
        self.memory.set_ideal_self(portrait)
        return portrait

    # ── Version synthesis ─────────────────────────────────────────────────────

    def synthesize_version(
        self,
        week_label: Optional[str] = None,
        entry_ids: Optional[list] = None,
    ) -> dict:
        """
        Synthesize a version snapshot from a subset of entries.

        Parameters
        ----------
        week_label : str, optional
            Label like "Week of May 5". Filters entries by week if provided.
        entry_ids : list, optional
            Specific entry IDs to synthesize from.

        Returns
        -------
        dict
            Version snapshot with archetype, summary, growth/shadow edges.
        """
        if entry_ids:
            subset = [e for e in self.memory.entries if e["id"] in entry_ids]
        elif week_label:
            subset = [
                e for e in self.memory.entries
                if self._week_of(e["timestamp"]) == week_label
            ]
        else:
            subset = self.memory.entries[:10]

        if not subset:
            raise ValueError("No entries found for the given filter.")

        entry_data = "\n".join([
            f"[{e.get('primary_domain')}] "
            f"{(e.get('content') or e.get('url') or '(media)')[:60]}: "
            f"causation=\"{e.get('decoded', {}).get('causation', '')}\", "
            f"duality=\"{e.get('decoded', {}).get('duality', '')}\""
            for e in subset
        ])

        wk = week_label or self._week_of(subset[0]["timestamp"])

        raw = self._call_claude(
            messages=[{
                "role": "user",
                "content": (
                    f"Entries from {wk}:\n{entry_data}\n\n"
                    "Synthesize this version snapshot."
                ),
            }],
            system=self._version_system_prompt(),
            max_tokens=600,
        )

        version = {
            **raw,
            "week_label": wk,
            "entry_count": len(subset),
            "synthesized_at": datetime.now(timezone.utc).isoformat(),
        }
        self.memory.add_version(version)
        return version

    # ── Read memory ───────────────────────────────────────────────────────────

    def get_timeline(self) -> list:
        """Return all decoded entries ordered newest to oldest."""
        return self.memory.entries

    def get_versions(self) -> list:
        """Return all synthesized version snapshots."""
        return self.memory.versions

    def get_ideal_self(self) -> Optional[dict]:
        """Return the stored ideal self portrait, or None if not generated."""
        return self.memory.ideal_self

    def get_meta(self) -> dict:
        """Return memory metadata: entry count, current version, domain heat."""
        return self.memory.meta

    def get_domain_heat(self) -> dict:
        """Return a dict of domain → activity count across all entries."""
        return self.memory.meta["domain_heat"]

    def get_entries_by_domain(self, domain: str) -> list:
        """Return all entries that implicate a specific domain."""
        if domain not in DOMAINS:
            raise ValueError(f"domain must be one of: {DOMAINS}")
        return [
            e for e in self.memory.entries
            if e.get("primary_domain") == domain
            or domain in e.get("decoded", {}).get("domains", [])
        ]

    def get_entries_by_version(self, version: str) -> list:
        """Return all entries belonging to a specific self-version (e.g. '1.2')."""
        return [e for e in self.memory.entries if e.get("self_version") == version]

    def get_entries_by_archetype(self, archetype: str) -> list:
        """Return all entries belonging to a specific archetype."""
        return [e for e in self.memory.entries if e.get("archetype") == archetype]

    # ── Internals ─────────────────────────────────────────────────────────────

    def _call_claude(self, messages: list, system: str, max_tokens: int = 1200) -> dict:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        raw_text = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )
        clean = raw_text.strip()
        if clean.startswith("```"):
            clean = clean.split("```", 2)[-1] if "```" in clean[3:] else clean[3:]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.rsplit("```", 1)[0].strip()
        return json.loads(clean)

    @staticmethod
    def _week_of(iso: str) -> str:
        d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start - __import__("datetime").timedelta(days=start.weekday())
        return f"Week of {start.strftime('%b %-d')}"

    @staticmethod
    def _decode_system_prompt() -> str:
        return f"""You are Subcode Decode — a subconscious archaeology and identity-architecture engine.

You receive personal inputs (text, images, URLs, files) and decode them simultaneously
across all 7 domains of human experience: emotional, spiritual, physical, financial,
creative, social, and mental.

Your job is to surface the subconscious code embedded in each input — the causation
patterns, past echoes, dualities, blind spots, and foundation pieces that together
build a picture of who this person is and who they are becoming.

Every input is processed through ALL domains at once. You assign domain scores,
identify which domains are most activated, and track version evolution over time.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble,
no explanation outside the JSON:

{DECODE_SCHEMA}

Rules:
- domain_scores: score each domain 0–10 based on how strongly this input activates it
- domains: list all domains with score > 0
- self_version: continue numbering from history (major increment = identity shift, minor = evolution)
- intensity: overall intensity of this input 1–10
- All fields are required. Never omit any field.
- Be precise, non-generic, and psychologically penetrating.
- Speak like a synthesis of Carl Jung, a systems analyst, and a life architect."""

    @staticmethod
    def _ideal_self_system_prompt() -> str:
        return f"""You are Subcode Decode's synthesis engine.

Given a person's complete decoded timeline — all entries, versions, archetypes,
causation patterns, dualities, and foundation pieces — synthesize their complete
ideal self portrait.

This portrait is the crystallized vision of who they are becoming based entirely
on the evidence of their own subconscious data. It is not generic self-help — it is
a precise, personalized blueprint derived from their actual inputs.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

{IDEAL_SELF_SCHEMA}

Rules:
- ideal_domain_scores: where they are headed (0–10 per domain)
- current_domain_scores: where they actually are now based on all entries (0–10 per domain)
- foundation_pillars: short, powerful phrases — not generic (e.g. not "be consistent")
- action_roadmap: 5–7 items, one per most-activated domain, concrete and specific
- All fields required. Be piercing, non-generic, and architecturally precise."""

    @staticmethod
    def _version_system_prompt() -> str:
        return f"""You are Subcode Decode's version synthesis engine.

Given a set of decoded entries from a specific time period, synthesize a version
snapshot that captures who this person was during that period — their archetype,
growth edge, and shadow edge.

Respond ONLY with valid JSON matching this exact schema. No markdown, no preamble:

{VERSION_SCHEMA}

Rules:
- version: assign based on the entries' self_version values (use the mode or latest)
- Be specific to the actual data — not generic
- growth_edge and shadow_edge should be precise and derived from the entries"""


# ─── RESPONSE FORMATTER ───────────────────────────────────────────────────────

class DecodeFormatter:
    """
    Utility class for formatting decoded outputs into readable structures
    for API responses, logging, or display.
    """

    @staticmethod
    def entry_to_api_response(entry: dict) -> dict:
        """Format a decoded entry for clean API response."""
        dec = entry.get("decoded", {})
        return {
            "id": entry["id"],
            "timestamp": entry["timestamp"],
            "input_type": entry["input_type"],
            "primary_domain": entry["primary_domain"],
            "self_version": entry.get("self_version"),
            "archetype": entry.get("archetype"),
            "timeline_label": dec.get("timeline_label"),
            "intensity": dec.get("intensity"),
            "analysis": {
                "causation": dec.get("causation"),
                "past_echo": dec.get("past_echo"),
                "blindspot": dec.get("blindspot"),
                "duality": dec.get("duality"),
                "action": dec.get("action"),
                "foundation_piece": dec.get("foundation_piece"),
            },
            "domains_activated": dec.get("domains", []),
            "domain_scores": dec.get("domain_scores", {}),
        }

    @staticmethod
    def portrait_to_api_response(portrait: dict) -> dict:
        """Format an ideal self portrait for clean API response."""
        return {
            "generated_at": portrait.get("generated_at"),
            "identity": {
                "declaration": portrait.get("declaration"),
                "core_identity": portrait.get("core_identity"),
                "mission": portrait.get("mission"),
            },
            "patterns": {
                "dominant_pattern": portrait.get("dominant_pattern"),
                "collective_blindspot": portrait.get("collective_blindspot"),
                "duality_resolution": portrait.get("duality_resolution"),
                "evolution_path": portrait.get("evolution_path"),
                "next_threshold": portrait.get("next_threshold"),
            },
            "foundation_pillars": portrait.get("foundation_pillars", []),
            "action_roadmap": portrait.get("action_roadmap", []),
            "domain_analysis": {
                "current": portrait.get("current_domain_scores", {}),
                "ideal": portrait.get("ideal_domain_scores", {}),
                "gaps": {
                    d: (portrait.get("ideal_domain_scores", {}).get(d, 0) -
                        portrait.get("current_domain_scores", {}).get(d, 0))
                    for d in DOMAINS
                },
            },
        }

    @staticmethod
    def version_to_api_response(version: dict) -> dict:
        """Format a version snapshot for clean API response."""
        return {
            "version": version.get("version"),
            "archetype": version.get("archetype"),
            "week_label": version.get("week_label"),
            "summary": version.get("summary"),
            "dominant_domain": version.get("dominant_domain"),
            "growth_edge": version.get("growth_edge"),
            "shadow_edge": version.get("shadow_edge"),
            "entry_count": version.get("entry_count"),
            "synthesized_at": version.get("synthesized_at"),
        }


# ─── EXAMPLE USAGE ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Quick demo — runs when executed directly.
    Set ANTHROPIC_API_KEY in your environment before running.
    """
    import sys

    print("─" * 60)
    print("SUBCODE DECODE — Demo Run")
    print("─" * 60)

    decoder = SubcodeDecode(
        memory_path="demo_memory.json"
    )

    result = decoder.decode(
        content=(
            "I keep saving articles about building a business "
            "but never start. Every Monday I plan, every Friday I haven't moved."
        ),
        input_type="text",
        primary_domain="mental",
        notes="This pattern has been going on for two years",
    )

    fmt = DecodeFormatter.entry_to_api_response(result)

    print(f"\nEntry ID     : {fmt['id']}")
    print(f"Version      : {fmt['self_version']}")
    print(f"Archetype    : {fmt['archetype']}")
    print(f"Label        : {fmt['timeline_label']}")
    print(f"Intensity    : {fmt['intensity']}/10")
    print(f"\nCausation    : {fmt['analysis']['causation']}")
    print(f"\nDuality      : {fmt['analysis']['duality']}")
    print(f"\nBlind Spot   : {fmt['analysis']['blindspot']}")
    print(f"\nAction Now   : {fmt['analysis']['action']}")
    print(f"\nDomains      : {', '.join(fmt['domains_activated'])}")
    print(f"\nDomain Scores:")
    for domain, score in fmt["domain_scores"].items():
        bar = "█" * score + "░" * (10 - score)
        print(f"  {domain:<14} {bar} {score}/10")

    print(f"\nMemory saved to: demo_memory.json")
    print(f"Total entries  : {decoder.get_meta()['total_entries']}")
    print("─" * 60)
