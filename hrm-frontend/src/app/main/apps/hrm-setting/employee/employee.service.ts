import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class EmployeeService implements Resolve<any> {
  public rows: any[] = [];
  public onEmployeeListChanged: BehaviorSubject<any>;

  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onEmployeeListChanged = new BehaviorSubject([]);
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

  getProvinces(): Observable<any> {
    return this._httpClient.get('/api/p');
  }

  getDistricts(provinceId: string): Observable<any> {
    return this._httpClient.get(`/api/p/${provinceId}?depth=2`);
  }

  getWards(districtId: string): Observable<any> {
    return this._httpClient.get(`/api/d/${districtId}?depth=2`);
  }

  /**
   * Get rows
   */
  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/employee`)
        .pipe(
          map((response: any) => {
            if (response && response.data) {
              return response.data;
            } else {
              return [];
            }
          }),
          catchError((error) => {
            console.error("Error fetching employee data:", error);
            return [];
          })
        )
        .subscribe((data: any[]) => {
          this.rows = data;
          this.onEmployeeListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }

  createEmployee(employeeData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/employee`, employeeData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Employee:", error);
          throw error;
        })
      );
  }

  updateEmployee(employeeId: number, employeeData: any): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/employee/${employeeId}`, employeeData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Employee:", error);
          throw error;
        })
      );
  }

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

  deleteEmployee(employeeIds: number[]): Observable<any> {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      body: { ids: employeeIds }  // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/employee`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting Employee:", error);
          throw error;
        })
      );
  }

  getEmployeeByDepartment(departmentId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/employee/department/${departmentId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get list employee:", error);
          throw error;
        })
      );
  }

  getEmployeeByBranch(branchId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/employee/branch/${branchId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get list employee:", error);
          throw error;
        })
      );
  }

  filterEmployees(
    page: number, itemsPerPage: number, sortColumn: string, sortDirection: string, searchByBranch?: string,
    searchByDepartment?: string, searchByPosition?: string, searchByRole?: string, searchByFullName?: string): Observable<any> {
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
    if (searchByRole) {
      params.roleId = searchByRole;
    }
    if (searchByFullName) {
      params.search = searchByFullName;
    }

    return this._httpClient
      .get(`${environment.apiUrl}/employee`, { params })
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

