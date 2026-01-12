namespace SAMS.Helpers
{
    public class FileUploadHelper
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<FileUploadHelper> _logger;

        public FileUploadHelper(IWebHostEnvironment env, ILogger<FileUploadHelper> logger)
        {
            _env = env;
            _logger = logger;
        }

        /// <summary>
        /// Upload file to specific folder with duplicate name handling
        /// </summary>
        public async Task<(bool success, string filePath, string message)> UploadFileAsync(
            IFormFile file,
            string folderName,
            string[] allowedExtensions = null!,
            long maxSizeInBytes = 10485760) // 10MB default
        {
            try
            {
                if (file == null || file.Length == 0)
                    return (false, null!, "No file uploaded");

                // Validate file extension
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (allowedExtensions != null && !allowedExtensions.Contains(fileExtension))
                    return (false, null!, $"File type {fileExtension} not allowed");

                // Validate file size
                if (file.Length > maxSizeInBytes)
                    return (false, null!, $"File size exceeds maximum allowed size of {maxSizeInBytes / 1048576}MB");

                // Get root path
                var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var uploadPath = Path.Combine(rootPath, "uploads", "Assets", folderName);

                // Create directory if not exists
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                // Handle duplicate filenames
                var fileName = Path.GetFileName(file.FileName);
                var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
                var finalFileName = fileName;
                int counter = 1;

                while (File.Exists(Path.Combine(uploadPath, finalFileName)))
                {
                    finalFileName = $"{fileNameWithoutExt}({counter}){fileExtension}";
                    counter++;
                }

                // Save file
                var filePath = Path.Combine(uploadPath, finalFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative path for database storage
                var relativePath = $"/uploads/Assets/{folderName}/{finalFileName}";
                return (true, relativePath, "File uploaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to {FolderName}", folderName);
                return (false, null!, $"File upload failed: {ex.Message}");
            }
        }

        public bool DeleteFile(string relativePath)
        {
            try
            {
                if (string.IsNullOrEmpty(relativePath))
                    return false;

                var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var fullPath = Path.Combine(rootPath, relativePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {Path}", relativePath);
                return false;
            }
        }

        public static string[] GetAllowedExtensions(string fileType)
        {
            return fileType.ToLower() switch
            {
                "image" => new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" },
                "document" => new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" },
                "all" => new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx" },
                _ => new[] { ".jpg", ".jpeg", ".png", ".pdf" }
            };
        }
    }
}
