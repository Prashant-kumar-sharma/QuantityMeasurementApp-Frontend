import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../../core/services/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {

  historyList: any[] = [];

  constructor(
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef   // ✅ ADD THIS
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  goBack() {
    window.history.back();   // simple back
  }

  colors = [
  { light: '#e8f0ff', dark: '#4f6ef7' },
  { light: '#e6fff4', dark: '#00b894' },
  { light: '#fff4e6', dark: '#f39c12' },
  { light: '#ffe6f0', dark: '#e84393' },
  { light: '#f0e6ff', dark: '#6c5ce7' }
];

getRandomColor(index: number) {
  return this.colors[index % this.colors.length];
}

  loadHistory() {
    this.historyService.getHistory().subscribe({
      next: (res: any) => {
        this.historyList = res;

        // ✅ FORCE UI UPDATE
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading history', err);
      }
    });
  }
}