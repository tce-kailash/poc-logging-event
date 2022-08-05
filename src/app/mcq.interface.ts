export interface PracticeI {
    id: string;
    title: string;
    mcqs: OptionI [];
}

export interface OptionI {
    id: string;
    question: string;
    options: McqI [];
}

export interface McqI {
    id: string;
    label: string;
}