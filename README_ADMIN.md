# Admin Guide: Adding New Minecraft Modpacks

This guide shows how to add new Minecraft modpacks to the server portal.

## Quick Steps

1. Add a new service in `docker-compose.yml`
2. Add a new entry in `Models/ServerDefinitions.cs`
3. Restart the backend
4. Create the data folder
5. Tell friends to extract modpack files into that folder

## Detailed Steps

### 1. Update `docker-compose.yml`

Add a new service for the modpack. Template:

```yaml
  mc_<modpack_id>:
    container_name: serverportal_mc_<modpack_id>
    image: itzg/minecraft-server:java21
    profiles: ["mc_<modpack_id>"]
    environment:
      EULA: "TRUE"
      TYPE: "FORGE"  # or "FABRIC" or "PAPER"
      VERSION: "1.20.1"  # Match the modpack's Minecraft version
      MEMORY: "10G"  # Adjust based on modpack requirements
      ENABLE_RCON: "true"
      RCON_PASSWORD: "change-me"
      RCON_PORT: "25575"
    ports:
      - "25565:25565"  # OK since only one server runs at a time
      - "25575:25575"
    volumes:
      - ./data/mc_<modpack_id>:/data
    restart: unless-stopped
```

**Example for "All The Mods 10":**

```yaml
  mc_atm10:
    container_name: serverportal_mc_atm10
    image: itzg/minecraft-server:java21
    profiles: ["mc_atm10"]
    environment:
      EULA: "TRUE"
      TYPE: "NEOFORGE"  # ATM10 uses NeoForge
      VERSION: "1.21.1"
      MEMORY: "12G"
    ports:
      - "25565:25565"
      - "25575:25575"
    volumes:
      - ./data/mc_atm10:/data
    restart: unless-stopped
```

### 2. Update `Models/ServerDefinitions.cs`

Add a new entry to the `All` array:

```csharp
public static readonly ServerDef[] All =
[
    new("mc_paper_121", "Minecraft Paper 1.21.1", "serverportal_mc_paper_121"),
    new("mc_atm9", "Minecraft - ATM9 (Forge)", "serverportal_mc_atm9"),
    new("mc_atm10", "Minecraft - ATM10 (NeoForge)", "serverportal_mc_atm10"),  // NEW
    new("mc_prominence2", "Minecraft - Prominence II (Fabric)", "serverportal_mc_prominence2"),
    new("palworld", "Palworld", "serverportal_palworld"),
    new("zomboid", "Project Zomboid", "serverportal_zomboid"),
];
```

**Parameters:**
- **First string**: Profile ID (must match docker-compose.yml profile)
- **Second string**: Display name shown in UI
- **Third string**: Container name (must match docker-compose.yml container_name)

### 3. Find Modpack Details

Before adding a modpack, check the manifest or server files:

**For CurseForge modpacks:**
1. Download and extract the server files
2. Look for `manifest.json`:
   ```json
   {
     "minecraft": {
       "version": "1.20.1",
       "modLoaders": [
         { "id": "forge-47.3.0" }
       ]
     }
   }
   ```
3. Set `VERSION` to the Minecraft version
4. Set `TYPE` based on mod loader:
   - `forge-*` → `TYPE: "FORGE"`
   - `fabric-*` → `TYPE: "FABRIC"`
   - `neoforge-*` → `TYPE: "NEOFORGE"`

### 4. Memory Requirements

Common memory recommendations:

| Modpack Size | Recommended Memory |
|--------------|-------------------|
| Light (< 50 mods) | 4-6G |
| Medium (50-150 mods) | 6-10G |
| Heavy (150-250 mods) | 10-14G |
| Extreme (250+ mods) | 14-20G |

### 5. Create Data Folder

Create the folder where modpack files will go:

```powershell
New-Item -ItemType Directory -Path "data\mc_<modpack_id>"
```

### 6. Test the Server

1. Extract modpack server files into the data folder
2. Start the backend
3. Use the portal to start the server
4. Check logs for errors
5. Verify the server starts successfully

## Port Management

Currently, all Minecraft servers use port **25565** because only one server runs at a time.

**If you want multiple servers running simultaneously:**

1. Assign different ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "25565:25565"  # First server
     - "25566:25565"  # Second server (maps host 25566 to container 25565)
   ```

2. Remove or modify `StartExclusiveAsync` logic to allow multiple servers

3. Update UI to show which port each server uses

## Troubleshooting

### Server won't start

**Check logs for:**
- Missing Forge/Fabric installer
- Incorrect Minecraft version
- Insufficient memory
- Port conflicts

**Common fixes:**
- Increase `MEMORY` value
- Verify `TYPE` and `VERSION` match modpack
- Check if modpack needs manual setup script run first

### Logs show "Error: Invalid or corrupt jarfile"

The modpack may need Forge/Fabric installed first. Some options:

1. Let `itzg/minecraft-server` auto-install (usually works)
2. Run the modpack's `startserver.bat` once manually
3. Pre-install Forge/Fabric in the data folder

### Container exits immediately

Check:
- EULA acceptance (should be `"TRUE"`)
- Valid Minecraft version
- Sufficient disk space
- Docker logs: `docker logs serverportal_mc_<id>`

## Naming Conventions

**Recommended ID format:**
- Vanilla: `mc_vanilla_121` (Minecraft version)
- Modpacks: `mc_<modpack_name>` (lowercase, no spaces)
- Examples: `mc_atm9`, `mc_enigmatica9`, `mc_prominence2`

**Container naming:**
- Always prefix with `serverportal_`
- Use same ID: `serverportal_mc_atm9`

## Advanced: Modpack-Specific Environment Variables

Some modpacks need extra configuration:

```yaml
environment:
  # Standard
  EULA: "TRUE"
  TYPE: "FORGE"
  VERSION: "1.20.1"
  MEMORY: "10G"
  
  # Optional: Force specific Forge version
  FORGE_VERSION: "47.3.0"
  
  # Optional: Copy modpack files instead of direct mount
  # MODPACK_URL: "https://example.com/modpack.zip"
  
  # Optional: Java args for performance
  JVM_OPTS: "-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions"
```

See [itzg/minecraft-server docs](https://github.com/itzg/docker-minecraft-server) for all options.

## Rollback

To remove a modpack:

1. Stop the server in the portal
2. Remove the service from `docker-compose.yml`
3. Remove the entry from `ServerDefinitions.cs`
4. (Optional) Delete the data folder
5. Restart the backend

## Next Steps

After adding modpacks successfully, consider:

- **UI enhancement**: Show folder path for each server
- **Auto-detection**: Scan `data/` folder for server files
- **Upload feature**: Let friends upload zips through web UI
- **Modpack manager**: Automatically download from CurseForge API
