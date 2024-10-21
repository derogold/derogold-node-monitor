import { Interfaces } from './Types';
import { IDatabase } from 'db-abstraction';
/**
 * An interface for interacting with the node monitor database
 */
export declare class NodeMonitorDB {
    private readonly m_db;
    /**
     * Constructs a new instance
     * @param database the underlying database interface to interact with
     */
    constructor(database: IDatabase);
    /**
     * Initializes the database schema if required
     */
    init(): Promise<void>;
    /**
     * Cleans any node polling history before the specified date
     * @param before the date to clean data until
     */
    cleanHistory(before: Date): Promise<void>;
    /**
     * Returns all of the saved nodes in the database
     */
    nodes(): Promise<Interfaces.NetworkNode[]>;
    /**
     * Saves a list of nodes to the database
     * @param nodes the list of network nodes from the JSON provided list
     */
    saveNodes(nodes: Interfaces.NetworkNode[]): Promise<void>;
    /**
     * Saves the result of polling events of nodes to the database
     * @param events the list of polling events
     */
    savePollingEvent(events: Interfaces.NodePollingEvent[]): Promise<void>;
    /**
     * Retrieves the maximum polling timestamp from the database
     */
    maxTimestamp(): Promise<Date>;
    /**
     * Calculates and returns the node availabilities over the last 20 polling cycles
     */
    nodeAvailabilities(): Promise<{
        id: string;
        availability: number;
    }[]>;
    /**
     * Provides a brief history of the node availability over the last 20 polling cycles
     */
    nodeHistory(): Promise<Interfaces.NetworkNodeStatusHistory[]>;
    /**
     * Retrieves all of the node polling events for the give timestamp
     * @param timestamp the timestamp to select
     */
    events(timestamp: Date): Promise<Interfaces.NodePollingEvent[]>;
    /**
     * Retrieves the node/daemon statistics including its availability percentage and the last 20 histories for
     * the node for all nodes in the database
     */
    stats(): Promise<Interfaces.NetworkNodeStats[]>;
}
