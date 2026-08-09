declare const __dirname: string;

declare module 'fs' {
  const fs: {
    existsSync(path: string): boolean;
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    statSync(path: string): { size: number };
    writeFileSync(path: string, data: string | Uint8Array): void;
  };
  export default fs;
}

declare module 'path' {
  const path: {
    basename(filePath: string): string;
    join(...parts: string[]): string;
  };
  export default path;
}

declare module 'pngjs' {
  export class PNG {
    constructor(options: { width: number; height: number });
    width: number;
    height: number;
    data: Uint8Array;
    static sync: {
      write(png: PNG): Uint8Array;
    };
  }
}
