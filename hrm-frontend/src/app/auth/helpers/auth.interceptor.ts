import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { AuthenticationService } from '../service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;

    constructor(private authService: AuthenticationService, private router: Router, private toastr: ToastrService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const accessToken = this.authService.getAccessToken();


        if (accessToken) {
            request = this.addToken(request, accessToken);
        }

        return next.handle(request).pipe(
            map((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    // Kiểm tra statusCode trong body của response
                    const body = event.body;
                    if (body && body.statusCode === 401) {
                        throw { status: 401, statusText: 'Unauthorized access' };
                    }
                    else if (body && body.statusCode === 403) {

                        throw { status: 403, statusText: 'Forbidden access' };
                    }
                }
                return event;
            }),
            catchError((error) => {
                console.log(error);

                // Xử lý lỗi
                if ((error.status === 401 || error.message === '401') && !this.isRefreshing) {
                    this.isRefreshing = true;
                    return this.authService.refreshToken().pipe(
                        switchMap((tokens: any) => {
                            this.isRefreshing = false;
                            return next.handle(this.addToken(request, tokens.accessToken));
                        }),
                        catchError((err) => {
                            this.isRefreshing = false;
                            this.toastr.error('Bạn chưa đăng nhập', 'Đăng nhập');
                            this.authService.logout();
                            this.router.navigate(['/login']);
                            return throwError(err);
                        })
                    );
                }
                return throwError(error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string) {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
}
