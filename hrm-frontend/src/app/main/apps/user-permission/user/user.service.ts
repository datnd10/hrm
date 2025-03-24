import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { environment } from "environments/environment";
@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private _httpClient: HttpClient) { }

  findOneEmployee(employeeId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/employee/${employeeId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error finding Employee:", error);
          throw error;
        })
      );
  }
}
