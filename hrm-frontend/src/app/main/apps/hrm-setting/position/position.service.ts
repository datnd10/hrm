import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { environment } from "environments/environment";

import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable()
export class PositionService implements Resolve<any> {
  public rows: any;
  public onPositionListChanged: BehaviorSubject<any>;

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(private _httpClient: HttpClient) {
    // Set the defaults
    this.onPositionListChanged = new BehaviorSubject({});
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
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

  createPosition(positionData: any): Observable<any> {
    return this._httpClient
      .post(`${environment.apiUrl}/position`, positionData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating position:", error);
          throw error;
        })
      );
  }

  filterPositions(
    page: number, itemsPerPage: number, sortColumn: string, sortDirection: string, searchByBranch?: string,
    searchByDepartment?: string, searchByPositionName?: string,): Observable<any> {
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
    if (searchByPositionName) {
      params.search = searchByPositionName;
    }

    return this._httpClient
      .get(`${environment.apiUrl}/position`, { params })
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

  updatePosition(positionId: number, positionData: any): Observable<any> {
    return this._httpClient
      .put(`${environment.apiUrl}/position/${positionId}`, positionData)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error creating Position:", error);
          throw error;
        })
      );
  }

  getOnePosition(positionId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/position/${positionId}`)
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

  deletePosition(positionIds: number[]): Observable<any> {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      body: { ids: positionIds }  // Đẩy dữ liệu ids vào body của yêu cầu DELETE
    };

    return this._httpClient
      .delete(`${environment.apiUrl}/position`, options)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error deleting position:", error);
          throw error;
        })
      );
  }


  getListPosition(): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/position`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get list position:", error);
          throw error;
        })
      );
  }

  getPositionByDepartmentId(departmentId: number): Observable<any> {
    return this._httpClient
      .get(`${environment.apiUrl}/position/department/${departmentId}`)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.error("Error get list position:", error);
          throw error;
        })
      );
  }



  getDataTableRows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient
        .get(`${environment.apiUrl}/position`)
        .subscribe((response: any) => {
          this.rows = response.data;
          this.onPositionListChanged.next(this.rows);
          resolve(this.rows);
        }, reject);
    });
  }
}
