import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ConverterComponent } from '../converter/converter.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { ArithmeticComponent } from '../arithmetic/arithmetic.component';
import { AuthService } from '../../core/services/auth.service';
import { QuantityMeasurementService, QuantityMeasurementDTO } from '../../core/services/quantity-measurement.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ConverterComponent, CalculatorComponent, ArithmeticComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  selectedType: string = 'length';
  selectedAction: string = 'conversion';
  
  recentCalculations: QuantityMeasurementDTO[] = [];
  private historySub?: Subscription;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private measurementService: QuantityMeasurementService
  ) {}

  ngOnInit() {
    this.loadRecentCalculations();
    this.historySub = this.measurementService.historyRefresh$.subscribe(() => {
      this.loadRecentCalculations();
    });
  }

  ngOnDestroy() {
    if (this.historySub) {
      this.historySub.unsubscribe();
    }
  }

  loadRecentCalculations() {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    const typeMap: Record<string, string> = {
      length: 'LengthUnit',
      weight: 'WeightUnit',
      temperature: 'TemperatureUnit',
      volume: 'VolumeUnit'
    };
    
    const typeParam = typeMap[this.selectedType] || 'LengthUnit';
    
    this.measurementService.getHistoryByType(typeParam).subscribe({
      next: (data) => {
        // Get the 5 most recent calculations
        this.recentCalculations = (data || []).reverse().slice(0, 5);
      },
      error: (err) => {
        console.error('Failed to load recent calculations', err);
      }
    });
  }

  selectType(typeId: string) {
    this.selectedType = typeId;
    
    // Disable calculate action for temperature
    if (this.selectedType === 'temperature' && this.selectedAction === 'arithmetic') {
      this.selectedAction = 'conversion';
    }
    
    this.loadRecentCalculations();
  }

  selectAction(actionId: string) {
    if (actionId === 'history') {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/history']);
      }
      // If not authenticated, do nothing (button is visually disabled)
      return;
    }
    
    if (actionId === 'arithmetic' && this.selectedType === 'temperature') {
      return;
    }

    this.selectedAction = actionId;
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
