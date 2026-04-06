import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConverterComponent } from '../converter/converter.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { ArithmeticComponent } from '../arithmetic/arithmetic.component';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ConverterComponent,
    CalculatorComponent,
    ArithmeticComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  selectedType: string = 'length';
  selectedAction: string = 'conversion';

  // NEW: use variable instead of calling service in HTML
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // initialize once
    this.isAdmin = this.authService.isAdmin();
  }

  // navigation logic
  goToHistory() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/history']);
    }
  }

  // UI handlers
  selectType(typeId: string) {
    this.selectedType = typeId;
  }

  selectAction(actionId: string) {
    this.selectedAction = actionId;
  }
}