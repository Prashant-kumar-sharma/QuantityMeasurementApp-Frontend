import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuantityMeasurementService, QuantityInputDTO } from '../../core/services/quantity-measurement.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css'
})
export class CalculatorComponent implements OnChanges {
  @Input() selectedType = 'length';

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

  compareResult: boolean | null = null;
  error: string | null = null;
  isLoading: boolean = false;

  constructor(
    private svc: QuantityMeasurementService, 
    private cdr: ChangeDetectorRef // Added for immediate UI update
  ) {}

  get currentUnits(): string[] {
    return this.units[this.selectedType] || this.units['length'];
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
      this.compareResult = null;
      this.error = null;
      this.cdr.detectChanges();
    }
  }

  compare() {
    this.error = null;
    this.compareResult = null;
    this.isLoading = true;
    this.cdr.detectChanges(); // Change button to "Comparing..." immediately

    const type = this.getMeasurementType();
    const input: QuantityInputDTO = {
      thisQuantityDTO: { value: this.value1, unit: this.unit1, measurementType: type },
      thatQuantityDTO: { value: this.value2, unit: this.unit2, measurementType: type }
    };

    this.svc.compare(input).subscribe({
      next: (res) => {
        const resultStr = res.resultString?.toString().toLowerCase().trim();
        this.compareResult = (resultStr === 'true') || (resultStr === 'equal') ||
          (res.resultValue !== undefined && res.resultValue === 1);
        
        this.isLoading = false;
        this.cdr.detectChanges(); // Show result card on first click
      },
      error: (err) => {
        this.error = err?.error?.message || 'Comparison failed';
        this.isLoading = false;
        this.compareResult = null;
        this.cdr.detectChanges();
      }
    });
  }
}