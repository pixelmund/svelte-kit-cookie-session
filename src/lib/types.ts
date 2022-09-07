import type { BinaryLike as CBinaryLike } from 'crypto';

export interface SessionOptions {
	key?: string;
	secret: CBinaryLike | { id: number; secret: CBinaryLike }[];
	expires?: number;
	rolling?: true | number;
	cookie?: {
		maxAge: number;
		httpOnly: boolean;
		sameSite: any;
		path: string;
		domain: string | undefined;
		secure: boolean;
	};
}

export interface Session<SessionType = Record<string, any>> {
	data: SessionType;
	expires: Date | undefined;
	update: (
		updateFn: (data: SessionType) => Partial<SessionType> | Promise<Partial<SessionType>>
	) => Promise<SessionType>;
	set: (data?: SessionType) => Promise<SessionType>;
	refresh: (expires_in_days?: number) => Promise<boolean>;
	destroy: () => Promise<boolean>;
}

export interface PrivateSession {
	'set-cookie'?: string | undefined;
}

export type BinaryLike = CBinaryLike;
