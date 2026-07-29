/**
 * Prüft die Umgebungsvariablen beim Start. Wirft die Anwendung sofort ab,
 * wenn etwas fehlt — besser ein Crash beim Deploy als ein Server, der
 * monatelang mit einem Platzhalter-Secret läuft.
 */

/** Kürzere Secrets sind für HS256 nicht sinnvoll — 32 Byte entsprechen der Hash-Größe. */
const MIN_SECRET_LENGTH = 32;

export interface EnvConfig {
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const secret = config.JWT_SECRET;

  if (typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET fehlt. Lege eine .env nach dem Vorbild von .env.example an ' +
        '(Secret erzeugen mit: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))").',
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET ist zu kurz — mindestens ${MIN_SECRET_LENGTH} Zeichen erforderlich.`);
  }

  return { ...config, JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '1h' };
}
