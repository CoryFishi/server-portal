# How to Add a Minecraft Modpack

This guide shows how to add a Minecraft modpack to the server portal (for non-technical friends).

## Steps

### 1. Download the Server Files

1. Go to the modpack page on **CurseForge**
2. Look for the **"Server Files"** or **"Server Pack"** download button
   - ⚠️ **Do NOT download the regular modpack zip** (that's for client launchers)
3. Download the server files zip

### 2. Extract to the Correct Folder

Extract the downloaded zip into the appropriate folder:

- **ATM9**: Extract into `server-portal/data/mc_atm9/`
- **Prominence II**: Extract into `server-portal/data/mc_prominence2/`
- **Other modpacks**: Check with the admin for the folder name

**Important**: After extraction, the folder should look like this:

```
data/mc_atm9/
├── mods/
├── config/
├── server.properties
├── (other server files)
```

**NOT like this** (avoid nested folders):

```
data/mc_atm9/
└── Server-Files/
    └── Server-Files/
        ├── mods/
        ├── config/
```

If you have nested folders, move everything up one level.

### 3. Start the Server

1. Go to the Server Portal web interface
2. Select the modpack from the list
3. Click **Start**
4. Watch the logs to see the server starting up

## Currently Available Servers

| Server ID | Name | Type | Folder Location |
|-----------|------|------|-----------------|
| `mc_paper_121` | Minecraft Paper 1.21.1 | Vanilla-ish | `data/mc_paper_121/` |
| `mc_atm9` | All The Mods 9 | Forge Modpack | `data/mc_atm9/` |
| `mc_prominence2` | Prominence II RPG | Fabric Modpack | `data/mc_prominence2/` |
| `palworld` | Palworld | Game Server | `data/palworld/` |
| `zomboid` | Project Zomboid | Game Server | `data/zomboid/` |

## Important Notes

### Multiple Servers at Once

- ⚠️ **Only ONE server can run at a time** (they share port 25565)
- Starting a new server will automatically stop any running server

### First-Time Setup

Some modpacks need a first-time setup:

1. The admin may need to run `startserver.bat` once manually
2. Some packs auto-install Forge/Fabric on first run
3. Be patient - first startup can take 5-10 minutes

### Modpack Not Working?

If a modpack doesn't start:

1. Check the logs in the portal
2. Verify the Minecraft version in `server.properties` or `manifest.json`
3. Make sure the mod loader (Forge/Fabric) version is correct
4. Ask the admin to check the docker-compose.yml settings

## For Admins: Adding New Modpacks

See `README_ADMIN.md` for instructions on adding new modpack entries to the portal.
