const {warn} = console;

/**
 * Silence console. Too much noise!
 */
export function silenceConsole(): void {
  console.warn = (...args: Parameters<Console['warn']>) => {
    if (args[0] !== 'Connection loop recv failed: The channel is empty.') {
      warn.apply(console, args);
    }
  };
  console.log = console.info = console.debug = console.group = console.groupEnd = () =>
    void 0;
}
