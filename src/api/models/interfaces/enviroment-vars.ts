import { AppMode } from "../../../common/enums";

export interface IEnviromentVars { 
  PORT: number;
  HOST: string;
  APP_MODE: AppMode;

  HTTP_PROXY: string;
  HTTPS_PROXY: string;
  NO_PROXY: string;

  ALLOWED_ORIGINS: string[];

  CONNECTION_STRING: string;

  SALT_ROUNDS: number;

  JWT_SECRET_KEY: string;
  JWT_SESSION_LIFE: string;
  JWT_REFRESH_TOKEN_SESSION_LIFE: string;

  RABBITMQ_URL: string;
}