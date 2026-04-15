import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div
        *ngFor="let message of toastService.messages$ | async"
        class="toast glass-card"
        [class.toast-error]="message.kind === 'error'"
        [class.toast-success]="message.kind === 'success'"
        [class.toast-info]="message.kind === 'info'"
      >
        <div class="toast-icon">
          <svg *ngIf="message.kind === 'success'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <svg *ngIf="message.kind === 'error'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <svg *ngIf="message.kind === 'info'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <span class="toast-text">{{ message.text }}</span>
        <button type="button" class="close-btn" (click)="toastService.dismiss(message.id)" aria-label="Dismiss notification">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
    .toast-stack {
      position: fixed;
      top: 100px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      border-left: 4px solid var(--primary);
      animation: toast-enter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
    }

    .toast-text {
      flex-grow: 1;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .toast-success { 
      border-left-color: #10b981; 
      background: rgba(16, 185, 129, 0.1);
    }
    .toast-success .toast-icon { color: #10b981; }

    .toast-error { 
      border-left-color: #f43f5e; 
      background: rgba(244, 63, 94, 0.1);
    }
    .toast-error .toast-icon { color: #f43f5e; }

    .toast-info { 
      border-left-color: var(--primary); 
      background: rgba(99, 102, 241, 0.1);
    }
    .toast-info .toast-icon { color: var(--primary); }

    .close-btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-main);
    }

    @keyframes toast-enter {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    `
  ]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
