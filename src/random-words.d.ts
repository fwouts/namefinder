declare module "random-words" {
  function randomWords(): string;
  function randomWords(exactly: number): string[];
  function randomWords(options: {
    min?: number;
    max?: number;
    exactly?: number;
  }): string[];
  namespace randomWords {

  }

  export = randomWords;
}
