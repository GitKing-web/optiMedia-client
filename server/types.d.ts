declare module 'bcrypt' {
  export function hashSync(data: string, saltRounds: number): string
  export function hash(data: string, saltRounds: number): Promise<string>
  export function compareSync(data: string, encrypted: string): boolean
  export function compare(data: string, encrypted: string): Promise<boolean>
  export function genSaltSync(rounds?: number): string
  export function genSalt(rounds?: number): Promise<string>
}

declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number
  }

  export interface VerifyOptions {
    ignoreExpiration?: boolean
  }

  export interface JwtPayload {
    [key: string]: unknown
    sub?: string
    role?: string
    email?: string
  }

  export function sign(payload: string | object | Buffer, secretOrPrivateKey: string, options?: SignOptions): string
  export function verify(token: string, secretOrPublicKey: string, options?: VerifyOptions): string | JwtPayload
}
