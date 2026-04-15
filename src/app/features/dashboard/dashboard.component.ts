import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ConverterComponent } from '../converter/converter.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { ArithmeticComponent } from '../arithmetic/arithmetic.component';
import { AuthService } from '../../core/services/auth.service';

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

  constructor(public authService: AuthService, private router: Router) {}

  selectType(typeId: string) {
    this.selectedType = typeId;
  }

  selectAction(actionId: string) {
    if (actionId === 'history') {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/history']);
      }
      // If not authenticated, do nothing (button is visually disabled)
      return;
    }

    this.selectedAction = actionId;
  }
}
