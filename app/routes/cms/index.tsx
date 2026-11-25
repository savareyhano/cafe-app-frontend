import { redirect } from "react-router";
import { isAdmin, requireUser } from "~/lib/session";

export async function clientLoader() {
  const user = await requireUser();
  throw redirect(isAdmin(user) ? "/cms/dasbor" : "/cms/pesanan");
}

export default function CmsIndex() {
  return null;
}
