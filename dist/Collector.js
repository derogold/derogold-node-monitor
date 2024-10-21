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
exports.getAppParams = exports.Collector = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const node_fetch_1 = require("node-fetch");
const NodeMonitorDB_1 = require("./NodeMonitorDB");
const turtlecoin_utils_1 = require("turtlecoin-utils");
const Types_1 = require("turtlecoin-utils/dist/Types");
const node_metronome_1 = require("node-metronome");
/** @ignore */
require('dotenv').config();
/** @ignore */
const DefaultConfig = {
    pollingInterval: 60,
    updateInterval: 360,
    historyDays: 0.25,
    nodeList: 'https://raw.githubusercontent.com/derogold/derogold-nodes-json/refs/heads/master/derogold-nodes.json'
};
/**
 * An interface provided for polling and collecting data of node/daemons
 */
class Collector extends events_1.EventEmitter {
    /**
     * Creates a new instance of the collector interface
     * @param database the underlying database interface to interact with
     * @param options collector options
     */
    constructor(database, options) {
        super();
        this.m_nodes = [];
        this.m_config = mergeConfig(DefaultConfig, options);
        this.m_db = new NodeMonitorDB_1.NodeMonitorDB(database);
        this.m_pollingTimer = new node_metronome_1.Metronome(this.config.pollingInterval * 1000, false);
        this.m_pollingTimer.on('tick', () => __awaiter(this, void 0, void 0, function* () {
            const timestamp = new Date();
            const promises = [];
            for (const node of this.nodes) {
                promises.push(fetchNodeInfo(node, timestamp));
            }
            const results = yield Promise.all(promises);
            try {
                yield this.m_db.savePollingEvent(results);
                this.emit('polling', results);
            }
            catch (error) {
                this.emit('error', new Error('Could not save polling event for ' + this.nodes.length +
                    ' in the database: ' + error.toString()));
            }
        }));
        this.m_updateTimer = new node_metronome_1.Metronome(this.config.updateInterval * 1000, false);
        this.m_updateTimer.on('tick', () => __awaiter(this, void 0, void 0, function* () {
            try {
                this.m_nodes = yield fetchNodeList(this.config.nodeList);
                yield this.m_db.saveNodes(this.nodes);
                this.emit('update', this.nodes);
            }
            catch (error) {
                this.emit('error', new Error('Could not update the public node list: ' + error.toString()));
            }
        }));
        this.m_updateTimer.on('tick', () => __awaiter(this, void 0, void 0, function* () {
            const now = (new Date()).getTime();
            const historySeconds = this.config.historyDays * 24 * 60 * 60 * 1000;
            const cutoff = new Date(now - historySeconds);
            try {
                yield this.m_db.cleanHistory(cutoff);
                this.emit('info', 'Cleaned old polling history before: ' + cutoff.toUTCString());
            }
            catch (error) {
                this.emit('error', new Error('Could not clear old history from before ' + cutoff.toUTCString()) +
                    ': ' + error.toString());
            }
        }));
    }
    /**
     * Retrieves the list of known nodes from memory
     */
    get nodes() {
        return this.m_nodes;
    }
    /**
     * Retrieves the current collector configuration
     */
    get config() {
        return this.m_config;
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Starts the collector process
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.m_db.init();
            this.m_updateTimer.paused = false;
            this.once('update', () => {
                this.m_pollingTimer.paused = false;
                this.m_pollingTimer.tick();
            });
            this.m_updateTimer.tick();
        });
    }
    /**
     * Stops the collector process
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.m_pollingTimer.destroy();
            this.m_updateTimer.destroy();
        });
    }
}
exports.Collector = Collector;
/** @ignore */
function fetchNodeInfo(node, timestamp) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            id: node.id,
            timestamp: timestamp,
            height: 0,
            feeAddress: '',
            feeAmount: 0,
            version: 'offline',
            synced: false,
            connectionsIn: 0,
            connectionsOut: 0,
            difficulty: 0,
            hashrate: 0,
            transactionPoolSize: 0
        };
        try {
            const daemon = new turtlecoin_utils_1.TurtleCoind(node.hostname, node.port, 5000, node.ssl);
            const info = yield daemon.info();
            if (info.version.major >= 1 && !info.isCacheApi) {
                result.connectionsIn = info.incomingConnections;
                result.connectionsOut = info.outgoingConnections;
                result.transactionPoolSize = info.transactionsPoolSize;
            }
            else {
                result.connectionsIn = info.incoming_connections_count;
                result.connectionsOut = info.outgoing_connections_count;
                result.transactionPoolSize = info.tx_pool_size;
            }
            result.height = info.height;
            result.version = info.version.major + '.' + info.version.minor + '.' + info.version.patch;
            result.synced = info.synced;
            result.difficulty = info.difficulty;
            result.hashrate = info.hashrate;
            const feeInfo = yield daemon.fee();
            result.feeAddress = feeInfo.address;
            result.feeAmount = feeInfo.amount;
        }
        catch (_a) { }
        return result;
    });
}
/** @ignore */
function fetchNodeList(nodeList) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(nodeList);
        const result = yield response.json();
        const results = [];
        for (const entry of result.nodes) {
            results.push({
                id: generateNodeID(entry),
                name: entry.name.replace(/'/g, ''),
                hostname: entry.url,
                port: entry.port,
                ssl: entry.ssl,
                cache: entry.cache
            });
        }
        return results;
    });
}
/** @ignore */
function generateNodeID(node) {
    const sha256 = (message) => {
        return crypto_1.createHmac('sha256', message).digest('hex');
    };
    return sha256(JSON.stringify({ hostname: node.url, port: node.port, ssl: (node.ssl) ? 1 : 0 }));
}
/** @ignore */
function mergeConfig(b, a) {
    if (a) {
        Object.keys(a)
            .forEach(key => {
            if (a[key]) {
                b[key] = a[key];
            }
        });
    }
    return b;
}
/**
 * Retrieves the application configuration values from the environment variables
 * @ignore
 */
function getAppParams() {
    return mergeConfig(DefaultConfig, {
        pollingInterval: (process.env.NODE_POLLING_INTERVAL) ? parseInt(process.env.NODE_POLLING_INTERVAL, 10) : undefined,
        updateInterval: (process.env.NODE_UPDATE_INTERVAL) ? parseInt(process.env.NODE_UPDATE_INTERVAL, 10) : undefined,
        historyDays: (process.env.NODE_HISTORY_DAYS) ? parseFloat(process.env.NODE_HISTORY_DAYS) : undefined,
        nodeList: (process.env.NODE_LIST_URL) ? process.env.NODE_LIST_URL : undefined
    });
}
exports.getAppParams = getAppParams;
