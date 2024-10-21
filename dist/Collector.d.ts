/// <reference types="node" />
import { EventEmitter } from 'events';
import { Interfaces } from './Types';
import { IDatabase } from 'db-abstraction';
/**
 * An interface provided for polling and collecting data of node/daemons
 */
export declare class Collector extends EventEmitter {
    private readonly m_db;
    private readonly m_config;
    private m_nodes;
    private readonly m_pollingTimer;
    private readonly m_updateTimer;
    /**
     * Creates a new instance of the collector interface
     * @param database the underlying database interface to interact with
     * @param options collector options
     */
    constructor(database: IDatabase, options?: Interfaces.ICollectorConfig);
    /**
     * Retrieves the list of known nodes from memory
     */
    get nodes(): Interfaces.NetworkNode[];
    /**
     * Retrieves the current collector configuration
     */
    get config(): Interfaces.CollectorConfig;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'info', listener: (notice: string) => void): this;
    on(event: 'update', listener: (nodes: Interfaces.NetworkNode[]) => void): this;
    on(event: 'polling', listener: (nodes: Interfaces.NodePollingEvent[]) => void): this;
    /**
     * Starts the collector process
     */
    start(): Promise<void>;
    /**
     * Stops the collector process
     */
    stop(): Promise<void>;
}
/**
 * Retrieves the application configuration values from the environment variables
 * @ignore
 */
export declare function getAppParams(): Interfaces.CollectorConfig;
