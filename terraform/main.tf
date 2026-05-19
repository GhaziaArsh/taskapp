# ══════════════════════════════════════════════════════════════
# TaskApp — Terraform Infrastructure as Code
# Provisions all Azure resources for the application
# ══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "sttfstateyourname"
    container_name       = "tfstate"
    key                  = "taskapp.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# ─── Resource Group ──────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# ─── Azure Container Registry ───────────────────────────────
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = var.tags
}

# ─── Azure SQL Server ───────────────────────────────────────
resource "azurerm_mssql_server" "sql" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_user
  administrator_login_password = var.sql_admin_password
  tags                         = var.tags
}

resource "azurerm_mssql_firewall_rule" "allow_azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.sql.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_mssql_database" "db" {
  name      = "db-taskapp"
  server_id = azurerm_mssql_server.sql.id
  sku_name  = "GP_S_Gen5_1"
  min_capacity                 = 0.5
  auto_pause_delay_in_minutes  = 60
  tags      = var.tags
}

# ─── App Service Plan ───────────────────────────────────────
resource "azurerm_service_plan" "plan" {
  name                = "asp-taskapp-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = var.tags
}

# ─── Backend App Service ────────────────────────────────────
resource "azurerm_linux_web_app" "backend" {
  name                = var.backend_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.plan.id
  tags                = var.tags

  site_config {
    application_stack {
      docker_image_name   = "${azurerm_container_registry.acr.login_server}/taskapp-backend:latest"
      docker_registry_url = "https://${azurerm_container_registry.acr.login_server}"
    }
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL      = "https://${azurerm_container_registry.acr.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME = azurerm_container_registry.acr.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD = azurerm_container_registry.acr.admin_password
    DB_HOST                         = azurerm_mssql_server.sql.fully_qualified_domain_name
    DB_NAME                         = azurerm_mssql_database.db.name
    DB_USER                         = var.sql_admin_user
    DB_PASSWORD                     = var.sql_admin_password
    PORT                            = "3001"
    NODE_ENV                        = var.environment
  }
}

# ─── Static Web App (Frontend) ──────────────────────────────
resource "azurerm_static_web_app" "frontend" {
  name                = "stapp-taskapp-frontend"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = var.tags
}
