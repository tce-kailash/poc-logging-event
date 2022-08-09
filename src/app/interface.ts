export interface PracticeI {
    id: string;
    title: string;
    mcqs: OptionI[];
}

export interface OptionI {
    id: string;
    question: string;
    options: McqI[];
}

export interface McqI {
    id: string;
    label: string;
}

export interface EventLoggerI {
    id: string;
    label: string;
    time?: string;
    data?: any;
}

export interface ServerEventLoggerI<D> {
    id: string;
    additionData?: D;
}