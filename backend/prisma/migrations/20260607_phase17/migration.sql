Error: P1012

error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:1
   | 
   | 
 1 | -- CreateEnum
 2 | CREATE TYPE "Plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:2
   | 
 1 | -- CreateEnum
 2 | CREATE TYPE "Plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');
 3 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:4
   | 
 3 | 
 4 | -- CreateEnum
 5 | CREATE TYPE "OrgRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:5
   | 
 4 | -- CreateEnum
 5 | CREATE TYPE "OrgRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
 6 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:7
   | 
 6 | 
 7 | -- CreateEnum
 8 | CREATE TYPE "AgentTaskType" AS ENUM ('analysis', 'iac_generation', 'k8s_ops', 'cost_calc', 'incident_rca', 'monitoring', 'pipeline');
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:8
   | 
 7 | -- CreateEnum
 8 | CREATE TYPE "AgentTaskType" AS ENUM ('analysis', 'iac_generation', 'k8s_ops', 'cost_calc', 'incident_rca', 'monitoring', 'pipeline');
 9 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:10
   | 
 9 | 
10 | -- CreateEnum
11 | CREATE TYPE "DeployStatus" AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:11
   | 
10 | -- CreateEnum
11 | CREATE TYPE "DeployStatus" AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
12 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:13
   | 
12 | 
13 | -- CreateEnum
14 | CREATE TYPE "IncidentStatus" AS ENUM ('active', 'investigating', 'resolved');
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:14
   | 
13 | -- CreateEnum
14 | CREATE TYPE "IncidentStatus" AS ENUM ('active', 'investigating', 'resolved');
15 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:16
   | 
15 | 
16 | -- CreateTable
17 | CREATE TABLE "users" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:17
   | 
