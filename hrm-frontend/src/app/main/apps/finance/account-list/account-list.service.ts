import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { environment } from "environments/environment"; // Đảm bảo biến môi trường của bạn được cấu hình chính xác
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AccountListService implements Resolve<any> {
  public rows: any[] = [];
  public onAccountListChanged: BehaviorSubject<any>;

  constructor(private _httpClient: HttpClient) {
    // Thiết lập mặc định
    this.onAccountListChanged = new BehaviorSubject([]);
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
    return new Promise<void>((resolve, reject) => {
      Promise.all([this.getDataTableRows()]).then(() => {
        resolve();
      }, reject);
    });
  }


  // Method to get the list of branches
  getBranchList(): Observable<any[]> {
    return this._httpClient.get(`${environment.apiUrl}/branch/all`).pipe(
      map((response: any) => {
        if (response && response.data) {
          return response.data; // Returning branch list data
        } else {
          return [];
        }
      }),
      catchError((error) => {
        console.error("Lỗi khi tải danh sách chi nhánh:", error);
        return [];
      })
    );
  }

  filterBankAccount(
    page: number,
    itemsPerPage: number,
    sortColumn: string,
    sortDirection: string,
    searchByBankName?: string,
    searchByAccountName?: string
  ): Observable<any> {
    const params: any = {
      page: page.toString(),
      limit: itemsPerPage.toString(),
      sortBy: sortColumn,
      sortDirection: sortDirection,
    };
    if (searchByBankName) {
      params.searchByBankName = searchByBankName;
    }
    if (searchByAccountName) {
      params.searchByAccountName = searchByAccountName;
    }
    return this._httpClient
      .get(`${environment.apiUrl}/bank-account`, { params })
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

  /**
   * Lấy danh sách tài khoản ngân hàng trong Db
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/bank-account`) // URL của API
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Lỗi khi tải dữ liệu tài khoản ngân hàng:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onAccountListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }

  // Hàm đã tồn tại để tạo tài khoản ngân hàng
  createBankAccount(accountData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/bank-account`, accountData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Lỗi khi tạo tài khoản ngân hàng:", error);
          throw error;
        })
      );
  }

  getOneBankAccount(id: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/bank-account/${id}`)
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

  getAllBankAccount(): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/bank-account/all`)
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


  // Thêm hàm để cập nhật tài khoản ngân hàng
  updateBankAccount(accountId: number, accountData: any): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/bank-account/${accountId}`, accountData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Lỗi khi cập nhật tài khoản ngân hàng:", error);
          throw error;
        })
      );
  }

  /**
   * Xóa tài khoản ngân hàng
   */
  deleteBankAccount(accountIds: number[]): Observable<any> {
    const options = {
      headers: { "Content-Type": "application/json" },
      body: { ids: accountIds },
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/bank-account`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Lỗi khi xóa tài khoản ngân hàng:", error);
          throw error;
        })
      );
  }
}
