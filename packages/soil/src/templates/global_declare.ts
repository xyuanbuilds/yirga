export class Observable<T> {
  // ... still no implementation ...
}

declare global {
  interface LLLL<T> {
    toObservable(): Observable<T>;
  }
}

const a: LLLL<string> = 'fdfd';

a.toObservable();
