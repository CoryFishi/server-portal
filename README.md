<a id="readme-top"></a>
<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<br />
<div align="center">
  <h3 align="center">Server Portal</h3>

  <p align="center">
    A self-hosted web portal for managing game servers (Minecraft, Palworld, Project Zomboid) backed by Docker Compose.
    <br />
    <a href="https://github.com/CoryFishi/server-portal/issues"><strong>Report Bug</strong></a>
    ·
    <a href="https://github.com/CoryFishi/server-portal/issues"><strong>Request Feature</strong></a>
  </p>
</div>

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about">About</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#local-development">Local Development</a></li>
        <li><a href="#production">Production</a></li>
      </ul>
    </li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#api--realtime">API & Realtime</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## About

Server Portal is a web app that lets you view and control game servers running as Docker containers.  
It uses Docker Compose profiles to start/stop individual servers from the UI/API, and streams container logs in real-time via SignalR.  
Supported server types in the default compose file include Minecraft (itzg/minecraft-server), Palworld (thijsvanloef/palworld-server-docker), and Project Zomboid (renegademaster/zomboid-dedicated-server).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Features

- List server definitions and show running/stopped status
- Start/stop a server using Docker Compose profiles
- Upload server content (ZIP) to the server’s `data/{id}` folder (2GB limit)
- Realtime log streaming using SignalR (`/hubs/logs`)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Built With

**Backend**
- ASP.NET Core (.NET 10)
- SignalR
- Swagger/OpenAPI (Swashbuckle)

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS
- @microsoft/signalr client

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### Prerequisites

- Docker + Docker Compose (v2)
- .NET SDK 10 (to run the API locally)
- Node.js (to run the UI locally)

### Local Development

1) Clone the repo
```
    git clone https://github.com/CoryFishi/server-portal.git
    cd server-portal
```
2) Start the API (ASP.NET Core)
```
    dotnet restore
    dotnet run
```
3) Start the UI (Vite dev server)
```
    cd portal-ui
    npm install
    npm run dev
```
- The backend CORS policy allows the Vite dev origin `http://localhost:5173`.

### Production

Your `.env.example` shows the intended production env vars and port binding.

Typical approach:

1) Build the UI
```
    cd portal-ui
    npm install
    npm run build
```
3) Serve the built UI from ASP.NET

- The API is configured to serve static files + fallback to `index.html` for an SPA.  
- Place the UI build output where ASP.NET serves static files (commonly `wwwroot/`), then run:

  ```
    dotnet publish -c Release
  ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Configuration

### serverdefinitions.json

`serverdefinitions.json` defines the servers shown in the portal (id/game/name/containerName).  
The backend uses the server id to start/stop a matching Docker Compose profile.

### docker-compose.yml

Each server entry in `docker-compose.yml` is attached to a `profiles:` entry and a `container_name`.  
Make sure:
- `serverdefinitions.json -> Id` matches the compose profile name
- `serverdefinitions.json -> ContainerName` matches `container_name`

### Environment Variables

See `.env.example` for production defaults (environment, URLs/port, optional Docker host).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## API & Realtime

### REST API

- GET /api/servers → list servers + running/stopped status
- POST /api/servers/{id}/start → start server profile
- POST /api/servers/{id}/stop → stop server profile
- POST /api/servers/{id}/upload → upload ZIP to `data/{id}`
- POST /api/upload → upload/create a new modpack (expects fields like modpackId, modpackName, etc.)

### SignalR Logs

- Hub: /hubs/logs
- Client calls JoinServer(serverId) to subscribe (server streams docker logs -f)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Roadmap

- [ ] Auth (basic login + roles)
- [ ] Create/edit server definitions from the UI (instead of editing JSON manually)
- [ ] Better validation for docker-compose profile/container mapping
- [ ] One-click restart (stop + start)
- [ ] Server metrics (CPU/RAM) per container

See the open issues page for planned work: https://github.com/CoryFishi/server-portal/issues

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/CoryFishi/server-portal.svg?style=for-the-badge
[contributors-url]: https://github.com/CoryFishi/server-portal/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/CoryFishi/server-portal.svg?style=for-the-badge
[forks-url]: https://github.com/CoryFishi/server-portal/network/members
[stars-shield]: https://img.shields.io/github/stars/CoryFishi/server-portal.svg?style=for-the-badge
[stars-url]: https://github.com/CoryFishi/server-portal/stargazers
[issues-shield]: https://img.shields.io/github/issues/CoryFishi/server-portal.svg?style=for-the-badge
[issues-url]: https://github.com/CoryFishi/server-portal/issues
[license-shield]: https://img.shields.io/github/license/CoryFishi/server-portal.svg?style=for-the-badge
[license-url]: https://github.com/CoryFishi/server-portal/blob/master/LICENSE.txt
