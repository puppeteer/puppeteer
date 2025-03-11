resource "google_storage_bucket" "terragoat_website" {
  name          = "terragot-${var.environment}"
  location      = var.location
  force_destroy = true
  labels = {
    git_commit           = "2bdc0871a5f4505be58244029cc6485d45d7bb8e"
    git_file             = "terraform__gcp__gcs_tf"
    git_last_modified_at = "2022-01-19-17-02-27"
    git_last_modified_by = "jameswoolfenden"
    git_modifiers        = "jameswoolfenden__nimrodkor"
    git_org              = "bridgecrewio"
    git_repo             = "terragoat"
    yor_trace            = "bd00cd2e-f53f-4daf-8d4d-74c47846c1cc"
  }
}

resource "google_storage_bucket_iam_binding" "allow_public_read" {
  bucket  = google_storage_bucket.terragoat_website.id
  members = ["allUsers"]
  role    = "roles/storage.objectViewer"
}