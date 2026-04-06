import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuantityDTO {
  value: number;
  unit: string;
  measurementType: string;
}

export interface QuantityInputDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
  targetQuantityDTO?: QuantityDTO;
}

export interface QuantityMeasurementDTO {
  thisValue: number;
  thisUnit: string;
  thatValue: number;
  thatUnit: string;
  operation: string;
  resultString: string;
  resultValue: number;
  resultUnit: string;
  errorMessage: string;
  error: boolean;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuantityMeasurementService {
  private apiUrl = `${environment.apiUrl}/user/quantities`;

  constructor(private http: HttpClient) {}

  compare(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/compare`, input);
  }

  convert(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/convert`, input);
  }

  add(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    if (input.targetQuantityDTO && input.targetQuantityDTO.unit) {
      return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/add-with-target-unit`, input);
    }
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/add`, input);
  }

  subtract(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    if (input.targetQuantityDTO && input.targetQuantityDTO.unit) {
      return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/subtract-with-target-unit`, input);
    }
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/subtract`, input);
  }

  multiply(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/multiply`, input);
  }

  divide(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    return this.http.post<QuantityMeasurementDTO>(`${this.apiUrl}/divide`, input);
  }
}
