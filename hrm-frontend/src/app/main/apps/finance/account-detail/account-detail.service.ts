import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AccountDetailService implements Resolve<any> {
  constructor() {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const accountId = route.paramMap.get("id");
    console.log("Resolver - Account ID:", accountId);

    // Simulate data fetching or return the necessary data
    return of({}); // Replace with actual logic if needed
  }
}
