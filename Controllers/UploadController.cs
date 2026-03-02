using Microsoft.AspNetCore.Mvc;
using server_portal.Models;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace server_portal.Controllers;

[ApiController]
[Route("api")]
public class UploadController : ControllerBase
{
    [HttpPost("upload")]
    [RequestSizeLimit(2_000_000_000)]
    public async Task<IActionResult> UploadNewModpack(
        [FromForm] string modpackId, 
        [FromForm] string modpackName,
        [FromForm] string minecraftVersion,
        [FromForm] string modLoader, // "FORGE", "FABRIC", "NEOFORGE"
        [FromForm] string memory, // e.g., "10G"
        IFormFile file, 
        [FromForm] bool force = false)
    {
        // Validate modpack ID format
        if (string.IsNullOrWhiteSpace(modpackId) || !modpackId.StartsWith("mc_"))
            return BadRequest(new { error = "Modpack ID must start with 'mc_'" });

        if (!System.Text.RegularExpressions.Regex.IsMatch(modpackId, @"^mc_[a-z0-9_]+$"))
            return BadRequest(new { error = "Modpack ID can only contain lowercase letters, numbers, and underscores" });

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only .zip files are allowed" });

        var dataFolder = Path.Combine(Directory.GetCurrentDirectory(), "data", modpackId);
        
        // Check if modpack already exists
        if (Directory.Exists(dataFolder) && Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length > 0)
        {
            if (!force)
            {
                return Conflict(new 
                { 
                    error = "Modpack files already exist.",
                    existingFiles = Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length,
                    modpackId
                });
            }
        }

        Directory.CreateDirectory(dataFolder);
        var zipPath = Path.Combine(dataFolder, "modpack_upload.zip");
        
        try
        {
            // Save the zip file
            await using (var stream = new FileStream(zipPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Extract zip
            System.IO.Compression.ZipFile.ExtractToDirectory(zipPath, dataFolder, overwriteFiles: force);
            System.IO.File.Delete(zipPath);

            // FIX NESTED FOLDERS
            var nestingFixed = FixNestedFolders(dataFolder);

            // AUTO-DETECT mod loader version from extracted files
            var detectedVersion = DetectModLoaderVersion(dataFolder, modLoader);

            // AUTO-CONFIGURE: Add to docker-compose.yml
            UpdateDockerCompose(modpackId, minecraftVersion, modLoader, detectedVersion, memory);

            // AUTO-CONFIGURE: Add to ServerDefinitions
            ServerDefinitions.AddOrUpdate(new ServerDef(
                modpackId,
                modpackName ?? $"Minecraft - {modpackId}",
                $"serverportal_{modpackId}"
            ));

            return Ok(new 
            { 
                message = "Modpack uploaded and configured successfully!",
                modpackId,
                folder = $"data/{modpackId}",
                filesExtracted = Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length,
                autoConfigured = true,
                nestingFixed = nestingFixed > 0,
                nestingLevelsRemoved = nestingFixed,
                modLoaderVersionDetected = detectedVersion,
                nextStep = "Restart the backend to load new configuration"
            });
        }
        catch (Exception ex)
        {
            if (System.IO.File.Exists(zipPath))
                System.IO.File.Delete(zipPath);

            return StatusCode(500, new { error = $"Failed: {ex.Message}" });
        }
    }

    private string? DetectModLoaderVersion(string dataFolder, string modLoader)
    {
        try
        {
            switch (modLoader.ToUpper())
            {
                case "NEOFORGE":
                case "FORGE":
                    return DetectForgeOrNeoForgeVersion(dataFolder);

                case "FABRIC":
                    return DetectFabricVersion(dataFolder);

                default:
                    return null;
            }
        }
        catch
        {
            return null; // Let Docker image auto-select if detection fails
        }
    }

    private string? DetectForgeOrNeoForgeVersion(string dataFolder)
    {
        // Check all .sh files for version info
        var shFiles = Directory.GetFiles(dataFolder, "*.sh", SearchOption.TopDirectoryOnly);
        foreach (var shFile in shFiles)
        {
            var content = System.IO.File.ReadAllText(shFile);

            // Look for variable declarations like: NEOFORGE_VERSION=21.1.119 or FORGE_VERSION=47.3.0
            var versionVarMatch = System.Text.RegularExpressions.Regex.Match(content, @"(?:NEOFORGE|FORGE)_VERSION\s*=\s*(\d+\.\d+\.\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (versionVarMatch.Success)
                return versionVarMatch.Groups[1].Value;

            // Look for patterns like: neoforge-21.1.119 or forge-47.3.0
            var neoforgeMatch = System.Text.RegularExpressions.Regex.Match(content, @"neoforge[/-](\d+\.\d+\.\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (neoforgeMatch.Success)
                return neoforgeMatch.Groups[1].Value;

            var forgeMatch = System.Text.RegularExpressions.Regex.Match(content, @"forge[/-](\d+\.\d+\.\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (forgeMatch.Success)
                return forgeMatch.Groups[1].Value;
        }

        // Check libraries folder structure
        var librariesPath = Path.Combine(dataFolder, "libraries", "net", "neoforged", "neoforge");
        if (Directory.Exists(librariesPath))
        {
            var versionDirs = Directory.GetDirectories(librariesPath);
            if (versionDirs.Length > 0)
            {
                var version = Path.GetFileName(versionDirs[0]);
                if (!string.IsNullOrEmpty(version))
                    return version;
            }
        }

        // Check for forge in libraries
        librariesPath = Path.Combine(dataFolder, "libraries", "net", "minecraftforge", "forge");
        if (Directory.Exists(librariesPath))
        {
            var versionDirs = Directory.GetDirectories(librariesPath);
            if (versionDirs.Length > 0)
            {
                var fullVersion = Path.GetFileName(versionDirs[0]);
                // Forge versions are like "1.21.1-52.0.23", we want just "52.0.23"
                var match = System.Text.RegularExpressions.Regex.Match(fullVersion, @"[\d.]+-([\d.]+)");
                if (match.Success)
                    return match.Groups[1].Value;
            }
        }

        return null;
    }

    private string? DetectFabricVersion(string dataFolder)
    {
        // Check fabric-server-launcher.properties
        var fabricProps = Path.Combine(dataFolder, "fabric-server-launcher.properties");
        if (System.IO.File.Exists(fabricProps))
        {
            var lines = System.IO.File.ReadAllLines(fabricProps);
            foreach (var line in lines)
            {
                if (line.StartsWith("fabricLoaderVersion=", StringComparison.OrdinalIgnoreCase))
                {
                    return line.Split('=')[1].Trim();
                }
            }
        }

        return null;
    }

    private void UpdateDockerCompose(string modpackId, string minecraftVersion, string modLoader, string? modLoaderVersion, string memory)
    {
        var composeFile = Path.Combine(Directory.GetCurrentDirectory(), "docker-compose.yml");

        if (!System.IO.File.Exists(composeFile))
            return;

        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        var serializer = new SerializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .Build();

        var yaml = System.IO.File.ReadAllText(composeFile);
        var compose = deserializer.Deserialize<Dictionary<string, object>>(yaml);

        if (compose.TryGetValue("services", out var servicesObj) && servicesObj is Dictionary<object, object> services)
        {
            var environment = new Dictionary<object, object>
            {
                ["EULA"] = "TRUE",
                ["TYPE"] = modLoader.ToUpper(),
                ["VERSION"] = minecraftVersion,
                ["MEMORY"] = memory,
                ["ENABLE_RCON"] = "true",
                ["RCON_PASSWORD"] = "change-me",
                ["RCON_PORT"] = "25575"
            };

            // Add specific mod loader version environment variable (if detected)
            if (!string.IsNullOrEmpty(modLoaderVersion))
            {
                switch (modLoader.ToUpper())
                {
                    case "NEOFORGE":
                        environment["NEOFORGE_VERSION"] = modLoaderVersion;
                        break;
                    case "FORGE":
                        environment["FORGE_VERSION"] = modLoaderVersion;
                        break;
                    case "FABRIC":
                        environment["FABRIC_LOADER_VERSION"] = modLoaderVersion;
                        break;
                }
            }

            // Add new service
            services[modpackId] = new Dictionary<object, object>
            {
                ["container_name"] = $"serverportal_{modpackId}",
                ["image"] = "itzg/minecraft-server:java21",
                ["profiles"] = new List<object> { modpackId },
                ["environment"] = environment,
                ["ports"] = new List<object>
                {
                    "25565:25565",
                    "25575:25575"
                },
                ["volumes"] = new List<object>
                {
                    $"./data/{modpackId}:/data"
                },
                ["restart"] = "unless-stopped"
            };

            var updatedYaml = serializer.Serialize(compose);
            System.IO.File.WriteAllText(composeFile, updatedYaml);
        }
    }

    private int FixNestedFolders(string rootFolder)
    {
        int levelsRemoved = 0;

        while (true)
        {
            // Get all items in root folder
            var directories = Directory.GetDirectories(rootFolder);
            var files = Directory.GetFiles(rootFolder);

            // Check if root already has server files - if so, no need to fix
            if (HasServerFiles(rootFolder))
            {
                break; // Structure is correct
            }

            // Look for a single subdirectory that contains server files
            if (directories.Length >= 1)
            {
                // Find the first subdirectory with server files
                string? serverDir = null;
                foreach (var dir in directories)
                {
                    if (HasServerFiles(dir))
                    {
                        serverDir = dir;
                        break;
                    }
                }

                if (serverDir != null)
                {
                    // Move all contents from this subdirectory up
                    MoveDirectoryContents(serverDir, rootFolder);

                    // Delete the now-empty subdirectory
                    try
                    {
                        Directory.Delete(serverDir, recursive: true);
                    }
                    catch
                    {
                        // Ignore errors
                    }

                    levelsRemoved++;
                    continue; // Check again for more nesting
                }
            }

            // No nesting found or fixed
            break;
        }

        return levelsRemoved;
    }

    private bool HasServerFiles(string directory)
    {
        // Check for common Minecraft server files/folders
        var serverIndicators = new[]
        {
            "mods",           // Most reliable - mods folder
            "config",         // Config folder
            "server.properties",
            "eula.txt",
            "libraries",
            "kubejs",
            "defaultconfigs",
            "world",
            "server.jar",     // Vanilla server
            "forge-installer.jar"
        };

        int found = 0;
        foreach (var indicator in serverIndicators)
        {
            var path = Path.Combine(directory, indicator);
            if (Directory.Exists(path) || System.IO.File.Exists(path))
            {
                found++;
                // If we find at least 2 indicators, we're confident this is the server folder
                if (found >= 2 || indicator == "mods") // mods folder is definitive
                    return true;
            }
        }

        return found >= 1; // At least one indicator
    }

    private void MoveDirectoryContents(string sourceDir, string targetDir)
    {
        // Move all files
        foreach (var file in Directory.GetFiles(sourceDir))
        {
            var fileName = Path.GetFileName(file);
            var destFile = Path.Combine(targetDir, fileName);

            // Skip if destination exists and is the same
            if (System.IO.File.Exists(destFile))
            {
                // Keep the file from nested folder (usually newer/correct)
                System.IO.File.Delete(destFile);
            }

            System.IO.File.Move(file, destFile);
        }

        // Move all directories
        foreach (var dir in Directory.GetDirectories(sourceDir))
        {
            var dirName = Path.GetFileName(dir);
            var destDir = Path.Combine(targetDir, dirName);

            if (Directory.Exists(destDir))
            {
                // Merge directories instead of replacing
                MoveDirectoryContents(dir, destDir);
                try
                {
                    Directory.Delete(dir, recursive: true);
                }
                catch
                {
                    // Ignore
                }
            }
            else
            {
                Directory.Move(dir, destDir);
            }
        }
    }
}