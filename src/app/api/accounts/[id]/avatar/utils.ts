import { getDb } from "@/db";
import { managesAddedAccount, requireAccountManager } from "../../utils";
import { selectAccountById } from "../utils";

export async function getManagedAccount(request: Request, id: string) {
	const access = await requireAccountManager(request);
	if (access.error) return { access, account: null };
	const account = await selectAccountById(getDb(access.env), id);
	const actor = access.user!;
	const allowed = actor.role === "admin"
		? account?.id === actor.id || account?.createdByUserId === actor.id
		: !!account && managesAddedAccount(actor, account);
	if (!account || !allowed) {
		return { access, account: null };
	}
	return { access, account };
}