16 | -- CreateTable
17 | CREATE TABLE "users" (
18 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:18
   | 
17 | CREATE TABLE "users" (
18 |     "id" TEXT NOT NULL,
19 |     "email" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:19
   | 
18 |     "id" TEXT NOT NULL,
19 |     "email" TEXT NOT NULL,
20 |     "password_hash" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:20
   | 
19 |     "email" TEXT NOT NULL,
20 |     "password_hash" TEXT NOT NULL,
21 |     "name" TEXT NOT NULL DEFAULT 'User',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:21
   | 
20 |     "password_hash" TEXT NOT NULL,
21 |     "name" TEXT NOT NULL DEFAULT 'User',
22 |     "avatar" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:22
   | 
21 |     "name" TEXT NOT NULL DEFAULT 'User',
22 |     "avatar" TEXT,
23 |     "company" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:23
   | 
22 |     "avatar" TEXT,
23 |     "company" TEXT,
24 |     "plan" "Plan" NOT NULL DEFAULT 'free',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:24
   | 
23 |     "company" TEXT,
24 |     "plan" "Plan" NOT NULL DEFAULT 'free',
25 |     "github_token" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:25
   | 
24 |     "plan" "Plan" NOT NULL DEFAULT 'free',
25 |     "github_token" TEXT,
26 |     "github_username" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:26
   | 
25 |     "github_token" TEXT,
26 |     "github_username" TEXT,
27 |     "deploy_limit" INTEGER NOT NULL DEFAULT 5,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:27
   | 
26 |     "github_username" TEXT,
27 |     "deploy_limit" INTEGER NOT NULL DEFAULT 5,
28 |     "deploy_count" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:28
   | 
27 |     "deploy_limit" INTEGER NOT NULL DEFAULT 5,
28 |     "deploy_count" INTEGER NOT NULL DEFAULT 0,
29 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:29
   | 
28 |     "deploy_count" INTEGER NOT NULL DEFAULT 0,
29 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
30 |     "updated_at" TIMESTAMP(3) NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:30
   | 
29 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
30 |     "updated_at" TIMESTAMP(3) NOT NULL,
31 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:32
   | 
31 | 
32 |     CONSTRAINT "users_pkey" PRIMARY KEY ("id")
33 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:33
   | 
32 |     CONSTRAINT "users_pkey" PRIMARY KEY ("id")
33 | );
34 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:35
   | 
34 | 
35 | -- CreateTable
36 | CREATE TABLE "organizations" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:36
   | 
35 | -- CreateTable
36 | CREATE TABLE "organizations" (
37 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:37
   | 
36 | CREATE TABLE "organizations" (
37 |     "id" TEXT NOT NULL,
38 |     "name" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:38
   | 
37 |     "id" TEXT NOT NULL,
38 |     "name" TEXT NOT NULL,
39 |     "slug" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:39
   | 
38 |     "name" TEXT NOT NULL,
39 |     "slug" TEXT NOT NULL,
40 |     "plan" "Plan" NOT NULL DEFAULT 'free',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:40
   | 
39 |     "slug" TEXT NOT NULL,
40 |     "plan" "Plan" NOT NULL DEFAULT 'free',
41 |     "k8s_namespace" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:41
   | 
40 |     "plan" "Plan" NOT NULL DEFAULT 'free',
41 |     "k8s_namespace" TEXT NOT NULL,
42 |     "monthly_token_budget" INTEGER NOT NULL DEFAULT 50000,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:42
   | 
41 |     "k8s_namespace" TEXT NOT NULL,
42 |     "monthly_token_budget" INTEGER NOT NULL DEFAULT 50000,
43 |     "stripe_customer_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:43
   | 
42 |     "monthly_token_budget" INTEGER NOT NULL DEFAULT 50000,
43 |     "stripe_customer_id" TEXT,
44 |     "stripe_sub_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:44
   | 
43 |     "stripe_customer_id" TEXT,
44 |     "stripe_sub_id" TEXT,
45 |     "aws_region" TEXT NOT NULL DEFAULT 'us-east-1',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:45
   | 
44 |     "stripe_sub_id" TEXT,
45 |     "aws_region" TEXT NOT NULL DEFAULT 'us-east-1',
46 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:46
   | 
45 |     "aws_region" TEXT NOT NULL DEFAULT 'us-east-1',
46 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
47 |     "updated_at" TIMESTAMP(3) NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:47
   | 
46 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
47 |     "updated_at" TIMESTAMP(3) NOT NULL,
48 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:49
   | 
48 | 
49 |     CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
50 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:50
   | 
49 |     CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
50 | );
51 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:52
   | 
51 | 
52 | -- CreateTable
53 | CREATE TABLE "organization_members" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:53
   | 
52 | -- CreateTable
53 | CREATE TABLE "organization_members" (
54 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:54
   | 
53 | CREATE TABLE "organization_members" (
54 |     "id" TEXT NOT NULL,
55 |     "org_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:55
   | 
54 |     "id" TEXT NOT NULL,
55 |     "org_id" TEXT NOT NULL,
56 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:56
   | 
55 |     "org_id" TEXT NOT NULL,
56 |     "user_id" TEXT NOT NULL,
57 |     "role" "OrgRole" NOT NULL DEFAULT 'member',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:57
   | 
56 |     "user_id" TEXT NOT NULL,
57 |     "role" "OrgRole" NOT NULL DEFAULT 'member',
58 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:58
   | 
57 |     "role" "OrgRole" NOT NULL DEFAULT 'member',
58 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
59 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:60
   | 
59 | 
60 |     CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
61 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:61
   | 
60 |     CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
61 | );
62 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:63
   | 
62 | 
63 | -- CreateTable
64 | CREATE TABLE "token_usages" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:64
   | 
63 | -- CreateTable
64 | CREATE TABLE "token_usages" (
65 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:65
   | 
64 | CREATE TABLE "token_usages" (
65 |     "id" TEXT NOT NULL,
66 |     "org_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:66
   | 
65 |     "id" TEXT NOT NULL,
66 |     "org_id" TEXT NOT NULL,
67 |     "agent_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:67
   | 
66 |     "org_id" TEXT NOT NULL,
67 |     "agent_id" TEXT NOT NULL,
68 |     "task_type" "AgentTaskType" NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:68
   | 
67 |     "agent_id" TEXT NOT NULL,
68 |     "task_type" "AgentTaskType" NOT NULL,
69 |     "model" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:69
   | 
68 |     "task_type" "AgentTaskType" NOT NULL,
69 |     "model" TEXT NOT NULL,
70 |     "input_tokens" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:70
   | 
69 |     "model" TEXT NOT NULL,
70 |     "input_tokens" INTEGER NOT NULL DEFAULT 0,
71 |     "output_tokens" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:71
   | 
70 |     "input_tokens" INTEGER NOT NULL DEFAULT 0,
71 |     "output_tokens" INTEGER NOT NULL DEFAULT 0,
72 |     "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:72
   | 
71 |     "output_tokens" INTEGER NOT NULL DEFAULT 0,
72 |     "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
73 |     "execution_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:73
   | 
72 |     "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
73 |     "execution_id" TEXT,
74 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:74
   | 
73 |     "execution_id" TEXT,
74 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
75 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:76
   | 
75 | 
76 |     CONSTRAINT "token_usages_pkey" PRIMARY KEY ("id")
77 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:77
   | 
76 |     CONSTRAINT "token_usages_pkey" PRIMARY KEY ("id")
77 | );
78 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:79
   | 
78 | 
79 | -- CreateTable
80 | CREATE TABLE "agent_configs" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:80
   | 
79 | -- CreateTable
80 | CREATE TABLE "agent_configs" (
81 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:81
   | 
80 | CREATE TABLE "agent_configs" (
81 |     "id" TEXT NOT NULL,
82 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:82
   | 
81 |     "id" TEXT NOT NULL,
82 |     "user_id" TEXT NOT NULL,
83 |     "agent_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:83
   | 
82 |     "user_id" TEXT NOT NULL,
83 |     "agent_id" TEXT NOT NULL,
84 |     "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:84
   | 
83 |     "agent_id" TEXT NOT NULL,
84 |     "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
85 |     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:85
   | 
84 |     "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
85 |     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
86 |     "max_tokens" INTEGER NOT NULL DEFAULT 4096,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:86
   | 
85 |     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
86 |     "max_tokens" INTEGER NOT NULL DEFAULT 4096,
87 |     "custom_prompt" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:87
   | 
86 |     "max_tokens" INTEGER NOT NULL DEFAULT 4096,
87 |     "custom_prompt" TEXT,
88 |     "enabled" BOOLEAN NOT NULL DEFAULT true,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:88
   | 
87 |     "custom_prompt" TEXT,
88 |     "enabled" BOOLEAN NOT NULL DEFAULT true,
89 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:90
   | 
89 | 
90 |     CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
91 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:91
   | 
90 |     CONSTRAINT "agent_configs_pkey" PRIMARY KEY ("id")
91 | );
92 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:93
   | 
92 | 
93 | -- CreateTable
94 | CREATE TABLE "api_keys" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:94
   | 
93 | -- CreateTable
94 | CREATE TABLE "api_keys" (
95 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:95
   | 
94 | CREATE TABLE "api_keys" (
95 |     "id" TEXT NOT NULL,
96 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:96
   | 
95 |     "id" TEXT NOT NULL,
96 |     "user_id" TEXT NOT NULL,
97 |     "provider" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:97
   | 
96 |     "user_id" TEXT NOT NULL,
97 |     "provider" TEXT NOT NULL,
98 |     "encrypted_key" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:98
   | 
97 |     "provider" TEXT NOT NULL,
98 |     "encrypted_key" TEXT NOT NULL,
99 |     "label" TEXT NOT NULL DEFAULT '',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:99
   | 
98 |     "encrypted_key" TEXT NOT NULL,
99 |     "label" TEXT NOT NULL DEFAULT '',
100 |     "is_valid" BOOLEAN NOT NULL DEFAULT true,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:100
   | 
99 |     "label" TEXT NOT NULL DEFAULT '',
100 |     "is_valid" BOOLEAN NOT NULL DEFAULT true,
101 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:101
   | 
100 |     "is_valid" BOOLEAN NOT NULL DEFAULT true,
101 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
102 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:103
   | 
102 | 
103 |     CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
104 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:104
   | 
103 |     CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
104 | );
105 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:106
   | 
105 | 
106 | -- CreateTable
107 | CREATE TABLE "deployments" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:107
   | 
106 | -- CreateTable
107 | CREATE TABLE "deployments" (
108 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:108
   | 
107 | CREATE TABLE "deployments" (
108 |     "id" TEXT NOT NULL,
109 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:109
   | 
108 |     "id" TEXT NOT NULL,
109 |     "user_id" TEXT NOT NULL,
110 |     "project_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:110
   | 
109 |     "user_id" TEXT NOT NULL,
110 |     "project_id" TEXT,
111 |     "deploy_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:111
   | 
110 |     "project_id" TEXT,
111 |     "deploy_id" TEXT NOT NULL,
112 |     "project_name" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:112
   | 
111 |     "deploy_id" TEXT NOT NULL,
112 |     "project_name" TEXT NOT NULL,
113 |     "github_repo" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:113
   | 
112 |     "project_name" TEXT NOT NULL,
113 |     "github_repo" TEXT,
114 |     "github_branch" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:114
   | 
113 |     "github_repo" TEXT,
114 |     "github_branch" TEXT,
115 |     "status" "DeployStatus" NOT NULL DEFAULT 'pending',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:115
   | 
114 |     "github_branch" TEXT,
115 |     "status" "DeployStatus" NOT NULL DEFAULT 'pending',
116 |     "region" TEXT NOT NULL DEFAULT 'us-east-1',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:116
   | 
115 |     "status" "DeployStatus" NOT NULL DEFAULT 'pending',
116 |     "region" TEXT NOT NULL DEFAULT 'us-east-1',
117 |     "environment" TEXT NOT NULL DEFAULT 'production',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:117
   | 
116 |     "region" TEXT NOT NULL DEFAULT 'us-east-1',
117 |     "environment" TEXT NOT NULL DEFAULT 'production',
118 |     "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:118
   | 
117 |     "environment" TEXT NOT NULL DEFAULT 'production',
118 |     "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
119 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:119
   | 
118 |     "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
119 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
120 |     "duration" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:120
   | 
119 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
120 |     "duration" INTEGER NOT NULL DEFAULT 0,
121 |     "stages" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:121
   | 
120 |     "duration" INTEGER NOT NULL DEFAULT 0,
121 |     "stages" TEXT,
122 |     "completed_at" TIMESTAMP(3),
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:122
   | 
121 |     "stages" TEXT,
122 |     "completed_at" TIMESTAMP(3),
123 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:123
   | 
122 |     "completed_at" TIMESTAMP(3),
123 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
124 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:125
   | 
124 | 
125 |     CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
126 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:126
   | 
125 |     CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
126 | );
127 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:128
   | 
127 | 
128 | -- CreateTable
129 | CREATE TABLE "activities" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:129
   | 
128 | -- CreateTable
129 | CREATE TABLE "activities" (
130 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:130
   | 
129 | CREATE TABLE "activities" (
130 |     "id" TEXT NOT NULL,
131 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:131
   | 
130 |     "id" TEXT NOT NULL,
131 |     "user_id" TEXT NOT NULL,
132 |     "text" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:132
   | 
131 |     "user_id" TEXT NOT NULL,
132 |     "text" TEXT NOT NULL,
133 |     "color" TEXT NOT NULL DEFAULT '#818cf8',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:133
   | 
132 |     "text" TEXT NOT NULL,
133 |     "color" TEXT NOT NULL DEFAULT '#818cf8',
134 |     "type" TEXT NOT NULL DEFAULT 'info',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:134
   | 
133 |     "color" TEXT NOT NULL DEFAULT '#818cf8',
134 |     "type" TEXT NOT NULL DEFAULT 'info',
135 |     "deploy_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:135
   | 
134 |     "type" TEXT NOT NULL DEFAULT 'info',
135 |     "deploy_id" TEXT,
136 |     "agent_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:136
   | 
135 |     "deploy_id" TEXT,
136 |     "agent_id" TEXT,
137 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:137
   | 
136 |     "agent_id" TEXT,
137 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
138 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:139
   | 
138 | 
139 |     CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
140 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:140
   | 
139 |     CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
140 | );
141 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:142
   | 
141 | 
142 | -- CreateTable
143 | CREATE TABLE "incidents" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:143
   | 
142 | -- CreateTable
143 | CREATE TABLE "incidents" (
144 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:144
   | 
143 | CREATE TABLE "incidents" (
144 |     "id" TEXT NOT NULL,
145 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:145
   | 
144 |     "id" TEXT NOT NULL,
145 |     "user_id" TEXT NOT NULL,
146 |     "title" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:146
   | 
145 |     "user_id" TEXT NOT NULL,
146 |     "title" TEXT NOT NULL,
147 |     "description" TEXT NOT NULL DEFAULT '',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:147
   | 
146 |     "title" TEXT NOT NULL,
147 |     "description" TEXT NOT NULL DEFAULT '',
148 |     "severity" TEXT NOT NULL DEFAULT 'medium',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:148
   | 
147 |     "description" TEXT NOT NULL DEFAULT '',
148 |     "severity" TEXT NOT NULL DEFAULT 'medium',
149 |     "alarm" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:149
   | 
148 |     "severity" TEXT NOT NULL DEFAULT 'medium',
149 |     "alarm" TEXT,
150 |     "status" "IncidentStatus" NOT NULL DEFAULT 'active',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:150
   | 
149 |     "alarm" TEXT,
150 |     "status" "IncidentStatus" NOT NULL DEFAULT 'active',
151 |     "resolution" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:151
   | 
150 |     "status" "IncidentStatus" NOT NULL DEFAULT 'active',
151 |     "resolution" TEXT,
152 |     "resolved_at" TIMESTAMP(3),
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:152
   | 
151 |     "resolution" TEXT,
152 |     "resolved_at" TIMESTAMP(3),
153 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:153
   | 
152 |     "resolved_at" TIMESTAMP(3),
153 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
154 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:155
   | 
154 | 
155 |     CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
156 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:156
   | 
155 |     CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
156 | );
157 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:158
   | 
157 | 
158 | -- CreateTable
159 | CREATE TABLE "agent_executions" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:159
   | 
158 | -- CreateTable
159 | CREATE TABLE "agent_executions" (
160 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:160
   | 
159 | CREATE TABLE "agent_executions" (
160 |     "id" TEXT NOT NULL,
161 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:161
   | 
160 |     "id" TEXT NOT NULL,
161 |     "user_id" TEXT NOT NULL,
162 |     "agent_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:162
   | 
161 |     "user_id" TEXT NOT NULL,
162 |     "agent_id" TEXT NOT NULL,
163 |     "task" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:163
   | 
162 |     "agent_id" TEXT NOT NULL,
163 |     "task" TEXT NOT NULL,
164 |     "status" TEXT NOT NULL DEFAULT 'running',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:164
   | 
163 |     "task" TEXT NOT NULL,
164 |     "status" TEXT NOT NULL DEFAULT 'running',
165 |     "steps" TEXT NOT NULL DEFAULT '[]',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:165
   | 
164 |     "status" TEXT NOT NULL DEFAULT 'running',
165 |     "steps" TEXT NOT NULL DEFAULT '[]',
166 |     "toolCalls" TEXT NOT NULL DEFAULT '[]',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:166
   | 
165 |     "steps" TEXT NOT NULL DEFAULT '[]',
166 |     "toolCalls" TEXT NOT NULL DEFAULT '[]',
167 |     "result" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:167
   | 
166 |     "toolCalls" TEXT NOT NULL DEFAULT '[]',
167 |     "result" TEXT,
168 |     "duration_ms" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:168
   | 
167 |     "result" TEXT,
168 |     "duration_ms" INTEGER NOT NULL DEFAULT 0,
169 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:169
   | 
168 |     "duration_ms" INTEGER NOT NULL DEFAULT 0,
169 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
170 |     "completed_at" TIMESTAMP(3),
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:170
   | 
169 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
170 |     "completed_at" TIMESTAMP(3),
171 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:172
   | 
171 | 
172 |     CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id")
173 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:173
   | 
172 |     CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id")
173 | );
174 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:175
   | 
174 | 
175 | -- CreateTable
176 | CREATE TABLE "system_metrics" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:176
   | 
175 | -- CreateTable
176 | CREATE TABLE "system_metrics" (
177 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:177
   | 
176 | CREATE TABLE "system_metrics" (
177 |     "id" TEXT NOT NULL,
178 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:178
   | 
177 |     "id" TEXT NOT NULL,
178 |     "user_id" TEXT NOT NULL,
179 |     "cpu_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:179
   | 
178 |     "user_id" TEXT NOT NULL,
179 |     "cpu_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
180 |     "mem_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:180
   | 
179 |     "cpu_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
180 |     "mem_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
181 |     "req_per_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:181
   | 
180 |     "mem_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
181 |     "req_per_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
182 |     "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:182
   | 
181 |     "req_per_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
182 |     "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
183 |     "active_conns" INTEGER NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:183
   | 
182 |     "error_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
183 |     "active_conns" INTEGER NOT NULL DEFAULT 0,
184 |     "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:184
   | 
183 |     "active_conns" INTEGER NOT NULL DEFAULT 0,
184 |     "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
185 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:186
   | 
185 | 
186 |     CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
187 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:187
   | 
186 |     CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
187 | );
188 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:189
   | 
188 | 
189 | -- CreateTable
190 | CREATE TABLE "scaling_events" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:190
   | 
189 | -- CreateTable
190 | CREATE TABLE "scaling_events" (
191 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:191
   | 
190 | CREATE TABLE "scaling_events" (
191 |     "id" TEXT NOT NULL,
192 |     "user_id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:192
   | 
191 |     "id" TEXT NOT NULL,
192 |     "user_id" TEXT NOT NULL,
193 |     "action" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:193
   | 
192 |     "user_id" TEXT NOT NULL,
193 |     "action" TEXT NOT NULL,
194 |     "reason" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:194
   | 
193 |     "action" TEXT NOT NULL,
194 |     "reason" TEXT NOT NULL,
195 |     "before_value" INTEGER NOT NULL DEFAULT 1,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:195
   | 
194 |     "reason" TEXT NOT NULL,
195 |     "before_value" INTEGER NOT NULL DEFAULT 1,
196 |     "after_value" INTEGER NOT NULL DEFAULT 2,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:196
   | 
195 |     "before_value" INTEGER NOT NULL DEFAULT 1,
196 |     "after_value" INTEGER NOT NULL DEFAULT 2,
197 |     "applied_by" TEXT NOT NULL DEFAULT 'agent',
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:197
   | 
196 |     "after_value" INTEGER NOT NULL DEFAULT 2,
197 |     "applied_by" TEXT NOT NULL DEFAULT 'agent',
198 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:198
   | 
197 |     "applied_by" TEXT NOT NULL DEFAULT 'agent',
198 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
199 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:199
   | 
198 |     "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
199 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
200 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:201
   | 
200 | 
201 |     CONSTRAINT "scaling_events_pkey" PRIMARY KEY ("id")
202 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:202
   | 
201 |     CONSTRAINT "scaling_events_pkey" PRIMARY KEY ("id")
202 | );
203 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:204
   | 
203 | 
204 | -- CreateTable
205 | CREATE TABLE "audit_logs" (
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:205
   | 
204 | -- CreateTable
205 | CREATE TABLE "audit_logs" (
206 |     "id" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:206
   | 
205 | CREATE TABLE "audit_logs" (
206 |     "id" TEXT NOT NULL,
207 |     "user_id" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:207
   | 
206 |     "id" TEXT NOT NULL,
207 |     "user_id" TEXT,
208 |     "action" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:208
   | 
207 |     "user_id" TEXT,
208 |     "action" TEXT NOT NULL,
209 |     "resource" TEXT NOT NULL,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:209
   | 
208 |     "action" TEXT NOT NULL,
209 |     "resource" TEXT NOT NULL,
210 |     "metadata" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:210
   | 
209 |     "resource" TEXT NOT NULL,
210 |     "metadata" TEXT,
211 |     "ip_address" TEXT,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:211
   | 
210 |     "metadata" TEXT,
211 |     "ip_address" TEXT,
212 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:212
   | 
211 |     "ip_address" TEXT,
212 |     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
213 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:214
   | 
213 | 
214 |     CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
215 | );
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:215
   | 
214 |     CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
215 | );
216 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:217
   | 
216 | 
217 | -- CreateIndex
218 | CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:218
   | 
217 | -- CreateIndex
218 | CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
219 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:220
   | 
219 | 
220 | -- CreateIndex
221 | CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:221
   | 
220 | -- CreateIndex
221 | CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
222 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:223
   | 
222 | 
223 | -- CreateIndex
224 | CREATE UNIQUE INDEX "organizations_k8s_namespace_key" ON "organizations"("k8s_namespace");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:224
   | 
223 | -- CreateIndex
224 | CREATE UNIQUE INDEX "organizations_k8s_namespace_key" ON "organizations"("k8s_namespace");
225 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:226
   | 
225 | 
226 | -- CreateIndex
227 | CREATE UNIQUE INDEX "organization_members_org_id_user_id_key" ON "organization_members"("org_id", "user_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:227
   | 
226 | -- CreateIndex
227 | CREATE UNIQUE INDEX "organization_members_org_id_user_id_key" ON "organization_members"("org_id", "user_id");
228 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:229
   | 
228 | 
229 | -- CreateIndex
230 | CREATE INDEX "token_usages_org_id_created_at_idx" ON "token_usages"("org_id", "created_at");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:230
   | 
229 | -- CreateIndex
230 | CREATE INDEX "token_usages_org_id_created_at_idx" ON "token_usages"("org_id", "created_at");
231 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:232
   | 
231 | 
232 | -- CreateIndex
233 | CREATE UNIQUE INDEX "agent_configs_user_id_agent_id_key" ON "agent_configs"("user_id", "agent_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:233
   | 
232 | -- CreateIndex
233 | CREATE UNIQUE INDEX "agent_configs_user_id_agent_id_key" ON "agent_configs"("user_id", "agent_id");
234 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:235
   | 
234 | 
235 | -- CreateIndex
236 | CREATE UNIQUE INDEX "deployments_deploy_id_key" ON "deployments"("deploy_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:236
   | 
235 | -- CreateIndex
236 | CREATE UNIQUE INDEX "deployments_deploy_id_key" ON "deployments"("deploy_id");
237 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:238
   | 
237 | 
238 | -- CreateIndex
239 | CREATE INDEX "deployments_user_id_idx" ON "deployments"("user_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:239
   | 
238 | -- CreateIndex
239 | CREATE INDEX "deployments_user_id_idx" ON "deployments"("user_id");
240 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:241
   | 
240 | 
241 | -- CreateIndex
242 | CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:242
   | 
241 | -- CreateIndex
242 | CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");
243 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:244
   | 
243 | 
244 | -- CreateIndex
245 | CREATE INDEX "incidents_user_id_idx" ON "incidents"("user_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:245
   | 
244 | -- CreateIndex
245 | CREATE INDEX "incidents_user_id_idx" ON "incidents"("user_id");
246 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:247
   | 
246 | 
247 | -- CreateIndex
248 | CREATE INDEX "agent_executions_user_id_agent_id_idx" ON "agent_executions"("user_id", "agent_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:248
   | 
247 | -- CreateIndex
248 | CREATE INDEX "agent_executions_user_id_agent_id_idx" ON "agent_executions"("user_id", "agent_id");
249 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:250
   | 
249 | 
250 | -- CreateIndex
251 | CREATE INDEX "system_metrics_user_id_recorded_at_idx" ON "system_metrics"("user_id", "recorded_at");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:251
   | 
250 | -- CreateIndex
251 | CREATE INDEX "system_metrics_user_id_recorded_at_idx" ON "system_metrics"("user_id", "recorded_at");
252 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:253
   | 
252 | 
253 | -- CreateIndex
254 | CREATE INDEX "scaling_events_user_id_idx" ON "scaling_events"("user_id");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:254
   | 
253 | -- CreateIndex
254 | CREATE INDEX "scaling_events_user_id_idx" ON "scaling_events"("user_id");
255 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:256
   | 
255 | 
256 | -- CreateIndex
257 | CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:257
   | 
256 | -- CreateIndex
257 | CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
258 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:259
   | 
258 | 
259 | -- AddForeignKey
260 | ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:260
   | 
259 | -- AddForeignKey
260 | ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
261 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:262
   | 
261 | 
262 | -- AddForeignKey
263 | ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:263
   | 
262 | -- AddForeignKey
263 | ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
264 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:265
   | 
264 | 
265 | -- AddForeignKey
266 | ALTER TABLE "token_usages" ADD CONSTRAINT "token_usages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:266
   | 
265 | -- AddForeignKey
266 | ALTER TABLE "token_usages" ADD CONSTRAINT "token_usages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
267 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:268
   | 
267 | 
268 | -- AddForeignKey
269 | ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:269
   | 
268 | -- AddForeignKey
269 | ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
270 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:271
   | 
270 | 
271 | -- AddForeignKey
272 | ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:272
   | 
271 | -- AddForeignKey
272 | ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
273 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:274
   | 
273 | 
274 | -- AddForeignKey
275 | ALTER TABLE "deployments" ADD CONSTRAINT "deployments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:275
   | 
274 | -- AddForeignKey
275 | ALTER TABLE "deployments" ADD CONSTRAINT "deployments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
276 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:277
   | 
276 | 
277 | -- AddForeignKey
278 | ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:278
   | 
277 | -- AddForeignKey
278 | ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
279 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:280
   | 
279 | 
280 | -- AddForeignKey
281 | ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:281
   | 
280 | -- AddForeignKey
281 | ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
282 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:283
   | 
282 | 
283 | -- AddForeignKey
284 | ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:284
   | 
283 | -- AddForeignKey
284 | ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
285 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:286
   | 
285 | 
286 | -- AddForeignKey
287 | ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:287
   | 
286 | -- AddForeignKey
287 | ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
288 | 
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:289
   | 
288 | 
289 | ┌─────────────────────────────────────────────────────────┐
290 | │  Update available 5.22.0 -> 7.8.0                       │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:290
   | 
289 | ┌─────────────────────────────────────────────────────────┐
290 | │  Update available 5.22.0 -> 7.8.0                       │
291 | │                                                         │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:291
   | 
290 | │  Update available 5.22.0 -> 7.8.0                       │
291 | │                                                         │
292 | │  This is a major update - please follow the guide at    │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:292
   | 
291 | │                                                         │
292 | │  This is a major update - please follow the guide at    │
293 | │  https://pris.ly/d/major-version-upgrade                │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:293
   | 
292 | │  This is a major update - please follow the guide at    │
293 | │  https://pris.ly/d/major-version-upgrade                │
294 | │                                                         │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:294
   | 
293 | │  https://pris.ly/d/major-version-upgrade                │
294 | │                                                         │
295 | │  Run the following to update                            │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:295
   | 
294 | │                                                         │
295 | │  Run the following to update                            │
296 | │    npm i --save-dev prisma@latest                       │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:296
   | 
295 | │  Run the following to update                            │
296 | │    npm i --save-dev prisma@latest                       │
297 | │    npm i @prisma/client@latest                          │
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:297
   | 
296 | │    npm i --save-dev prisma@latest                       │
297 | │    npm i @prisma/client@latest                          │
298 | └─────────────────────────────────────────────────────────┘
   | 
error: Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  -->  prisma/migrations/20260607_init/migration.sql:298
   | 
297 | │    npm i @prisma/client@latest                          │
298 | └─────────────────────────────────────────────────────────┘
299 | 
   | 


