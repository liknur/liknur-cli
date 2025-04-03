declare module 'webpack-format-messages' {
  interface Messages {
    errors: string[];
    warnings: string[];
  }

  import { Stats } from 'webpack';

  function formatMessages(stats: Stats): Messages;

  export = formatMessages;
}
