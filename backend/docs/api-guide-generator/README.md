# API guide generator

Rebuilds `docs/ChangeCars_Backend_API_Guide.pdf` from the running backend, so the
endpoint reference always matches the code.

Requirements: Python 3.10+ with `pip install reportlab pypdf`, Windows fonts
(Segoe UI, Consolas; change the `FONTS` path in `build_guide.py` on Linux/macOS),
a built backend (`npm run build`) running with demo data (`SEED_DEMO=true npm run db:seed`).

```bash
cd docs/api-guide-generator
curl -s http://localhost:4000/docs/openapi.json -o openapi.json
node extract-access.js ../.. access.json          # access rules from compiled controllers
node capture-samples.mjs samples.json             # real responses (needs the API + demo data)
# errors.json: error codes collected from src (see the guide's appendix A)
python build_guide.py ../ChangeCars_Backend_API_Guide.pdf
```

Write the narrative chapters in `build_guide.py`. Write descriptions for endpoints that have
no `@ApiOperation` summary in `summaries.py`.
