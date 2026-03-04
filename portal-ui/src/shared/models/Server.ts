export class Server {
  public id: number;
  public name: string;
  public game: string;
  public status:
    | "online"
    | "offline"
    | "starting"
    | "stopping"
    | "stopped"
    | "running";

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
    this.game = "Unknown";
    this.status = "offline";
  }
}
