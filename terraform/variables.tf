variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  default     = "rg-taskapp-tf"
}

variable "location" {
  description = "Azure region for all resources"
  default     = "East US"
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  default     = "dev"
}

variable "acr_name" {
  description = "Azure Container Registry name (globally unique, lowercase, no hyphens)"
  type        = string
}

variable "backend_app_name" {
  description = "Name of the backend App Service"
  type        = string
}

variable "sql_server_name" {
  description = "Azure SQL Server name"
  type        = string
}

variable "sql_admin_user" {
  description = "SQL Server admin username"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server admin password"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags for all resources"
  type        = map(string)
  default = {
    Project     = "TaskApp"
    Environment = "Lab"
    ManagedBy   = "Terraform"
  }
}
