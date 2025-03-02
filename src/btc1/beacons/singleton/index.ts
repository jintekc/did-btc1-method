
export class SingletonBeacon {
  public static type: string = 'SingletonBeacon';

  public id: string;
  public serviceEndpoint: string;

  constructor(id: string, serviceEndpoint: string) {
    this.id = id;
    this.serviceEndpoint = serviceEndpoint;
  }

  get service() {
    return {
      type            : SingletonBeacon.type,
      id              : this.id,
      serviceEndpoint : this.serviceEndpoint
    };
  }
}