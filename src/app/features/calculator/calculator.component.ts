import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { QuantityMeasurementService, QuantityInputDTO, QuantityMeasurementDTO } from '../../core/services/quantity-measurement.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css'
})
export class CalculatorComponent implements OnChanges {
  @Input() selectedType = 'length';
  @Input() operation: 'compare' = 'compare';

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
  isComparing = false;

  constructor(private svc: QuantityMeasurementService) {}

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
    }
  }

  isCompareInputValid(): boolean {
    return this.value1 !== null && this.value1 !== undefined && !Number.isNaN(this.value1)
      && this.value2 !== null && this.value2 !== undefined && !Number.isNaN(this.value2)
      && !!this.unit1 && !!this.unit2;
  }

  compare() {
    this.error = null;

    if (!this.isCompareInputValid()) {
      this.compareResult = null;
      this.error = 'Please provide valid values and select both units before comparing';
      return;
    }

    const type = this.getMeasurementType();
    const input: QuantityInputDTO = {
      thisQuantityDTO: { value: this.value1, unit: this.unit1, measurementType: type },
      thatQuantityDTO: { value: this.value2, unit: this.unit2, measurementType: type }
    };

    console.debug('[CalculatorComponent] compare payload', input);

    this.isComparing = true;

    this.svc.compare(input).pipe(
      finalize(() => {
        setTimeout(() => this.isComparing = false, 100);
      })
    ).subscribe({
      next: (res: QuantityMeasurementDTO) => {
        const resultString = res?.resultString?.toLowerCase();
        if (resultString !== 'true' && resultString !== 'false') {
          this.compareResult = null;
          this.error = 'Unexpected response format from server';
          return;
        }

        this.compareResult = resultString === 'true';
        this.error = null;
      },
      error: (err) => {
        this.error = err?.userMessage || err?.error?.message || err?.error?.error || 'Comparison failed';
        this.compareResult = null;
      }
    });
  }
}
