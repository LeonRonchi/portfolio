namespace MeuPortfolio;

/// <summary>
/// Gera a versão estática do site (index.html + wwwroot) para o GitHub Pages.
/// Uso: <c>dotnet run -- --export _site</c>
/// </summary>
public static class StaticExport
{
    private static readonly string[] SkippedFolders = ["lib"];

    public static async Task RunAsync(WebApplication app, string outputDir)
    {
        var output = Path.GetFullPath(outputDir);
        var webRoot = app.Environment.WebRootPath;

        app.Urls.Clear();
        app.Urls.Add("http://127.0.0.1:0");
        await app.StartAsync();

        try
        {
            Directory.CreateDirectory(output);

            using var http = new HttpClient { BaseAddress = new Uri(app.Urls.First()) };
            var html = await http.GetStringAsync("/");
            await File.WriteAllTextAsync(Path.Combine(output, "index.html"), html);

            var copied = 0;
            foreach (var file in Directory.EnumerateFiles(webRoot, "*", SearchOption.AllDirectories))
            {
                var relative = Path.GetRelativePath(webRoot, file);
                var topFolder = relative.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)[0];
                if (SkippedFolders.Contains(topFolder, StringComparer.OrdinalIgnoreCase))
                    continue;

                var target = Path.Combine(output, relative);
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                File.Copy(file, target, overwrite: true);
                copied++;
            }

            Console.WriteLine($"Site estático gerado em {output} (index.html + {copied} arquivos).");
        }
        finally
        {
            await app.StopAsync();
        }
    }
}
