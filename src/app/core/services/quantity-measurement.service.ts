import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, catchError, map, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  timestamp?: string | Date;
}



interface RawConvertResponse {
  resultValue?: number | string;
  result_value?: number | string;
  value?: number | string;
  data?: {
    resultValue?: number | string;
    result_value?: number | string;
    value?: number | string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QuantityMeasurementService {
  private apiUrl = `${environment.apiUrl}/user/quantities`;
  private readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  private historyRefreshSubject = new Subject<void>();
  public historyRefresh$ = this.historyRefreshSubject.asObservable();
  private readonly allowedMeasurementTypes = new Set([
    'LengthUnit',
    'VolumeUnit',
    'WeightUnit',
    'TemperatureUnit'
  ]);

  constructor(private http: HttpClient) {}

  notifyHistoryChanged() {
    this.historyRefreshSubject.next();
  }

  private isValidQuantityDTO(quantity: QuantityDTO | undefined | null): boolean {
    return !!quantity
      && typeof quantity.value === 'number'
      && Number.isFinite(quantity.value)
      && typeof quantity.unit === 'string'
      && quantity.unit.trim().length > 0
      && typeof quantity.measurementType === 'string'
      && quantity.measurementType.trim().length > 0
      && this.allowedMeasurementTypes.has(quantity.measurementType);
  }

  private validateRequestPayload(endpoint: string, input: QuantityInputDTO): string | null {
    if (!this.isValidQuantityDTO(input?.thisQuantityDTO)) {
      return `Invalid request payload for ${endpoint}: thisQuantityDTO is missing or invalid`;
    }

    if (!this.isValidQuantityDTO(input?.thatQuantityDTO)) {
      return `Invalid request payload for ${endpoint}: thatQuantityDTO is missing or invalid`;
    }

    return null;
  }

  private handleApiError(endpoint: string, err: any) {
    const backendMessage = err?.error?.message || err?.error?.error;
    const message = backendMessage
      || (err?.status === 400
        ? 'Invalid request. Please check value, unit and measurement type.'
        : 'Request failed. Please try again.');

    console.error(`[QuantityMeasurementService] ${endpoint} failed`, {
      status: err?.status,
      message,
      backendError: err?.error
    });

    return throwError(() => ({ ...err, userMessage: message }));
  }

  private logRequest(endpoint: string, input: QuantityInputDTO) {
    console.debug(`[QuantityMeasurementService] POST ${endpoint}`, JSON.stringify(input));
  }

  private resolveResultValue(raw: RawConvertResponse): number | null {
    const candidate = raw?.resultValue
      ?? raw?.result_value
      ?? raw?.value
      ?? raw?.data?.resultValue
      ?? raw?.data?.result_value
      ?? raw?.data?.value;

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  compare(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = `${this.apiUrl}/compare`;
    const validationError = this.validateRequestPayload(url, input);
    if (validationError) {
      return throwError(() => ({ userMessage: validationError }));
    }

    this.logRequest(url, input);
    return this.http.post<QuantityMeasurementDTO>(url, input, { headers: this.jsonHeaders }).pipe(
      tap((response) => {
        console.debug('[QuantityMeasurementService] compare response', response);
        this.notifyHistoryChanged();
      }),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  convert(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = `${this.apiUrl}/convert`;
    const validationError = this.validateRequestPayload(url, input);
    if (validationError) {
      return throwError(() => ({ userMessage: validationError }));
    }

    this.logRequest(url, input);
    return this.http.post<RawConvertResponse>(url, input, { headers: this.jsonHeaders }).pipe(
      timeout(15000),
      map((response) => {
        console.debug('[QuantityMeasurementService] convert raw response', response);
        const normalizedValue = this.resolveResultValue(response);
        if (normalizedValue === null) {
          throw {
            userMessage: 'Unexpected conversion response from server.'
          };
        }

        return {
          thisValue: 0,
          thisUnit: input.thisQuantityDTO.unit,
          thatValue: 0,
          thatUnit: input.thatQuantityDTO.unit,
          operation: 'CONVERT',
          resultString: '',
          resultValue: normalizedValue,
          resultUnit: input.thatQuantityDTO.unit,
          errorMessage: '',
          error: false
        } as QuantityMeasurementDTO;
      }),
      tap((response) => {
        console.debug('[QuantityMeasurementService] convert normalized response', response);
        this.notifyHistoryChanged();
      }),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  add(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = input.targetQuantityDTO && input.targetQuantityDTO.unit ? 
      `${this.apiUrl}/add-with-target-unit` : `${this.apiUrl}/add`;
    this.logRequest(url, input);
    return this.http.post<QuantityMeasurementDTO>(url, input, { headers: this.jsonHeaders }).pipe(
      tap(() => this.notifyHistoryChanged()),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  subtract(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = input.targetQuantityDTO && input.targetQuantityDTO.unit ? 
      `${this.apiUrl}/subtract-with-target-unit` : `${this.apiUrl}/subtract`;
    this.logRequest(url, input);
    return this.http.post<QuantityMeasurementDTO>(url, input, { headers: this.jsonHeaders }).pipe(
      tap(() => this.notifyHistoryChanged()),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  multiply(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = `${this.apiUrl}/multiply`;
    this.logRequest(url, input);
    return this.http.post<QuantityMeasurementDTO>(url, input, { headers: this.jsonHeaders }).pipe(
      tap(() => this.notifyHistoryChanged()),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  divide(input: QuantityInputDTO): Observable<QuantityMeasurementDTO> {
    const url = `${this.apiUrl}/divide`;
    this.logRequest(url, input);
    return this.http.post<QuantityMeasurementDTO>(url, input, { headers: this.jsonHeaders }).pipe(
      tap(() => this.notifyHistoryChanged()),
      catchError((err) => this.handleApiError(url, err))
    );
  }

  getOperationHistory(operation: string): Observable<QuantityMeasurementDTO[]> {
    return this.http.get<QuantityMeasurementDTO[]>(`${this.apiUrl}/history/operation/${operation}`).pipe(
      catchError((err) => this.handleApiError('getOperationHistory', err))
    );
  }

  getHistoryByType(type: string): Observable<QuantityMeasurementDTO[]> {
    return this.http.get<QuantityMeasurementDTO[]>(`${this.apiUrl}/history/type/${type}`).pipe(
      catchError((err) => this.handleApiError('getHistoryByType', err))
    );
  }

  getErroredHistory(): Observable<QuantityMeasurementDTO[]> {
    return this.http.get<QuantityMeasurementDTO[]>(`${this.apiUrl}/history/errored`).pipe(
      catchError((err) => this.handleApiError('getErroredHistory', err))
    );
  }

  clearHistoryByType(type: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/history/type/${type}`).pipe(
      tap(() => this.notifyHistoryChanged()),
      catchError((err) => this.handleApiError('clearHistoryByType', err))
    );
  }
}
