import { Injectable } from "@angular/core";
import { EventLoggerI } from './interface';

@Injectable({
    providedIn: "root"
})
export class EventLoggerService {
    private _logger: EventLoggerI [] = [];

    constructor() {}

    get logger(){
        return this._logger;
    }

    set logger(data: EventLoggerI []){
        this._logger.push(...data);
    }

    loggTime() {
        return {
            startTime: (id: string): void => {
                performance.mark(id);
            },
            endTime: (id: string): number => {
                return performance.measure(id, id).duration;
            },
            reset: (id: string): void => {
                performance.clearMarks(id);
                performance.clearMeasures(id);
            },
            loggEvent: (data: {
                id: string,
                label: string,
                additionData: any
            }): void => {
                this.logger = [{
                    id: data.id,
                    label: data.label,
                    data: data.additionData
                }]
            }
        };
    }

    loggData<D>(logId: string, label: string, time?: number, data?: D){
        const loggData: EventLoggerI = {
            id: logId,
            label
        };
        if(time){
            loggData["time"] = `${time.toString()} ms`;
        }
        if(data){
            loggData["data"] = data;
        }
        this.logger = [
            loggData
        ];
    }

    startLogging(logId: string): void {
        const loggTime = this.loggTime();
        loggTime.startTime(logId);
    }

    endLogging(logId: string): number {
        const loggTime = this.loggTime();
        const totalTimeSpent = loggTime.endTime(logId);
        return totalTimeSpent;
    }

    resetLogging(logId: string): void {
        const loggTime = this.loggTime();
        loggTime.reset(logId);
    }

    serverEventLogging<D>(logId: string, label: string, data?: D){
        this.logger = [{
            id: logId,
            label,
            data
        }];
    }
}