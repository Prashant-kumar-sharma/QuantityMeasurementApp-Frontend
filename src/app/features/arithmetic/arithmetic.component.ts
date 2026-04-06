import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuantityMeasurementService, QuantityInputDTO } from '../../core/services/quantity-measurement.service';

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
  unit1: string = 'FEET';
  value2: number = 1;
  unit2: string = 'INCHES';
  resultValue: number | null = null;
  resultUnit: string = 'FEET';
  error: string | null = null;
  isLoading: boolean = false;

  constructor(private svc: QuantityMeasurementService, private cdr: ChangeDetectorRef) {}

  get currentUnits(): string[] {
    return this.units[this.selectedType] || this.units['length'];
  }

  get operatorSymbol(): string {
    const op = this.operations.find(o => o.id === this.selectedOperation);
    return op ? op.label.split('(')[1].replace(')', '') : '+';
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
      this.resetState();
    }
  }

  resetState() {
    this.resultValue = null;
    this.error = null;
    this.isLoading = false;
    this.cdr.detectChanges(); // Force UI reset
  }

  calculate() {
    if (this.value1 === null || this.value2 === null) return;
    
    this.error = null;
    this.resultValue = null;
    this.isLoading = true;
    this.cdr.detectChanges(); // Force "Calculating..." state to show

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

    call$.subscribe({
      next: (res: any) => {
        this.resultValue = res.resultValue;
        this.isLoading = false; // Reset loading
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        this.error = err?.error?.message || 'Calculation failed';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}