// Fixed: Removed conflicting process declaration and used namespace augmentation
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

interface Number {
  unref(): Number;
  ref(): Number;
}