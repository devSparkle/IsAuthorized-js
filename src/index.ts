import type { Check, Context, Permissions, SiftedPermissions } from "./types"
import { Flag } from "./types"

export { Flag } from "./types"

export type Options = {
	/**
		If this is set to false, default checks will not be added. Otherwise,
		all default integrations will be added.
	*/
	defaultChecks?: false
	
	/**
		List of integrations that should be made available in permissions. These
		will be loaded along with the default checks, unless otherwise
		configured.
	*/
	checks?: Check[]
}

export default class IsAuthorized {
	protected checks: Check[]
	
	constructor(options: Options) {
		this.checks = [
			...(options?.defaultChecks ? [] : []),
			...(options?.checks ?? []),
		]
	}
	
	private getCheckByName(name: string) {
		for (const check of this.checks) {
			if (check.name == name) return check
		}
	}
	
	async isAuthorized(permissions?: Permissions, context?: Context): Promise<boolean> {
		if (!permissions) return true
		if (!context) {
			context = {}
		}
		
		const siftedPermissions: SiftedPermissions = permissions as SiftedPermissions
		const requireAll = siftedPermissions.includes(Flag.RequireAll)
		
		for (let permission of siftedPermissions) {
			let result: boolean
			
			switch (typeof(permission)) {
				case "string": {
					const inverted = permission.startsWith("!")
					
					if (inverted) {
						permission = permission.substring(1)
					}
					
					const splitPermission = permission.split(":")
					if (splitPermission[0] == "Flag") continue
					
					const permissionCheck = this.getCheckByName(splitPermission[0] as string) as Check
					console.assert(permissionCheck)
					result = await permissionCheck.isAuthorized(context, ...splitPermission.toSpliced(0, 1))
					
					if (context.debug == true) {
						console.debug(splitPermission, "checked against", context, `resulted in ${result} and ${inverted ? "will" : "will NOT"} be inverted.`)
					}
					
					if (inverted) {
						result = !result
					}
					
					break
				}
				case "function":
					result = await permission(context)
					break
				default:
					result = await this.isAuthorized(permission, context)
			}
			
			if (result) {
				if (!requireAll) return true
			} else if (requireAll) {
				return false
			}
		}
		
		return requireAll || false
	}
}
