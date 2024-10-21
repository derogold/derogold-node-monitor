#!/usr/bin/env node
"use strict";
// Copyright (c) 2020, The TurtleCoin Developers
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
const Collector_1 = require("./Collector");
const logger_1 = require("@turtlepay/logger");
const Common_1 = require("./Common");
(() => __awaiter(void 0, void 0, void 0, function* () {
    Common_1.checkProduction();
    const database = yield Common_1.getDatabase();
    const app_options = Collector_1.getAppParams();
    const collector = new Collector_1.Collector(database, app_options);
    collector.on('error', error => logger_1.Logger.error(error.toString()));
    collector.on('info', notice => logger_1.Logger.info(notice));
    collector.on('update', nodes => logger_1.Logger.info('Updated node list with %s nodes', nodes.length));
    collector.on('polling', nodes => logger_1.Logger.info('Saved polling events for %s nodes', nodes.length));
    logger_1.Logger.info('Collector starting...');
    yield collector.start();
}))();
