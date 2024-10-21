"use strict";
// Copyright (c) 2020, The TurtlePay Developers
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = exports.checkProduction = void 0;
const db_abstraction_1 = require("db-abstraction");
const logger_1 = require("@turtlepay/logger");
/** @ignore */
require('dotenv').config();
/** @ignore */
function checkProduction() {
    if (!process.env.NODE_ENV || process.env.NODE_ENV.toLowerCase() !== 'production') {
        logger_1.Logger.warn('Node.JS is not running in production mode. ' +
            'Consider running in production mode: export NODE_ENV=production');
    }
}
exports.checkProduction = checkProduction;
/**
 * Uses the environment variables or a .env file in the project's root
 * to determine which underlying database type to use with the package
 */
function getDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        let database;
        const host = process.env.DB_HOST || undefined;
        const port = (process.env.DB_PORT) ? parseInt(process.env.DB_PORT, 10) : undefined;
        const user = process.env.DB_USER || undefined;
        const pass = process.env.DB_PASS || undefined;
        const db = process.env.DB_NAME || 'turtlecoin';
        if (process.env.USE_MYSQL) {
            logger_1.Logger.info('Using MySQL Backend...');
            if (host === undefined || user === undefined || pass === undefined || db === undefined) {
                console.error('\n\n!! Missing database connection parameters in environment variables !!\n\n');
                process.exit(1);
            }
            database = new db_abstraction_1.MySQL(host, port || 3306, user, pass, db);
            database.on('error', error => logger_1.Logger.error(error.toString()));
        }
        else if (process.env.USE_POSTGRES) {
            logger_1.Logger.info('Using Postgres Backend...');
            if (host === undefined || user === undefined || pass === undefined || db === undefined) {
                console.error('\n\n!! Missing database connection parameters in environment variables !!\n\n');
                process.exit(1);
            }
            database = new db_abstraction_1.Postgres(host, port || 5432, user, pass, db);
            database.on('error', error => logger_1.Logger.error(error.toString()));
        }
        else {
            logger_1.Logger.info('Using SQLite Backend...');
            database = new db_abstraction_1.SQLite(process.env.SQLITE_PATH || 'node_monitor.sqlite3');
            database.on('error', error => logger_1.Logger.error(error.toString()));
        }
        return database;
    });
}
exports.getDatabase = getDatabase;
