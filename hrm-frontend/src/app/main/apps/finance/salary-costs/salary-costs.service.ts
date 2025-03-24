import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class SalaryCostsService {
  public onExpenseListChanged: BehaviorSubject<any>;
  constructor(private _httpClient: HttpClient) {
    this.onExpenseListChanged = new BehaviorSubject([]);
  }
  public rows: any[] = [];
  filterExpense(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    search?: string,
    branchId?: string,
    status?: string,
    employeeId?: string,
    billingCycle?: string
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
    if (branchId) {
      params.branchId = branchId;
    }
    if (status) {
      params.status = status;
    }
    if (employeeId) {
      params.employeeId = employeeId;
    }
    if (billingCycle) {
      params.billingCycle = billingCycle;
    }
    params.type = "SALARY";
    return this._httpClient
      .get(`${environment.apiUrl}/expense`, { params })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get expense:", error);
          throw error;
        })
      );
  }

  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/expense`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching expense data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onExpenseListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }
  // Hàm tạo mới Expense
  createExpense(expenseData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/expense`, expenseData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Expense:", error);
          throw error;
        })
      );
  }

  changeStatus(body: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/expense/update-status`, body)
      .pipe(
        map((response: any) => {

          return response;
        }),
        catchError((error) => {
          console.error("Error creating Expense:", error);
          throw error;
        })
      );
  }

  // Hàm cập nhật Expense
  updateExpense(expenseId: number, expenseData: any): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/expense/${expenseId}`, expenseData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error updating Expense:", error);
          throw error;
        })
      );
  }

  getTemplate(
    branch: string,
    type: string,
    billingCycle: string
  ): Observable<Blob> {
    const body = {
      branch,
      type,
      billingCycle,
    };
    return this._httpClient
      .post(
        `${environment.apiUrl}/expense/get-template`,
        body,
        {
          responseType: "blob", // Cấu hình để nhận blob
        }
      )
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get one expense:", error);
          throw error;
        })
      );
  }

  export(): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/expense/export-salary`, {
        responseType: "blob", // Cấu hình để nhận blob
      })
      .pipe(
        map((response: any) => {

          return response;
        }),
        catchError((error) => {
          console.error("Error get one expense:", error);
          throw error;
        })
      );
  }

  importExpense(formData: FormData, type: string): Observable<any> {
    return this._httpClient
      .post(
        `${environment.apiUrl}/expense/import/type/${type}`,
        formData,
        {
          responseType: "json", // Cấu hình nhận JSON thay vì blob
        }
      )
      .pipe(
        map((response: any) => {
          return response; // Trả về JSON phản hồi để xử lý tiếp trên frontend
        }),
        catchError((error) => {
          console.error("Error during import:", error);
          throw error;
        })
      );
  }

  getOneExpense(expenseId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/expense/${expenseId}`)
      .pipe(
        map((response: any) => {

          return response;
        }),
        catchError((error) => {
          console.error("Error get one expense:", error);
          throw error;
        })
      );
  }

  deleteExpense(expenseIds: number[]): Observable<any> {
    const options = {
      headers: { "Content-Type": "application/json" },
      body: { ids: expenseIds }, // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };
    return this._httpClient
      .delete(`${environment.apiUrl}/expense`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting expense:", error);
          throw error;
        })
      );
  }
}
