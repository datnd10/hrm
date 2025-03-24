import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  public rows: any[] = [];
  public onContractListChanged: BehaviorSubject<any>;

  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onContractListChanged = new BehaviorSubject([]);
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

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/contract`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching contract data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onContractListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }

  createContract(contractData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/contract`, contractData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Contract:", error);
          throw error;
        })
      );
  }

  updateContract(contractId: number, contractData: any): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/contract/${contractId}`, contractData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Contract:", error);
          throw error;
        })
      );
  }

  getOneContract(contractId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/contract/${contractId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error finding Contract:", error);
          throw error;
        })
      );
  }

  getContractByEmployee(contractId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/contract/employee/${contractId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error finding Contract:", error);
          throw error;
        })
      );
  }

  deleteContract(contractIds: number[]): Observable<any> {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      body: { ids: contractIds }  // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/contract`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting contract:", error);
          throw error;
        })
      );
  }

  filterContracts(
    page: number, itemsPerPage: number, sortColumn: string, sortDirection: string, searchByBranch?: string,
    searchByDepartment?: string, searchByPosition?: string, searchByStatus?: string, searchByFullName?: string): Observable<any> {
    const params: any = {
      page: page.toString(),
      limit: itemsPerPage.toString(),
      sortBy: sortColumn,
      sortDirection: sortDirection,
    };

    if (searchByBranch) {
      params.branchId = searchByBranch;
    }
    if (searchByDepartment) {
      params.departmentId = searchByDepartment;
    }
    if (searchByPosition) {
      params.positionId = searchByPosition;
    }
    if (searchByStatus) {
      params.status = searchByStatus;
    }
    if (searchByFullName) {
      params.search = searchByFullName;
    }
    return this._httpClient
      .get(`${environment.apiUrl}/contract`, { params })
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
}
