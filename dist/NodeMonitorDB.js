"use strict";
// Copyright (c) 2019-2020, The TurtleCoin Developers
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
exports.NodeMonitorDB = void 0;
const db_abstraction_1 = require("db-abstraction");
const Types_1 = require("turtlecoin-utils/dist/Types");
/** @ignore */
var FKAction = db_abstraction_1.Interfaces.FKAction;
/**
 * An interface for interacting with the node monitor database
 */
class NodeMonitorDB {
    /**
     * Constructs a new instance
     * @param database the underlying database interface to interact with
     */
    constructor(database) {
        this.m_db = database;
    }
    /**
     * Initializes the database schema if required
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const stmts = [];
            let create;
            const addQuery = () => {
                create.indexes.map(index => stmts.push({ query: index }));
            };
        });
    }
    /**
     * Cleans any node polling history before the specified date
     * @param before the date to clean data until
     */
    cleanHistory(before) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.m_db.query('DELETE FROM node_polling WHERE utcTimestamp < ?', [before.getTime()]);
        });
    }
    /**
     * Returns all of the saved nodes in the database
     */
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const [, rows] = yield this.m_db.query('SELECT * FROM nodes ORDER BY name');
            return rows.map(row => {
                return {
                    id: row.id,
                    name: row.name,
                    hostname: row.hostname,
                    port: row.port,
                    ssl: (row.ssl === 1),
                    cache: (row.cache === 1)
                };
            });
        });
    }
    /**
     * Saves a list of nodes to the database
     * @param nodes the list of network nodes from the JSON provided list
     */
    saveNodes(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (nodes.length === 0) {
                return;
            }
            let l_nodes = [];
            for (const node of nodes) {
                l_nodes.push([node.id, node.name, node.hostname, node.port, (node.ssl) ? 1 : 0, (node.cache) ? 1 : 0]);
            }
            const stmts = [];
            while (l_nodes.length > 0) {
                const records = l_nodes.slice(0, 25);
                l_nodes = l_nodes.slice(25);
                const stmt = this.m_db.prepareMultiUpdate('nodes', ['id'], ['name', 'hostname', '`port`', '`ssl`', '`cache`'], records);
                stmts.push({ query: stmt });
            }
            return this.m_db.transaction(stmts);
        });
    }
    /**
     * Saves the result of polling events of nodes to the database
     * @param events the list of polling events
     */
    savePollingEvent(events) {
        return __awaiter(this, void 0, void 0, function* () {
            if (events.length === 0) {
                return;
            }
            const stmts = [];
            let l_events = [];
            for (const event of events) {
                l_events.push([
                    event.id, event.timestamp.getTime(), (event.synced) ? 1 : 0, event.feeAddress,
                    event.feeAddress.toString(), event.height, event.version, event.connectionsIn,
                    event.connectionsOut, event.difficulty, event.hashrate, event.transactionPoolSize
                ]);
            }
            while (l_events.length > 0) {
                const records = l_events.slice(0, 25);
                l_events = l_events.slice(25);
                const stmt = this.m_db.prepareMultiInsert('node_polling', ['id', 'utctimestamp', 'status', 'feeAddress', 'feeAmount',
                    'height', 'version', 'connectionsIn', 'connectionsOut', 'difficulty',
                    'hashrate', 'transactionPoolSize'], records);
                stmts.push({ query: stmt });
            }
            return this.m_db.transaction(stmts);
        });
    }
    /**
     * Retrieves the maximum polling timestamp from the database
     */
    maxTimestamp() {
        return __awaiter(this, void 0, void 0, function* () {
            const [count, rows] = yield this.m_db.query('SELECT MAX(utctimestamp) AS utctimestamp FROM node_polling');
            if (count !== 1) {
                return new Date();
            }
            return new Date(rows[0].utctimestamp);
        });
    }
    /**
     * Calculates and returns the node availabilities over the last 20 polling cycles
     */
    nodeAvailabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            const [, rows] = yield this.m_db.query('SELECT id, ((SUM(status) / COUNT(*)) * 100) AS availability ' +
                'FROM (SELECT utctimestamp FROM node_polling GROUP BY utctimestamp ' +
                'ORDER BY utctimestamp DESC LIMIT 20) AS last ' +
                'LEFT JOIN node_polling ON node_polling.utctimestamp = last.utctimestamp GROUP BY id');
            return rows.map(row => {
                return {
                    id: row.id,
                    availability: row.availability
                };
            });
        });
    }
    /**
     * Provides a brief history of the node availability over the last 20 polling cycles
     */
    nodeHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            const [, rows] = yield this.m_db.query('SELECT id, status, node_polling.utctimestamp AS utctimestamp  ' +
                'FROM (SELECT utctimestamp FROM node_polling GROUP BY utctimestamp ' +
                'ORDER BY utctimestamp DESC LIMIT 20) AS last ' +
                'LEFT JOIN node_polling ON node_polling.utctimestamp = last.utctimestamp ' +
                'ORDER BY id ASC, utctimestamp DESC');
            return rows.map(row => {
                return {
                    id: row.id,
                    synced: (row.status === 1),
                    timestamp: new Date(row.utctimestamp)
                };
            });
        });
    }
    /**
     * Retrieves all of the node polling events for the give timestamp
     * @param timestamp the timestamp to select
     */
    events(timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            const [, rows] = yield this.m_db.query('SELECT * FROM node_polling WHERE utctimestamp = ?', [timestamp.getTime()]);
            return rows.map(row => {
                return {
                    id: row.id,
                    timestamp: new Date(row.utctimestamp || row.utcTimestamp),
                    synced: (row.status === 1),
                    feeAddress: row.feeaddress || row.feeAddress || '',
                    feeAmount: (row.feeamount || row.feeAmount) ? Types_1.BigInteger(row.feeamount || row.feeAmount) : Types_1.BigInteger.zero,
                    height: row.height,
                    version: row.version,
                    connectionsIn: row.connectionsin || row.connectionsIn,
                    connectionsOut: row.connectionsout || row.connectionsOut,
                    difficulty: row.difficulty,
                    hashrate: row.hashrate,
                    transactionPoolSize: row.transactionpoolsize || row.transactionPoolSize
                };
            });
        });
    }
    /**
     * Retrieves the node/daemon statistics including its availability percentage and the last 20 histories for
     * the node for all nodes in the database
     */
    stats() {
        return __awaiter(this, void 0, void 0, function* () {
            function fetch(array, id) {
                const result = array.filter(value => value.id === id);
                if (result.length === 1) {
                    return result[0];
                }
                throw new ReferenceError('Unknown value');
            }
            const results = [];
            const nodes = yield this.nodes();
            const availabilities = yield this.nodeAvailabilities();
            const maxTimestamp = yield this.maxTimestamp();
            const last_events = yield this.events(maxTimestamp);
            const histories = yield this.nodeHistory();
            for (const node of nodes) {
                try {
                    const avail = fetch(availabilities, node.id);
                    const last = fetch(last_events, node.id);
                    const history = histories.filter(history => history.id === node.id);
                    results.push({
                        id: node.id,
                        name: node.name,
                        hostname: node.hostname,
                        port: node.port,
                        ssl: node.ssl,
                        cache: node.cache,
                        availability: avail.availability,
                        info: last,
                        history: history
                    });
                }
                catch (_a) { }
            }
            return results;
        });
    }
}
exports.NodeMonitorDB = NodeMonitorDB;
