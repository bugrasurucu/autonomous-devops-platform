# 🔐 Anahtarsız Bulut Kimlik Kurulumu (Keyless OIDC Setup — AWS, GCP, Azure, Kubernetes)

Orbitron, statik uzun ömürlü bulut erişim anahtarlarını (`AWS_SECRET_ACCESS_KEY`, GCP Service Account JSON, Azure Client Secret) veritabanında saklamak yerine **OpenID Connect (OIDC) Workload Identity Federation** kullanır.

---

## 1. Amazon Web Services (AWS IAM OIDC)

GitHub Actions veya Orbitron Runner'ın geçici STS kimliğiyle (`aws-actions/configure-aws-credentials@v4`) bağlanabilmesi için:

```bash
# 1. GitHub OIDC Sağlayıcısını AWS IAM'e ekleyin
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Orbitron Deployer IAM Rolünü oluşturun
aws iam create-role \
  --role-name orbitron-oidc-deployer \
  --assume-role-policy-document file://trust-policy.json
```

---

## 2. Google Cloud Platform (GCP Workload Identity Federation)

`google-github-actions/auth@v2` ile JSON anahtarsız kimlik doğrulaması:

```bash
# 1. Workload Identity Pool oluşturun
gcloud iam workload-identity-pools create "orbitron-pool" \
  --location="global" \
  --display-name="Orbitron OIDC Pool"

# 2. OIDC Sağlayıcısını bağlayın
gcloud iam workload-identity-pools providers create-oidc "github-oidc" \
  --location="global" \
  --workload-identity-pool="orbitron-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

---

## 3. Microsoft Azure (Entra ID Federated Credential)

`azure/login@v2` ile anahtarsız Azure Container Apps dağıtımı:

```bash
# 1. Entra Uygulaması oluşturun
az ad app create --display-name "orbitron-oidc-deployer"

# 2. Federated Credential ekleyin
az ad app federated-credential create \
  --id <APP_OBJECT_ID> \
  --parameters '{
    "name": "orbitron-github-oidc",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<OWNER>/<REPO>:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

---

## 4. Kubernetes (ServiceAccount & RBAC)

Herhangi bir CNCF uyumlu Kubernetes kümesinde (EKS, GKE, AKS, k3s, kind) `orbitron-deployer` yetkisi:

```bash
kubectl create namespace orbitron-production
kubectl create serviceaccount orbitron-deployer -n orbitron-production
kubectl create rolebinding orbitron-deployer-admin \
  --clusterrole=edit \
  --serviceaccount=orbitron-production:orbitron-deployer \
  -n orbitron-production
```

