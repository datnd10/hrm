import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ExpenseType } from "shared/models/expenseType.model";

@Injectable({
  providedIn: "root",
})
export class ExpenseTypeService {
  public onExpenseTypeListChanged: BehaviorSubject<any>;
  constructor(private _httpClient: HttpClient) {
    this.onExpenseTypeListChanged = new BehaviorSubject([]);
  }
  public rows: any[] = [];
  filterExpenseType(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    search?: string,
    type?: string
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
    if (type) {
      params.type = type;
    }
    return this._httpClient
      .get(`${environment.apiUrl}/expense-type`, { params })
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

  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/expense-type`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching expense type data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onExpenseTypeListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }

  getListExpenseType(): Observable<any> {
    return this._httpClient.get(`${environment.apiUrl}/expense-type/all`).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error) => {
        console.error("Error get list expense-type:", error);
        throw error;
      })
    );
  }

  getOneExpenseType(id: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/expense-type/${id}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get one position:", error);
          throw error;
        })
      );
  }

  createExpenseType(expenseTypeData: ExpenseType): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/expense-type`, expenseTypeData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error expense type:", error);
          throw error;
        })
      );
  }

  updateExpenseType(
    expenseTypeId: number,
    expenseTypeData: ExpenseType
  ): Observable<any> {
    return this._httpClient
      .put(
        `${environment.apiUrl}/expense-type/${expenseTypeId}`,
        expenseTypeData
      )
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error expense type:", error);
          throw error;
        })
      );
  }

  deleteExpenseType(expenseIds: number[]): Observable<any> {
    const options = {
      header: { "Content-Type": "application/json" },
      body: { ids: expenseIds },
    };
    return this._httpClient
      .delete(`${environment.apiUrl}/expense-type`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error expense type:", error);
          throw error;
        })
      );
  }
}
