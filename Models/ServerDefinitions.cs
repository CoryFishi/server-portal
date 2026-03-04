using System.Text.Json;

namespace server_portal.Models;

public static class ServerDefinitions
{
    private static ServerDef[]? _cache;
    private static readonly string _filePath = "serverdefinitions.json";

    public static ServerDef[] All
    {
        get
        {
            if (_cache == null)
            {
                LoadFromFile();
            }
            return _cache ?? [];
        }
    }

    public static ServerDef? ById(string id) =>
        All.FirstOrDefault(x => string.Equals(x.Id, id, StringComparison.OrdinalIgnoreCase));

    public static void Reload()
    {
        _cache = null;
        LoadFromFile();
    }

    private static void LoadFromFile()
    {
        try
        {
            if (File.Exists(_filePath))
            {
                var json = File.ReadAllText(_filePath);
                _cache = JsonSerializer.Deserialize<ServerDef[]>(json) ?? [];
            }
            else
            {
                _cache = [];
            }
        }
        catch
        {
            _cache = [];
        }
    }

    public static void AddOrUpdate(ServerDef def)
    {
        var list = All.ToList();
        var existing = list.FindIndex(x => x.Id.Equals(def.Id, StringComparison.OrdinalIgnoreCase));
        
        if (existing >= 0)
            list[existing] = def;
        else
            list.Add(def);

        SaveToFile(list.ToArray());
        Reload();
    }

    private static void SaveToFile(ServerDef[] definitions)
    {
        var json = JsonSerializer.Serialize(definitions, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(_filePath, json);
    }
}

public record ServerDef(string Id, string Game, string Name, string ContainerName);