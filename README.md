# TechNexus — AWS Modernization Workshop Project

A technology-partner intelligence dashboard for maritime tech scouting
(rebuilt from a single-file HTML prototype into a real 3-tier app), used as
the practice application for the Kuok Group AWS Modernization Workshop
(Git/GitHub → CloudFormation → CodePipeline/CodeBuild → Dev/UAT promotion).

## Architecture

```
                        ┌─────────────┐
   Browser  ───────────▶│  CloudFront │──▶ S3 (React build, static)
                        └─────────────┘
                               │
                               ▼ (fetch /api/*)
                        ┌─────────────┐
                        │     ALB     │
                        └─────────────┘
                               │
                        ┌─────────────┐
                        │ ECS Fargate │──▶ Node/Express API
                        │  (backend)  │       │
                        └─────────────┘       ▼
                               │        Anthropic API
                               ▼        (web search + Claude,
                        ┌─────────────┐  server-side key only)
                        │ RDS Postgres│
                        └─────────────┘
```

- **Frontend**: React + Vite, built to static files, served from S3 via CloudFront
- **Backend**: Node/Express on ECS Fargate behind an ALB. Holds the real
  `ANTHROPIC_API_KEY` (from Secrets Manager) so the browser never sees it —
  this replaces the original artifact's client-side `fetch()` to
  `api.anthropic.com`, which only worked inside Claude's own artifact sandbox.
- **Database**: RDS PostgreSQL, private subnets only
- **Infra**: Raw CloudFormation (matches Day 2 of the workshop)
- **CI/CD**: CodePipeline + CodeBuild + CodeConnections, Dev → manual
  approval → UAT (matches Day 3)

## Repository layout

```
frontend/            React + Vite app
backend/              Node/Express API
infra/
  cloudformation/     01-network, 02-database, 03-backend-ecs,
                      04-frontend-hosting, 05-pipeline
  buildspec-build.yml   CodeBuild: test, build, push image, build frontend
  buildspec-deploy.yml  CodeBuild: deploy stacks, sync S3, invalidate CDN
docker-compose.yml    Local dev (mirrors prod topology)
```

## Local development

```bash
cp backend/.env.example backend/.env   # fill in a real ANTHROPIC_API_KEY
docker compose up --build
# API:  http://localhost:3000
# then, in another terminal:
cd backend && npm run seed             # loads the ~30 seed companies
cd frontend && npm install && npm run dev
# App: http://localhost:5173
```

## Deploying to AWS (manual prerequisites — one-time, per environment)

CloudFormation can't do everything: a few things need to exist first because
they require interactive/manual steps (OAuth handshake, secret material).

1. **Authorize a GitHub connection** (once per AWS account):
   ```bash
   aws codeconnections create-connection --provider-type GitHub --connection-name technexus-github
   ```
   Then open the connection in the AWS Console and click "Update pending
   connection" to complete the GitHub OAuth handshake. Copy the resulting
   ARN — this is `ConnectionArn` for the pipeline stack.

2. **Create the Anthropic API key secret**, once per environment:
   ```bash
   aws secretsmanager create-secret --name technexus/dev/anthropic-api-key \
     --secret-string '{"ANTHROPIC_API_KEY":"sk-ant-..."}'
   aws secretsmanager create-secret --name technexus/uat/anthropic-api-key \
     --secret-string '{"ANTHROPIC_API_KEY":"sk-ant-..."}'
   ```
   Copy the ARNs — these are `AnthropicSecretArnDev` / `AnthropicSecretArnUat`.

3. **Deploy the pipeline stack** (this is the only stack you deploy by hand;
   everything else is deployed BY the pipeline):
   ```bash
   aws cloudformation deploy \
     --stack-name technexus-pipeline \
     --template-file infra/cloudformation/05-pipeline.yaml \
     --parameter-overrides \
       ConnectionArn=<arn-from-step-1> \
       RepositoryId=<your-github-org>/<your-repo> \
       BranchName=main \
       AnthropicSecretArnDev=<arn-from-step-2-dev> \
       AnthropicSecretArnUat=<arn-from-step-2-uat> \
     --capabilities CAPABILITY_NAMED_IAM
   ```

4. **Push this repo to GitHub** on the branch you named above. The first push
   triggers the pipeline automatically: Source → Build → Deploy to Dev →
   (manual approval, in the CodePipeline console) → Deploy to UAT.

5. **Seed the database**, once, per environment (run from anywhere with
   network access to the RDS instance — e.g. via `aws ecs execute-command`
   into the running backend task, or a bastion/Session Manager host):
   ```bash
   node backend/src/seed.js
   ```

## What maps to which workshop day

| Workshop content | Where it lives here |
|---|---|
| Day 1 — Git/GitHub branching, PRs | This repo, standard `main` + feature branches |
| Day 2 — CloudFormation templates, stacks, change sets | `infra/cloudformation/*.yaml` |
| Day 2 — CI/CD pipeline design | `05-pipeline.yaml` (Source/Build/Deploy/Approve/Promote stages) |
| Day 3 — CodeBuild, buildspec.yml | `infra/buildspec-build.yml`, `infra/buildspec-deploy.yml` |
| Day 3 — Dev → UAT promotion, approval gates | `ApproveForUAT` manual approval stage in the pipeline |
| Day 3 — Release v2 / rollback | Push a new commit → new `IMAGE_TAG` → same promotion flow; roll back by re-running `aws cloudformation deploy` with the previous `ImageTag` |
| Day 4 — Kiro | Not part of this repo — use Kiro directly against this codebase for spec-driven changes |

## Scope notes / what's deliberately deferred

- The original artifact's **Tech Landscape** (bubble map) and **Partner
  Network** (SVG graph) views were left out of this rebuild to keep the
  pipeline the focus. Both are pure front-end/decorative and can be ported
  from the original artifact's `renderLandscape()` / `renderNetwork()`
  functions later without touching the backend or infra.
- Auth is not implemented (single-user / internal-tool assumption per your
  earlier answer). Favorites are stored in the browser's `localStorage`.
- The Dockerfile/CloudFormation here favor clarity over hardening — before
  any real production use, tighten the CodeBuild IAM policy (currently
  fairly broad on ECR/CloudFormation/ECS) and consider HTTPS on the ALB via
  ACM + a custom domain.
