import { redirect } from "next/navigation";

/** Design token sets moved to the Studio (its Design tokens tab). Old links land there. */
export default function OldPresetsPage() {
  redirect("/studio?show=tokens");
}
