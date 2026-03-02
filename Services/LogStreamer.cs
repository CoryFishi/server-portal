using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using server_portal.Hubs;
using server_portal.Models;

namespace server_portal.Services;

public sealed class LogStreamer
{
    private readonly DockerComposeService _docker;
    private readonly IHubContext<LogsHub> _hub;
    private readonly ILogger<LogStreamer> _logger;

    // serverId -> running task
    private readonly ConcurrentDictionary<string, Task> _streams = new(StringComparer.OrdinalIgnoreCase);

    public LogStreamer(DockerComposeService docker, IHubContext<LogsHub> hub, ILogger<LogStreamer> logger)
    {
        _docker = docker;
        _hub = hub;
        _logger = logger;
    }

    public void EnsureStreaming(string serverId)
    {
        // Starts streaming only once per serverId
        var added = _streams.TryAdd(serverId, Task.Run(() => StreamLoop(serverId)));
        _logger.LogInformation("EnsureStreaming called for {ServerId}. New stream: {Added}", serverId, added);
    }

    private async Task StreamLoop(string serverId)
    {
        var def = ServerDefinitions.ById(serverId);
        if (def is null)
        {
            _logger.LogWarning("ServerDefinition not found for {ServerId}", serverId);
            _streams.TryRemove(serverId, out _);
            return;
        }

        _logger.LogInformation("Starting log stream for {ServerId} (container: {ContainerName})", serverId, def.ContainerName);

        try
        {
            using var p = _docker.StartLogFollowProcess(def.ContainerName);
            _logger.LogInformation("Docker logs process started. PID: {ProcessId}", p.Id);

            var lineCount = 0;
            
            // Read stdout and stderr simultaneously
            var stdoutTask = Task.Run(async () =>
            {
                while (true)
                {
                    var line = await p.StandardOutput.ReadLineAsync();
                    if (line is null) break;
                    
                    lineCount++;
                    await _hub.Clients.Group(serverId).SendAsync("logLine", new { id = serverId, line });
                }
            });

            var stderrTask = Task.Run(async () =>
            {
                while (true)
                {
                    var line = await p.StandardError.ReadLineAsync();
                    if (line is null) break;
                    
                    _logger.LogError("Docker logs error output: {ErrorLine}", line);
                    await _hub.Clients.Group(serverId).SendAsync("logLine", new { id = serverId, line = $"[docker error] {line}" });
                }
            });

            await Task.WhenAll(stdoutTask, stderrTask);
            await p.WaitForExitAsync();
            
            _logger.LogInformation("Docker logs process exited. ExitCode: {ExitCode}, LinesRead: {Count}", p.ExitCode, lineCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming logs for {ServerId}", serverId);
            await _hub.Clients.Group(serverId).SendAsync("logLine", new { id = serverId, line = $"[log-stream error] {ex.Message}" });
        }
        finally
        {
            _streams.TryRemove(serverId, out _);
            _logger.LogInformation("Removed stream for {ServerId}", serverId);
        }
    }
}