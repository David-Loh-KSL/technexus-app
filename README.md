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
                               │        Azure OpenAI Service
                               ▼        (kaiva-dev-az-openai,
                        ┌─────────────┐  deployment kaiva-dev-gpt-5.1_mini,
                        │ RDS Postgres│  key from Secrets Manager only)
                        └─────────────┘
```

CloudFront routes `/api/*` straight through to the ALB (CachingDisabled +
AllViewerExceptHostHeader managed policies) so the frontend and backend can
share one HTTPS domain without mixed-content errors.

- **Frontend**: React + Vite, built to static files, served from S3 via CloudFront
- **Backend**: Node/Express on ECS Fargate behind an ALB. Holds the real
  Azure OpenAI key (from Secrets Manager, `technexus/<env>/azure-openai-key`)
  so the browser never sees it — this replaces both the original artifact's
  client-side `fetch()` to `api.anthropic.com` (which only worked inside
  Claude's own artifact sandbox) and the project's initial server-side
  Anthropic integration, later swapped to Azure OpenAI since that's the key
  already available for R&D use.
- **Database**: RDS PostgreSQL, private subnets only. Schema is bootstrapped
  via `backend/src/migrate.js`, run once per environment through ECS Exec.
- **Infra**: Raw CloudFormation (matches Day 2 of the workshop)
- **CI/CD**: CodePipeline + CodeBuild + CodeConnections, Dev → manual
  approval → UAT (matches Day 3)

## Live environments

| Environment | URL |
|---|---|
| Dev | https://d79agkl4gr95r.cloudfront.net |
| UAT | see the `technexus-frontend-uat` stack's `SiteUrl` output in the CloudFormation console |

AWS account: `422134367003`, region `us-east-1`. GitHub: `David-Loh-KSL/technexus-app`, branch `main`.

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
cp backend/.env.example backend/.env   # fill in your Azure OpenAI endpoint, key, and deployment name
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

2. **Create the Azure OpenAI key secret**, once per environment:
   ```bash
   aws secretsmanager create-secret --name technexus/dev/azure-openai-key \
     --secret-string '{"AZURE_OPENAI_KEY":"<your-azure-key>"}'
   aws secretsmanager create-secret --name technexus/uat/azure-openai-key \
     --secret-string '{"AZURE_OPENAI_KEY":"<your-azure-key>"}'
   ```
   Copy the ARNs — these are `AzureOpenAISecretArnDev` / `AzureOpenAISecretArnUat`.
   Also confirm the deployment name in the Azure portal before deploying —
   it isn't always the model name you'd expect (ours is
   `kaiva-dev-gpt-5.1_mini`, not `gpt-5-mini`).

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
       AzureOpenAISecretArnDev=<arn-from-step-2-dev> \
       AzureOpenAISecretArnUat=<arn-from-step-2-uat> \
     --capabilities CAPABILITY_NAMED_IAM
   ```

4. **Create the `AWSServiceRoleForECS` service-linked role**, once per
   account, if it doesn't already exist (it doesn't always auto-create):
   ```bash
   aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com
   ```

5. **Push this repo to GitHub** on the branch you named above. The first push
   triggers the pipeline automatically: Source → Build → Deploy to Dev →
   (manual approval, in the CodePipeline console) → Deploy to UAT.

6. **Bootstrap and seed the database**, once, per environment, using ECS
   Exec into the running backend task (`EnableExecuteCommand: true` is
   already set on the ECS service):
   ```bash
   aws ecs execute-command \
     --cluster technexus-<env> --task <task-id> --container backend \
     --interactive --command "/bin/sh"
   # then, inside the container:
   node src/migrate.js
   node src/seed.js
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

## Lessons learned from the actual deployment

Things that came up running this for real, in case you hit them again on a
future environment or a new citizen-developer app built the same way:

- **CloudFormation `Fn::ImportValue` across stacks can deadlock updates.**
  `04-frontend-hosting.yaml` originally imported `AlbDnsName` from the
  backend stack; any update to either stack then blocked on the other. Fixed
  by passing `AlbDnsName` as an explicit parameter instead of an import.
- **ECR repository ownership must be singular.** Both `buildspec-build.yml`
  and `03-backend-ecs.yaml` tried to own the same ECR repo. Fixed by removing
  the `AWS::ECR::Repository` resource from the CloudFormation template and
  letting the buildspec own it.
- **`npm ci` needs a committed `package-lock.json`.** Without one in the
  repo, the build failed; switched to `npm install` in the buildspec.
- **CodeBuild's IAM role needs broad-but-scoped permissions** to run
  `cloudformation deploy` against EC2/RDS/ECS/logs/CloudFront resources, plus
  `ecr:DescribeRepositories` specifically (easy to drop during a permissions
  cleanup).
- **`AWSServiceRoleForECS` doesn't always auto-create.** Create it once,
  manually, per account (command above) before ECS tasks will launch.
- **CloudFront `/api/*` behavior** needs `CachingDisabled`
  (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`) and
  `AllViewerExceptHostHeader` (`b689b0a8-53d0-40ab-baf2-68738e2966ac`)
  managed policies to correctly proxy to the ALB without mixed-content
  errors.
- **The pipeline's build artifact needs `frontend/**/*` explicitly** (minus
  `node_modules`) — otherwise `frontend/package.json` goes missing from what
  gets deployed.
- **Azure OpenAI deployment names aren't predictable** — always verify the
  actual deployment name in the Azure portal rather than assuming it matches
  the model name.

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
- The Azure OpenAI key lives only in Secrets Manager, read by the ECS task
  role — it's never in `.env` files committed to git, `docker-compose.yml`,
  or the frontend bundle. Keep it that way if this pattern gets reused for
  citizen-developer apps: prefer Bedrock (IAM-based, no key at all) over any
  externally-issued API key where possible.
