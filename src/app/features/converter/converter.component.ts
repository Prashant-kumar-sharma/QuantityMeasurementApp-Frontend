import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuantityMeasurementService, QuantityInputDTO } from '../../core/services/quantity-measurement.service';
import { HistoryService } from '../../core/services/history.service';
import { AuthService } from '../../core/services/auth.service';

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
  isLoading: boolean = false;

  constructor(
    private svc: QuantityMeasurementService, 
    private cdr: ChangeDetectorRef, // Added for immediate UI update
    private historyService: HistoryService,   // ✅ ADD
    private authService: AuthService 
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
      const availableUnits = this.currentUnits;
      this.fromUnit = availableUnits[0];
      this.toUnit = availableUnits[1] || availableUnits[0];
      this.toValue = null;
      this.conversionError = null;
      this.cdr.detectChanges();
    }
  }

  convertFrom() {
    if (this.fromValue === null) return;

    this.conversionError = null;
    this.isLoading = true;
    this.toValue = null;
    this.cdr.detectChanges(); // Show loading state immediately

    const type = this.getMeasurementType();
    const input: QuantityInputDTO = {
      thisQuantityDTO: { value: this.fromValue, unit: this.fromUnit, measurementType: type },
      thatQuantityDTO: { value: 0, unit: this.toUnit, measurementType: type },
      targetQuantityDTO: { value: 0, unit: this.toUnit, measurementType: type }
    };

    this.svc.convert(input).subscribe({
      next: (res: any) => { 
        this.toValue = res.resultValue !== undefined ? res.resultValue : res.value; 
        this.isLoading = false;

        // ✅ SAVE HISTORY HERE
        if (this.authService.isAuthenticated()) {
          this.historyService.saveHistory({
            action: `Converted ${this.fromValue} ${this.fromUnit} to ${this.toUnit}`,
            result: `${this.toValue}`
          }).subscribe({
            next: () => console.log('History saved'),
            error: (err) => console.log('Error saving history', err)
          });
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.conversionError = err?.error?.message || 'Conversion failed';
        this.toValue = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}