# nps-el-repo — Project Mirage

Autonomous cyber deception honeypot with real-time threat dashboard (NPS Network Security Lab).

## Quick start

```bash
cp mirage/.env.example mirage/.env
# Add ANTHROPIC_API_KEY to mirage/.env

docker compose -f mirage/docker-compose.yml up --build
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| API / WebSocket | http://localhost:8000 |
| Honeypot ingress | http://localhost:8080 |

See [mirage/README.md](mirage/README.md) and [CLAUDE.md](CLAUDE.md) for architecture and demo scripts.
