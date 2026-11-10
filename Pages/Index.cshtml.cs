using Microsoft.AspNetCore.Mvc.RazorPages;

namespace MeuPortfolio.Pages
{
    public class IndexModel(IWebHostEnvironment env) : PageModel
    {
        private const string ProfilePicsFolder = "profilepics";

        private static readonly HashSet<string> ImageExtensions =
            new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif" };

        /// <summary>Imagens de wwwroot/profilepics, em ordem alfabética.</summary>
        public IReadOnlyList<string> ProfilePics { get; private set; } = [];

        public string AssetVersion { get; } = DateTime.UtcNow.ToString("yyyyMMddHHmm");

        public void OnGet()
        {
            var folder = Path.Combine(env.WebRootPath, ProfilePicsFolder);
            if (!Directory.Exists(folder))
                return;

            ProfilePics = Directory.EnumerateFiles(folder)
                .Where(file => ImageExtensions.Contains(Path.GetExtension(file)))
                .Select(file => Path.GetFileName(file))
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .Select(name => $"{ProfilePicsFolder}/{Uri.EscapeDataString(name)}")
                .ToList();
        }
    }
}
