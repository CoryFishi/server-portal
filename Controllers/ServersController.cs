using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using server_portal.Hubs;
using server_portal.Models;
using server_portal.Services;

namespace server_portal.Controllers;

[ApiController]
[Route("api/servers")]
public class ServersController : ControllerBase
{
    private readonly DockerComposeService _docker;
    private readonly IHubContext<LogsHub> _hub;
    private readonly LogStreamer _logs;

    public ServersController(DockerComposeService docker, IHubContext<LogsHub> hub, LogStreamer logs)
    {
        _docker = docker;
        _hub = hub;
        _logs = logs;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var running = await _docker.GetRunningAsync(ct);

        var servers = ServerDefinitions.All.Select(def => new
        {
            id = def.Id,
            name = def.Name,
            game = def.Game,
            status = running.Contains(def.ContainerName) ? "running" : "stopped"
        });

        return Ok(servers);
    }

    [HttpPost("{id}/start")]
    public async Task<IActionResult> Start(string id)
    {
        await _docker.StartExclusiveAsync(id, CancellationToken.None);
        return Ok(new { id, action = "start", ok = true });
    }

    [HttpPost("{id}/stop")]
    public async Task<IActionResult> Stop(string id)
    {
        await _docker.StopAsync(id, CancellationToken.None);
        return Ok(new { id, action = "stop", ok = true });
    }

    [HttpPost("{id}/upload")]
    [RequestSizeLimit(2_000_000_000)] // 2GB limit
    public async Task<IActionResult> UploadModpack(string id, IFormFile file, [FromForm] bool force = false)
    {
        var def = ServerDefinitions.ById(id);
        if (def is null)
            return NotFound(new { error = "Server not found" });

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only .zip files are allowed" });

        var dataFolder = Path.Combine(Directory.GetCurrentDirectory(), "data", id);
        
        // Check if modpack already exists
        if (Directory.Exists(dataFolder) && Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length > 0)
        {
            if (!force)
            {
                return Conflict(new 
                { 
                    error = "Modpack files already exist. Use force=true to overwrite.",
                    existingFiles = Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length
                });
            }
        }

        Directory.CreateDirectory(dataFolder);

        var zipPath = Path.Combine(dataFolder, "modpack_upload.zip");
        
        try
        {
            await using (var stream = new FileStream(zipPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            System.IO.Compression.ZipFile.ExtractToDirectory(zipPath, dataFolder, overwriteFiles: force);

            System.IO.File.Delete(zipPath);

            return Ok(new 
            { 
                message = force ? "Modpack overwritten successfully" : "Modpack uploaded and extracted successfully",
                folder = $"data/{id}",
                filesExtracted = Directory.GetFiles(dataFolder, "*", SearchOption.AllDirectories).Length
            });
        }
        catch (Exception ex)
        {
            // Clean up zip if extraction failed
            if (System.IO.File.Exists(zipPath))
                System.IO.File.Delete(zipPath);

            return StatusCode(500, new { error = $"Failed to extract modpack: {ex.Message}" });
        }
    }
}