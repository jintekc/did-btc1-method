export class DidBtc1Error extends Error {
  name: string = 'DidBtc1Error';
  type: string = 'DidBtc1Error';

  constructor(message: string, type?: string, name?: string, public data?: Record<string, any>) {
    super(message);
    this.type = type ?? this.type;
    this.name = name ?? this.name;
    this.data = data;

    // Ensures that instanceof works properly, the correct prototype chain when using inheritance,
    // and that V8 stack traces (like Chrome, Edge, and Node.js) are more readable and relevant.
    Object.setPrototypeOf(this, new.target.prototype);

    // Captures the stack trace in V8 engines (like Chrome, Edge, and Node.js).
    // In non-V8 environments, the stack trace will still be captured.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BitcoinRpcError);
    }
  }
}

export class Btc1KeyManagerError extends DidBtc1Error {
  constructor(message: string, type?: string, public data?: Record<string, any>) {
    super(message, type ?? 'Btc1KeyManagerError', 'Btc1KeyManagerError', data);
  }
}

export class BitcoinRpcError extends DidBtc1Error {
  constructor(message: string, type?: string, public data?: Record<string, any>) {
    super(message, type ?? 'BitcoinRpcError', 'BitcoinRpcError', data);
  }
}