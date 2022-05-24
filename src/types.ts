import type { CookieSerializeOptions } from "./cookie";
import type { BinaryLike as CBinaryLike } from "crypto";

export interface SessionOptions {
  key?: string;
  secret: CBinaryLike | { id: number; secret: CBinaryLike }[];
  expires?: number;
  rolling?: true | number;
  cookie?: Omit<CookieSerializeOptions, "expires" | "maxAge" | "encode">;
}

export interface Session<SessionType = Record<string, any>> {
  shouldSendToClient?: boolean;
  data: (data?: SessionType) => Promise<
    SessionType & {
      expires?: Date;
    }
  >;
  refresh: (expires_in_days?: number) => Promise<boolean>;
  destroy: () => Promise<boolean>;
}

export interface PrivateSession {
  "set-cookie"?: string | undefined;
}

export type BinaryLike = CBinaryLike;
