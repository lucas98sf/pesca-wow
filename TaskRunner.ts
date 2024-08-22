import readline from 'readline';

export default class TaskRunner {
  private isRunning: boolean = false;
  private shouldPause: boolean = false;
  private pauseKey: string = 'p';

  constructor(private task: () => Promise<void>, pauseKey?: string) {
    if (pauseKey) {
      this.pauseKey = pauseKey;
    }

    console.log(`Starting, Press "${this.pauseKey}" to toggle execution.`);

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    } else {
      console.error('Raw mode is not available in this terminal.');
      process.exit(1);
    }

    process.stdin.on('keypress', async (_str: string, key: readline.Key) => {
      if (key.name === this.pauseKey) {
        if (this.isRunning) {
          this.shouldPause = !this.shouldPause;
        } else {
          this.isRunning = true;
          await this.executeTask();
        }
      }

      if (key.name === 'c' && key.ctrl) {
        this.isRunning = false;
        process.exit();
      }
    });
  }

  private async pause(): Promise<void> {
    return new Promise(resolve => {
      const resume = () => {
        this.shouldPause = false;
        process.stdin.off('keypress', keyHandler);
        resolve();
      };

      const keyHandler = (_str: string, key: readline.Key) => {
        if (key.name === this.pauseKey) {
          resume();
        }
      };

      process.stdin.on('keypress', keyHandler);
    });
  }

  private async executeTask(): Promise<void> {
    while (this.isRunning) {
      if (this.shouldPause) {
        console.log('Paused. Press "p" to resume.');
        await this.pause();
        console.log('Resumed.');
      }

      await this.task();
    }
  }
}
