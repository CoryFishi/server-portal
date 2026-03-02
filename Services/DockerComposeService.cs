using System.Diagnostics;
using server_portal.Models;

namespace server_portal.Services;

public sealed class DockerComposeService
{
    private readonly string _workingDir;
    private readonly string _composeFile;


    public DockerComposeService(IWebHostEnvironment env)
    {
        _workingDir = Path.GetFullPath(Path.Combine(env.ContentRootPath, ".."));
        _composeFile = Path.Combine(env.ContentRootPath, "docker-compose.yml");
    }

    public Task StartAsync(string profile, CancellationToken ct = default) =>
        RunAsync(profile, args: $"--profile {profile} up -d", ct);

    public Task StopAsync(string profile, CancellationToken ct = default) =>
        RunAsync(profile, args: $"--profile {profile} down", ct);

    private async Task RunAsync(string profile, string args, CancellationToken ct)
    {
        var def = ServerDefinitions.ById(profile);
        if (def is null)
            throw new InvalidOperationException("Unknown server id.");

        var psi = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = $"compose -f \"{_composeFile}\" {args}",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var p = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start docker process.");

        var stdout = await p.StandardOutput.ReadToEndAsync(ct);
        var stderr = await p.StandardError.ReadToEndAsync(ct);

        await p.WaitForExitAsync(ct);

        if (p.ExitCode != 0)
            throw new InvalidOperationException($"Docker failed ({p.ExitCode}).\n{stderr}\n{stdout}");
    }

    public async Task<HashSet<string>> GetRunningAsync(CancellationToken ct = default)
    {
        // docker ps --format {{.Names}}
        var output = await RunCaptureAsync("ps --format {{.Names}}", ct);

        return output
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private async Task<string> RunCaptureAsync(string args, CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = args,
            WorkingDirectory = _workingDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var p = Process.Start(psi) ?? throw new InvalidOperationException("Failed to start docker process.");
        var stdout = await p.StandardOutput.ReadToEndAsync(ct);
        var stderr = await p.StandardError.ReadToEndAsync(ct);
        await p.WaitForExitAsync(ct);

        if (p.ExitCode != 0)
            throw new InvalidOperationException($"Docker failed ({p.ExitCode}).\n{stderr}\n{stdout}");

        return stdout.Trim();
    }

    public async Task StartExclusiveAsync(string profile, CancellationToken ct = default)
    {
        var def = ServerDefinitions.ById(profile);
        if (def is null)
            throw new InvalidOperationException("Unknown server id.");

        // Stop any other running servers first
        var running = await GetRunningAsync(ct);

        foreach (var server in ServerDefinitions.All)
        {
            if (!server.Id.Equals(profile, StringComparison.OrdinalIgnoreCase) &&
                running.Contains(server.ContainerName))
            {
                await StopAsync(server.Id, ct);
            }
        }

        await StartAsync(profile, ct);
    }

    public Process StartLogFollowProcess(string containerName)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = $"logs -f --tail 200 {containerName}",
            WorkingDirectory = _workingDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        return Process.Start(psi) ?? throw new InvalidOperationException("Failed to start docker logs.");
    }
}