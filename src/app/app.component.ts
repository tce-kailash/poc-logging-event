import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { delay, Observable, take } from 'rxjs';
import { json } from './dummy-json';
import { OptionI, PracticeI } from './mcq.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'zone-js';
  form!: FormGroup;
  json: PracticeI = json;
  isQuizSubmitted: boolean = false;
  private _currentMcqIndex: number = 0;
  currentMcq!: OptionI | null;
  questionAnswers: {
    questionIndex: number;
    answer: string;
  }[] = [];
  logger: {
    id: string;
    label: string;
    time?: string;
    data?: any;
  }[] = [];
  isFetchingQuestion: boolean = false;

  constructor(
    private fb: FormBuilder
  ){
    this.createForm();
  }

  ngOnInit(): void {

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
        this.logger.push({
          id: data.id,
          label: data.label,
          data: data.additionData
        });
      }
    };
  }

  get f() {
    return this.form;
  }

  get currentMcqIndex(): number {
    return this._currentMcqIndex;
  }

  set currentMcqIndex(index: number) {
    this._currentMcqIndex = index;
  }

  get isFirstMcq(): boolean {
    return this.currentMcqIndex===0 ? true : false;
  }

  get isLastMcq(): boolean {
    const mcqLength = this.json.mcqs.length-1;
    return this.currentMcqIndex===mcqLength ? true : false;
  }

  getQuestion(): Observable<OptionI> {
    return new Observable<OptionI>((observer) => {
      observer.next(json.mcqs[this.currentMcqIndex]);
    }).pipe(
      delay(1000),
      take(1)
    );
  }

  createForm(): void {
    const isAnswerPresent = this.questionAnswers.find((question) => question.questionIndex===this.currentMcqIndex);
    let answer = '';
    if(isAnswerPresent){
      answer = isAnswerPresent.answer;
    }
    this.form = this.fb.group({
      option: [answer, Validators.required]
    });
  }

  onStart(): void {
    this.loggStartQuiz();
    this.isFetchingQuestion = true;
    this.getQuestion().subscribe((res) => {
      this.currentMcq = res;
      this.loggStartQuestion();
      this.isFetchingQuestion = false;
    });
  }

  loggStartQuestion(): void {
    const currentMcq = this.currentMcq as OptionI;
    this.logger.push({
      id: currentMcq.id,
      label: "Question Started"
    });
    const loggTime = this.loggTime();
    loggTime.startTime(currentMcq.id);
  }

  loggEndQuestion(): void {
    const loggTime = this.loggTime();
    const currentMcq = this.currentMcq as OptionI;
    const totalTimeSpent = loggTime.endTime(currentMcq.id);
    this.logger.push({
      id: currentMcq.id,
      label: "Question ended",
      time: `${totalTimeSpent} ms`
    });
    loggTime.loggEvent({
      id: currentMcq.id,
      label: "Question Logged",
      additionData: {
        totalTimeSpent
      }
    });
    loggTime.reset(currentMcq.id);
  }

  loggStartQuiz(): void {
    this.logger.push({
      id: json.id,
      label: "Quiz Player Started"
    });
    const loggTime = this.loggTime();
    loggTime.startTime(json.id);
  }

  loggEndQuiz(): void {
    const loggTime = this.loggTime();
    const totalTimeSpent = loggTime.endTime(json.id);
    this.logger.push({
      id: json.id,
      label: "Quiz Player Ended",
      time: `${totalTimeSpent} ms`
    });
    loggTime.loggEvent({
      id: json.id,
      label: "Quiz Logged",
      additionData: {
        totalTimeSpent
      }
    });
    loggTime.reset(json.id);
  }

  onNextQuestion(): void {
    const mcqLength = this.json.mcqs.length-1;
    if(this.currentMcqIndex<=mcqLength){
      this.loggEndQuestion();
      this.currentMcqIndex++;
      this.createForm();
      this.isFetchingQuestion = true;
      this.getQuestion().subscribe((res) => {
        this.currentMcq = res;
        this.loggStartQuestion();
        this.isFetchingQuestion = false;
      })
    }
  }

  onPrevQuestion(): void {
    if(this.currentMcqIndex>=0){
      this.loggEndQuestion();
      this.currentMcqIndex--;
      this.createForm();
      this.isFetchingQuestion = true;
      this.getQuestion().subscribe((res) => {
        this.currentMcq = res;
        this.loggStartQuestion();
        this.isFetchingQuestion = false;
      })
    }
  }

  onSubmit(): void {
    if(this.f.valid){
      const answer = this.f.value.option;
      const isAnswerPresent = this.questionAnswers.findIndex((question) => question.questionIndex===this.currentMcqIndex);
      if(isAnswerPresent!==-1){
        this.questionAnswers[isAnswerPresent].answer = answer;
      }else{
        this.questionAnswers.push({
          questionIndex: this.currentMcqIndex,
          answer
        });
      }
      this.onNextQuestion();
    }
  }

  onSubmitQuiz(): void {
    this.isQuizSubmitted = true;
    this.loggEndQuiz();
  }

  onResetQuiz(): void {
    this.createForm();
    this.currentMcqIndex = 0;
    this.questionAnswers = [];
    this.isQuizSubmitted = false;
    this.currentMcq = null;
  }

  onFinalSubmitQuiz(): void {

  }

  logEvent(): void {

  }
}
