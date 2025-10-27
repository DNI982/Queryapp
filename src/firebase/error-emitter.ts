import { EventEmitter } from 'events';
import { type FirestorePermissionError } from './errors';

// Define the event map for our emitter
interface ErrorEvents {
  'permission-error': (error: FirestorePermissionError) => void;
}

// Create a typed EventEmitter
class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, listener: T[K]): void {
    this.emitter.on(event as string, listener);
  }

  off<K extends keyof T>(event: K, listener: T[K]): void {
    this.emitter.off(event as string, listener);
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    this.emitter.emit(event as string, ...args);
  }
}

// Export a singleton instance of the typed emitter
export const errorEmitter = new TypedEventEmitter<ErrorEvents>();
