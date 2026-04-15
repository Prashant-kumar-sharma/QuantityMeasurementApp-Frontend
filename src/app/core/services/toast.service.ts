import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Toast message interface for custom toast system
 */
export interface ToastMessage {
  id: string;
  text: string;
  kind: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  public messages$: Observable<ToastMessage[]> = this.messagesSubject.asObservable();
  private messageCounter = 0;

  constructor(private toastr: ToastrService) { }

  /**
   * Show a toast notification (compatible with existing error interceptor)
   * @param message The message to display
   * @param kind The type of toast ('success', 'error', 'info')
   */
  show(message: string, kind: 'success' | 'error' | 'info' = 'info'): void {
    // Add to custom toast system
    const toastMessage: ToastMessage = {
      id: `toast-${this.messageCounter++}`,
      text: message,
      kind: kind,
      duration: kind === 'error' ? 5000 : 3000
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, toastMessage]);

    // Auto-dismiss
    setTimeout(() => {
      this.dismiss(toastMessage.id);
    }, toastMessage.duration);

    // Also show via ngx-toastr for enhanced UI
    this.showNgxToast(message, kind);
  }

  /**
   * Show a success toast message using ngx-toastr
   * @param message The success message to display
   * @param title Optional title for the toast
   */
  showSuccess(message: string, title?: string): void {
    this.show(message, 'success');
    this.showNgxToast(message, 'success');
  }

  /**
   * Show an error toast message using ngx-toastr
   * @param message The error message to display
   * @param title Optional title for the toast
   */
  showError(message: string, title?: string): void {
    this.show(message, 'error');
    this.showNgxToast(message, 'error');
  }

  /**
   * Show an info toast message using ngx-toastr
   * @param message The info message to display
   * @param title Optional title for the toast
   */
  showInfo(message: string, title?: string): void {
    this.show(message, 'info');
    this.showNgxToast(message, 'info');
  }

  /**
   * Show a warning toast message using ngx-toastr
   * @param message The warning message to display
   * @param title Optional title for the toast
   */
  showWarning(message: string, title?: string): void {
    this.showNgxToast(message, 'info');
  }

  /**
   * Dismiss a toast by id
   * @param id The toast id to dismiss
   */
  dismiss(id: string): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next(currentMessages.filter(m => m.id !== id));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.messagesSubject.next([]);
    this.toastr.clear();
  }

  /**
   * Internal method to show ngx-toastr notifications
   */
  private showNgxToast(message: string, kind: 'success' | 'error' | 'info'): void {
    const config = {
      timeOut: kind === 'error' ? 5000 : 3000,
      positionClass: 'toast-top-right',
      progressBar: true,
      progressAnimation: 'increasing' as const,
      closeButton: true,
      preventDuplicates: true
    };

    switch (kind) {
      case 'success':
        this.toastr.success(message, '', config);
        break;
      case 'error':
        this.toastr.error(message, '', config);
        break;
      case 'info':
        this.toastr.info(message, '', config);
        break;
    }
  }
}