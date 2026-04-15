import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { QuantityMeasurementService, QuantityInputDTO } from '../../core/services/quantity-measurement.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.css'
})
export class ConverterComponent implements OnChanges {
  @Input() selectedType = 'length';

  units: Record<string, string[]> = {
    length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
    weight: ['MILLIGRAM', 'GRAM', 'KILOGRAM', 'POUND', 'TONNE'],
    temperature: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
    volume: ['LITER', 'MILLILITER', 'GALLON']
  };

  fromValue: number = 1;
  fromUnit: string = 'FEET';
  toValue: number | null = null;
  toUnit: string = 'INCHES';
  conversionError: string | null = null;
  isConverting = false;

  constructor(
    private svc: QuantityMeasurementService,
    private toastService: ToastService
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
      this.fromUnit = this.currentUnits[0];
      this.toUnit = this.currentUnits[0];
      this.toValue = null;
      this.conversionError = null;
    }
  }

  convert() {
    this.conversionError = null;

    if (this.fromValue === null || this.fromValue === undefined || Number.isNaN(this.fromValue)) {
      this.toValue = null;
      this.conversionError = 'Please enter a valid source value';
      return;
    }

    if (!this.fromUnit || !this.toUnit) {
      this.toValue = null;
      this.conversionError = 'Please select both source and target units';
      return;
    }

    const type = this.getMeasurementType();
    const input: QuantityInputDTO = {
      thisQuantityDTO: { value: this.fromValue, unit: this.fromUnit, measurementType: type },
      thatQuantityDTO: { value: 0, unit: this.toUnit, measurementType: type },
      targetQuantityDTO: { value: 0, unit: this.toUnit, measurementType: type }
    };

    this.isConverting = true;

    this.svc.convert(input)
      .pipe(finalize(() => {
        // Ensure reset happens in next tick to avoid rapid state changes 
        // that might not be caught by change detection in some scenarios
        setTimeout(() => this.isConverting = false, 100);
      }))
      .subscribe({
        next: (res) => {
          if (res && res.resultValue !== undefined && res.resultValue !== null) {
            this.toValue = res.resultValue;
            this.conversionError = null;
            // No success toast for routine conversions - result is visible in UI
          } else {
            this.toValue = null;
            this.conversionError = 'Unexpected response format from server';
            this.toastService.showError('Unexpected response format from server');
          }
        },
        error: (err) => {
          const errorMsg = err?.userMessage
            || err?.error?.message
            || (err?.status === 0 ? 'Connection error. Is API Gateway running?' : 'Conversion failed');
          this.conversionError = errorMsg;
          this.toastService.showError(errorMsg);
          this.toValue = null;
        }
      });
  }
}
