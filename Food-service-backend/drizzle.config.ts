import type { Config } from 'drizzle-kit';
import { DBConfig } from './src/config';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DBConfig.url,
  },
  verbose: true,
  strict: true,
} satisfies Config;