import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { QuantityMeasurementService, QuantityMeasurementDTO } from '../../core/services/quantity-measurement.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnChanges, OnInit, OnDestroy {
  @Input() selectedType = 'length';
  
  historyList: QuantityMeasurementDTO[] = [];
  isLoading = false;
  isClearing = false;
  error: string | null = null;
  private refreshSub?: Subscription;
  
  constructor(
    private svc: QuantityMeasurementService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadHistory();
    this.refreshSub = this.svc.historyRefresh$.subscribe(() => {
      this.loadHistory();
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedType'] && !changes['selectedType'].firstChange) {
      this.loadHistory();
    }
  }

  getMeasurementTypeParam(): string {
    const typeMap: Record<string, string> = {
      length: 'LengthUnit',
      weight: 'WeightUnit',
      temperature: 'TemperatureUnit',
      volume: 'VolumeUnit'
    };
    return typeMap[this.selectedType] || 'LengthUnit';
  }

  loadHistory() {
    this.isLoading = true;
    this.error = null;
    const typeParam = this.getMeasurementTypeParam();
    
    this.svc.getHistoryByType(typeParam).pipe(
      finalize(() => {
        setTimeout(() => this.isLoading = false, 200);
      })
    ).subscribe({
      next: (data) => {
        this.historyList = (data || []).reverse();
        // No success toast for routine history load - data is visible in UI
      },
      error: (err) => {
        const errorMsg = err?.userMessage || err?.error?.message || 'Failed to load history';
        this.error = errorMsg;
        this.toastService.showError(errorMsg);
      }
    });
  }

  clearHistory() {
    if (this.historyList.length === 0 || this.isClearing) {
      return;
    }

    const shouldClear = window.confirm(`Clear all ${this.selectedType} history records?`);
    if (!shouldClear) {
      return;
    }

    this.isClearing = true;
    this.error = null;
    const typeParam = this.getMeasurementTypeParam();

    this.svc.clearHistoryByType(typeParam)
      .pipe(finalize(() => {
        this.isClearing = false;
      }))
      .subscribe({
        next: () => {
          this.historyList = [];
        },
        error: (err) => {
          const errorMsg = err?.userMessage || err?.error?.message || 'Failed to clear history';
          this.error = errorMsg;
          this.toastService.showError(errorMsg);
        }
      });
  }

  formatOperation(dto: QuantityMeasurementDTO): string {
    switch(dto.operation) {
      case 'CONVERT': return `${dto.thisValue} ${dto.thisUnit} converted to ${dto.resultUnit}`;
      case 'COMPARE': return `Compared ${dto.thisValue} ${dto.thisUnit} and ${dto.thatValue} ${dto.thatUnit}`;
      case 'ADD': return `Added ${dto.thisValue} ${dto.thisUnit} and ${dto.thatValue} ${dto.thatUnit}`;
      case 'SUBTRACT': return `Subtracted ${dto.thatValue} ${dto.thatUnit} from ${dto.thisValue} ${dto.thisUnit}`;
      case 'MULTIPLY': return `Multiplied ${dto.thisValue} ${dto.thisUnit} by ${dto.thatValue}`;
      case 'DIVIDE': return `Divided ${dto.thisValue} ${dto.thisUnit} by ${dto.thatValue}`;
      default: return dto.operation;
    }
  }

  formatOperationType(operation: string): string {
    if (!operation) return 'Unknown';
    return operation.charAt(0) + operation.slice(1).toLowerCase();
  }
}
