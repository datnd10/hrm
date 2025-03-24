import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { CoreCommonModule } from "@core/common.module";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { Ng2FlatpickrModule } from "ng2-flatpickr";
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
import { CorePipesModule } from "@core/pipes/pipes.module";
import { CoreDirectivesModule } from "@core/directives/directives";
import { CoreSidebarModule } from "@core/components";
import { AccountListComponent } from "./account-list.component";
import { AccountListService } from "./account-list.service";
import { EmployeeService } from "../../hrm-setting/employee/employee.service";
import { PositionService } from "../../hrm-setting/position/position.service";
import { DepartmentService } from "../../hrm-setting/department/department.service";
import { TableModule } from "app/main/component/table/table.module";
import { ActionModule } from "app/main/component/action/action.module";
import { CurrencyFormatModule } from "app/directive/currency-format/currency-format.module";

const routes: Routes = [
  {
    path: "list",
    component: AccountListComponent,
    // resolve: {
    //   bls: AccountListService,
    // },
    data: { animation: "AccountListComponent" },
  },
];

@NgModule({
  declarations: [AccountListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TableModule,
    ActionModule,
    CurrencyFormatModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
  ],
  providers: [
    EmployeeService,
    AccountListService,
    DepartmentService,
    PositionService,
  ],
})
export class AccountListModule { }
