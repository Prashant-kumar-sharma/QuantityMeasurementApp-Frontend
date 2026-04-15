import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { QuantityMeasurementService, QuantityInputDTO, QuantityMeasurementDTO } from '../../core/services/quantity-measurement.service';

@Component({
  selector: 'app-arithmetic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './arithmetic.component.html',
  styleUrl: './arithmetic.component.css'
})
export class ArithmeticComponent implements OnChanges {
  @Input() selectedType = 'length';

  operations = [
    { id: 'add', label: 'Add (+)' },
    { id: 'subtract', label: 'Subtract (-)' },
    { id: 'multiply', label: 'Multiply (×)' },
    { id: 'divide', label: 'Divide (÷)' },
  ];

  selectedOperation: string = 'add';

  units: Record<string, string[]> = {
    length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
    weight: ['MILLIGRAM', 'GRAM', 'KILOGRAM', 'POUND', 'TONNE'],
    temperature: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
    volume: ['LITER', 'MILLILITER', 'GALLON']
  };

  value1: number = 1;
  unit1: string = 'KILOGRAM';

  value2: number = 1;
  unit2: string = 'GRAM';

  resultValue: number | null = null;
  resultUnit: string = 'KILOGRAM';
  error: string | null = null;
  isLoading: boolean = false;

  constructor(private svc: QuantityMeasurementService) {}

  get currentUnits(): string[] {
    return this.units[this.selectedType] || this.units['length'];
  }

  get operatorSymbol(): string {
    switch (this.selectedOperation) {
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '+';
    }
  }

  private getMeasurementType(): string {
    const typeMap: Record<string, string> = {
      length: 'LengthUnit',
      weight: 'WeightUnit',
      temperature: 'TemperatureUnit',
      volume: 'VolumeUnit'
    };
    return typeMap[this.selectedType] || 'LengthUnit';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedType']) {
      this.unit1 = this.currentUnits[0];
      this.unit2 = this.currentUnits[1] ?? this.currentUnits[0];
      this.resultUnit = this.currentUnits[0];
      this.resultValue = null;
    }
  }

  calculate() {
    this.error = null;
    this.resultValue = null;
    this.isLoading = true;

    // Input validation
    if (this.value1 === null || this.value1 === undefined || this.value2 === null || this.value2 === undefined || 
        isNaN(this.value1) || isNaN(this.value2)) {
      this.error = 'Please enter valid numbers for both values';
      this.isLoading = false;
      return;
    }

    // Division by zero validation
    if (this.selectedOperation === 'divide' && this.value2 === 0) {
      this.error = 'Cannot divide by zero';
      this.isLoading = false;
      return;
    }

    const type = this.getMeasurementType();
    const input: QuantityInputDTO = {
      thisQuantityDTO: { value: this.value1, unit: this.unit1, measurementType: type },
      thatQuantityDTO: { value: this.value2, unit: this.unit2, measurementType: type },
      targetQuantityDTO: { value: 0, unit: this.resultUnit, measurementType: type }
    };

    let call$;
    switch (this.selectedOperation) {
      case 'subtract': call$ = this.svc.subtract(input); break;
      case 'multiply': call$ = this.svc.multiply(input); break;
      case 'divide': call$ = this.svc.divide(input); break;
      default: call$ = this.svc.add(input); break;
    }

    call$.pipe(
      finalize(() => {
        setTimeout(() => this.isLoading = false, 100);
      })
    ).subscribe({
      next: (res: QuantityMeasurementDTO) => {
        this.resultValue = typeof res.resultValue === 'number' ? res.resultValue : null;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Calculation failed';
        this.resultValue = null;
      }
    });
  }

  setOperator(op: string) {
    const opMap: Record<string, string> = {
      '+': 'add',
      '-': 'subtract',
      '*': 'multiply',
      '/': 'divide'
    };
    this.selectedOperation = opMap[op] || 'add';
    this.resultValue = null;
  }
}
