import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EmployeeComponent } from "./employee.component";
import { EmployeeService } from "./employee.service";
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
import { PositionService } from "../position/position.service";
import { TableModule } from "app/main/component/table/table.module";
import { BranchService } from "../branch/branch.service";
import { DepartmentService } from "../department/department.service";
import { AccountListService } from "../../finance/account-list/account-list.service";
import { ActionModule } from "app/main/component/action/action.module";
import { SelectBranchModule } from "app/main/component/select-branch/select-branch.module";
import { SelectDepartmentModule } from "app/main/component/select-department/select-department.module";
import { SelectPositionModule } from "app/main/component/select-position/select-position.module";

const routes: Routes = [
  {
    path: "list",
    component: EmployeeComponent,
    // resolve: {
    //   bls: EmployeeService,
    // },
    data: { animation: "EmployeeComponent" },
  },
];

@NgModule({
  declarations: [EmployeeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    TableModule,
    ActionModule,
    SelectBranchModule,
    SelectDepartmentModule,
    SelectPositionModule,
    NgSelectModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
  ],
  providers: [
    EmployeeService,
    DepartmentService,
    PositionService,
    BranchService,
    AccountListService,
  ],
})
export class EmployeeModule { }
