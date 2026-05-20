# 🚀 TaskApp Enterprise CI/CD Lab Submission
**Student:** Ghazia Arsh
**GitHub Repository:** [https://github.com/GhaziaArsh/taskapp](https://github.com/GhaziaArsh/taskapp)

## 📌 Project Overview
This project demonstrates a complete production-grade full-stack application deployed on Microsoft Azure using containerization, Azure DevOps CI/CD pipelines, and DevSecOps best practices. 

---

## 1️⃣ Core Lab Completion Evidence

### 1. Source Control & Branching (Git Flow)
The repository has been successfully imported into Azure Repos and follows the Git Flow branching strategy (`main`, `develop`, and `feature/*` branches). 

### 2. Docker Containerization
Multi-stage `Dockerfile`s have been created for both the frontend (React) and backend (Node.js) to ensure optimized, production-ready images.
*(Include Screenshot of Dockerfiles in Azure Repos here)*

### 3. Azure Infrastructure Provisioning
The following resources were provisioned in the `rg-taskapp-student-ghazia` resource group:
- **Azure Container Registry (ACR)**: Built images `taskapp-frontend` and `taskapp-backend` are stored here.
- **Azure SQL Database**: Serverless database configured with the `db-taskapp` schema.
- **Azure App Service**: Hosts the Dockerized backend API.
- **Azure Static Web App**: Hosts the React frontend.
*(Include Screenshot of Azure Portal showing the Resource Group and resources here)*

### 4. Azure DevOps CI/CD Pipelines
Multi-stage YAML pipelines (`backend-pipeline.yml` and `frontend-pipeline.yml`) were built and registered in Azure DevOps. The pipelines successfully:
1. Build the Docker images.
2. Push the images to Azure Container Registry (ACR).
3. Deploy to the Development environment.
4. Wait for a manual approval gate before deploying to Production.
*(Include Screenshot of successful pipeline run with green checkmarks here)*

### 5. Live Application
The application is fully functional. The React frontend successfully communicates with the Node.js backend and the Azure SQL Database.
- **Live URL:** `[PASTE YOUR STATIC WEB APP URL HERE]`
*(Include Screenshot of the working application UI here)*

---

## 2️⃣ Extra Mile: DevSecOps & IaC Evidence

### Infrastructure as Code (Terraform)
All Azure resources were defined using Terraform, with state managed remotely via Azure Blob Storage.
*(Include Screenshot of `taskapp.tfstate` in Azure Storage here)*

### SAST with SonarQube
A SonarQube server was provisioned via Docker on an Azure Linux VM. The pipeline integrates a custom Quality Gate ("TaskApp Enterprise Gate") that blocks deployment if vulnerabilities are found.
*(Include Screenshot of SonarQube Dashboard here)*

### SCA with Snyk
Snyk was integrated into the pipeline to scan the `package.json` dependencies for known open-source vulnerabilities prior to deployment.
*(Include Screenshot of Snyk Scan Results in Azure DevOps here)*

### DAST with OWASP ZAP
OWASP ZAP runs a baseline scan on the frontend and an API scan on the backend after deployment. 

**Top Vulnerabilities Found & Remediation:**
1. **Missing Anti-clickjacking Header:** 
   - *Remediation:* Add `X-Frame-Options: DENY` to the backend Express configuration.
2. **Cookie No HttpOnly Flag:**
   - *Remediation:* Ensure all session cookies are set with `HttpOnly; Secure` attributes in the Node.js API.
3. **Cross-Domain Misconfiguration:**
   - *Remediation:* Restrict CORS headers in `index.js` to only allow the specific Static Web App domain instead of `*`.
*(Include Screenshot of ZAP HTML Report here)*

---
*Document generated for final lab verification.*
