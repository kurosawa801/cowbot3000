import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constants } from '../interfaces/constants.interface';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getConstants(): Observable<Constants> {
    return this.http.get<Constants>(`${this.apiUrl}/constants`);
  }

  updateConstants(constants: Constants): Observable<Constants> {
    return this.http.put<Constants>(`${this.apiUrl}/constants`, constants);
  }
}
