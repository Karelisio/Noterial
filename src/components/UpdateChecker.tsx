const REPO = 'karelisio/noterial';
const CURRENT_VERSION = 'v0.1.2';

/** Vérifie la dernière release GitHub au lancement ; affiche un snackbar si une version plus récente existe. */
export async function checkForUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) return;
    const release = await res.json();
    const latest: string = release.tag_name;
    if (latest && latest !== CURRENT_VERSION) {
      // Brancher ici sur un composant Snackbar MUI avec un lien vers release.html_url.
      console.info(`Nouvelle version disponible : ${latest} → ${release.html_url}`);
    }
  } catch {
    // silencieux : pas de connexion, pas grave
  }
}
