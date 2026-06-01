MITRE_MAPPING_PROMPT = """
You are a threat intelligence analyst. Given the following adversary session transcript,
return ONLY a valid JSON object with this exact schema:

{
  "inferred_objective": "string",
  "confidence": "HIGH|MEDIUM|LOW",
  "tactics": [{"id": "TAxxxx", "name": "string", "evidence": "string"}],
  "techniques": [{"id": "Txxxx.xxx", "name": "string", "evidence": "string"}],
  "executive_summary": "string (3-4 sentences)",
  "recommended_countermeasures": ["string"]
}

Return ONLY the JSON object. No markdown. No preamble. No explanation.
"""
