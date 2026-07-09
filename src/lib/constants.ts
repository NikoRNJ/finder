// Dominio sintético para login con solo nombre de usuario.
export const EMAIL_DOMAIN = "finder.local";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}
