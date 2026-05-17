import { redirect } from "next/navigation";

// /notes a été fusionné dans la bibliothèque sous /library?filter=notes.
// On garde la route pour ne pas casser les bookmarks et les liens existants.
export default function NotesRedirectPage() {
  redirect("/library?filter=notes");
}
