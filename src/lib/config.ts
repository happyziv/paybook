export type AppConfig = {
  databaseUrl: string;
  paybookPin: string;
  sessionSecret: string;
  isProduction: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }

  return value;
}

export function getConfig(): AppConfig {
  const databaseUrl = requiredEnv("DATABASE_URL");
  const paybookPin = requiredEnv("PAYBOOK_PIN");
  const sessionSecret = requiredEnv("PAYBOOK_SESSION_SECRET");

  if (sessionSecret.length < 32) {
    throw new Error("PAYBOOK_SESSION_SECRET은 32자 이상이어야 합니다.");
  }

  return {
    databaseUrl,
    paybookPin,
    sessionSecret,
    isProduction: process.env.NODE_ENV === "production"
  };
}
