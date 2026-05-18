// Extrait la "clé de concept" d'un id de carte. Toutes les cartes (lesson + ses
// quizzes associés) qui partagent le même concept ont la même clé.
//
// Formats supportés :
//   - "<topic>-c<layer>-<kind>(1-2 letters)<NN>[letter]-<slug>"
//       ex: anxiete-c1-l01-anxiete-normale     → anxiete-c1-01
//       ex: anxiete-c1-q01b-anxiete-utile      → anxiete-c1-01
//       ex: irc-c1-cz03-dfg-unite              → irc-c1-03
//   - "<topic>-c<layer>-<NN>[letter]-<kind>-<slug>" (ancien format HTA)
//       ex: hta-c1-01a-l-coeur-pompe           → hta-c1-01
//
// Renvoie null si l'id ne matche aucun pattern (carte legacy mal nommée).
export function conceptKey(id: string): string | null {
  // Format actuel : kind-letter d'abord, puis NN
  const m1 = id.match(/^(.+?)-c(\d+)-[a-z]{1,2}(\d+)[a-z]?-/);
  if (m1) return `${m1[1]}-c${m1[2]}-${m1[3]}`;
  // Ancien format : NN d'abord, puis kind-letter
  const m2 = id.match(/^(.+?)-c(\d+)-(\d+)[a-z]-/);
  if (m2) return `${m2[1]}-c${m2[2]}-${m2[3]}`;
  return null;
}
