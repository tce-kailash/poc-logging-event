import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { delay, Observable, Subject, take, takeUntil, timer } from 'rxjs';
import { json } from './dummy-json';
import { EventLoggerService } from './event-logger.service';
import { EventLoggerI, OptionI, PracticeI } from './interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loggedKeys: string[] = [];
  isLoggedStarted: boolean = true;
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    this.loggedKeys.push(event.key);
    const checklog = this.loggedKeys.slice(-4, this.loggedKeys.length).join("");
    if(checklog==="slog" && !this.isLoggedStarted){
      this.isLoggedStarted = true;
      console.log("Start Log");
    }
    if(checklog==="hlog" && this.isLoggedStarted){
      this.isLoggedStarted = false;
      console.log("Hide Log");
    }
  }

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
  logger: EventLoggerI [] = this.eventLoggerService.logger;
  isFetchingQuestion: boolean = false;
  totalTimeSpentQuizDes$: Subject<void> = new Subject<void>();
  totalTimeSpentQuiz$!: Observable<number>;
  totalTimeSpentQuestion$!: Observable<number>;

  constructor(
    private fb: FormBuilder,
    private eventLoggerService: EventLoggerService
  ){
    this.createForm();
  }

  ngOnInit(): void {

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

  getTimer$(): Observable<number> {
    return timer(0, 1000);
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
    this.totalTimeSpentQuiz$ = timer(0, 1000).pipe(
      takeUntil(this.totalTimeSpentQuizDes$)
    );
    this.getTimer$();
    this.loggStartQuiz();
    this.isFetchingQuestion = true;
    this.getQuestion().subscribe((res) => {
      this.currentMcq = res;
      this.loggStartQuestion();
      this.isFetchingQuestion = false;
    });
  }

  loggStartQuestion(): void {
    this.totalTimeSpentQuestion$ = timer(0, 1000);
    const currentMcq = this.currentMcq as OptionI;
    this.eventLoggerService.startLogging(currentMcq.id);
    this.eventLoggerService.loggData(currentMcq.id, "Question Started")
  }

  loggEndQuestion(): void {
    const currentMcq = this.currentMcq as OptionI;
    const totalTimeSpent = this.eventLoggerService.endLogging(currentMcq.id);
    const data = {
      totalTimeSpent 
    };
    this.eventLoggerService.loggData(
      currentMcq.id,
      "Question Ended",
      totalTimeSpent
    );
    this.eventLoggerService.serverEventLogging(
      currentMcq.id,
      "Question Logged",
      data
    );
    this.eventLoggerService.resetLogging(currentMcq.id);
  }

  loggStartQuiz(): void {
    this.eventLoggerService.startLogging(json.id);
    this.eventLoggerService.loggData(json.id, "Quiz Player Started")
  }

  loggEndQuiz(): void {
    const totalTimeSpent = this.eventLoggerService.endLogging(json.id);
    const data = {
      totalTimeSpent 
    };
    this.eventLoggerService.loggData(
      json.id,
      "Quiz Player Ended",
      totalTimeSpent
    );
    this.eventLoggerService.serverEventLogging(
      json.id,
      "Quiz Logged",
      data
    );
    this.eventLoggerService.resetLogging(json.id);
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
    this.totalTimeSpentQuizDes$.next();
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
