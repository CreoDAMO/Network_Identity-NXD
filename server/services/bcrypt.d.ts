
declare module 'bcryptjs' {
  export function hash(data: string, rounds: number): Promise<string>;
  export function compare(data: string, hash: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
  export function hashSync(data: string, rounds: number): string;
  export function compareSync(data: string, hash: string): boolean;
  export function genSaltSync(rounds?: number): string;
}
