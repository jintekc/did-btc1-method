export class DidBtc1Error extends Error {
  name: string;
  type: string;
  message: string;

  constructor(message: string, type: string = 'DidBtc1Error') {
    super();
    this.name = type;
    this.type = type;
    this.message = message;
  }
}