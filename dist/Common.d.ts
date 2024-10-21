import { IDatabase } from 'db-abstraction';
/** @ignore */
export declare function checkProduction(): void;
/**
 * Uses the environment variables or a .env file in the project's root
 * to determine which underlying database type to use with the package
 */
export declare function getDatabase(): Promise<IDatabase>;
