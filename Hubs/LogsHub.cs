using Microsoft.AspNetCore.SignalR;
using server_portal.Services;

namespace server_portal.Hubs;

public class LogsHub : Hub
{
    private readonly LogStreamer _streamer;

    public LogsHub(LogStreamer streamer)
    {
        _streamer = streamer;
    }

    public async Task JoinServer(string serverId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, serverId);
        
        // Start streaming logs for this server
        _streamer.EnsureStreaming(serverId);
    }

    public async Task LeaveServer(string serverId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, serverId);
    }
}