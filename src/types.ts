export enum Flag { 
	RequireAll = "Flag:RequireAll"
}

export type Permissions = SiftedPermissions
export type SiftedPermissions = (string | Flag | ((context: Context) => Promise<boolean>) | SiftedPermissions)[ ]

export type Context = {
	[key: string]: unknown,
	
	discord?: bigint,
	roblox?: bigint,
	authentik?: bigint,
	
	debug?: boolean,
}

export interface Check {
	/**
		The name of the check. Used at the start of the permission string.
	*/
	name: string,
	
	/**
		This recieves the context and arguments passed onto the permission, and
		returns whether or not the context should be authorized.
	*/
	isAuthorized(context: Context, ...args: string[]): Promise<boolean>,
}
