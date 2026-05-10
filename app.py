"""
FastAPI entrypoint for Vercel deployment.
Set ANTHROPIC_API_KEY as an environment variable in your Vercel project settings.
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from subcode_decode import SubcodeDecode, DecodeFormatter, DOMAINS

app = FastAPI(
    title="Subcode Decode API",
    description="Personal Input Decoder — processes inputs through 7 subconscious domains.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MEMORY_PATH = "/tmp/subcode_memory.json"


def get_decoder() -> SubcodeDecode:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured.")
    return SubcodeDecode(api_key=key, memory_path=MEMORY_PATH)


# ── Request models ────────────────────────────────────────────────────────────

class DecodeRequest(BaseModel):
    content: Optional[str] = None
    input_type: str = "text"
    primary_domain: str = "mental"
    url: Optional[str] = None
    notes: Optional[str] = None
    timestamp: Optional[str] = None


class VersionRequest(BaseModel):
    week_label: Optional[str] = None
    entry_ids: Optional[list] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "Subcode Decode API",
        "version": "1.0.0",
        "domains": DOMAINS,
        "endpoints": ["/decode", "/ideal-self", "/version", "/timeline", "/meta", "/domain-heat"],
    }


@app.post("/decode")
def decode(req: DecodeRequest):
    decoder = get_decoder()
    try:
        entry = decoder.decode(
            content=req.content,
            input_type=req.input_type,
            primary_domain=req.primary_domain,
            url=req.url,
            notes=req.notes,
            timestamp=req.timestamp,
        )
        return DecodeFormatter.entry_to_api_response(entry)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ideal-self")
def ideal_self():
    decoder = get_decoder()
    try:
        portrait = decoder.generate_ideal_self()
        return DecodeFormatter.portrait_to_api_response(portrait)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/version")
def synthesize_version(req: VersionRequest):
    decoder = get_decoder()
    try:
        version = decoder.synthesize_version(
            week_label=req.week_label,
            entry_ids=req.entry_ids,
        )
        return DecodeFormatter.version_to_api_response(version)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/timeline")
def timeline():
    decoder = get_decoder()
    return {"entries": decoder.get_timeline()}


@app.get("/meta")
def meta():
    decoder = get_decoder()
    return decoder.get_meta()


@app.get("/domain-heat")
def domain_heat():
    decoder = get_decoder()
    return decoder.get_domain_heat()


@app.get("/domain/{domain}")
def entries_by_domain(domain: str):
    decoder = get_decoder()
    try:
        return {"entries": decoder.get_entries_by_domain(domain)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
