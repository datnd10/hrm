import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  public onJobListChanged: BehaviorSubject<any>;
  constructor(private _httpClient: HttpClient) {
    this.onJobListChanged = new BehaviorSubject([]);
  }

  public rows: any[] = [];

  filterJob(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    search?: string,
    status?: string
  ): Observable<any> {
    const params: any = {
      page: page.toString(),
      limit: itemsPerPage.toString(),
      sortBy: sortColumn,
      sortDirection: sortDirection,
    };
    if (search) {
      params.search = search;
    }
    if (status) {
      params.status = status;
    }
    return this._httpClient
      .get(`${environment.apiUrl}/job`, { params })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get branch:", error);
          throw error;
        })
      );
  }


  getOnejob(jobId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/job/${jobId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get one job:", error);
          throw error;
        })
      );
  }

  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/job`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching job type data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onJobListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }
}
