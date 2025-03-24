import { NgModule } from "@angular/core";
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
import { TableModule } from "app/main/component/table/table.module";
import { DepartmentService } from "../../hrm-setting/department/department.service";
import { BranchService } from "../../hrm-setting/branch/branch.service";
import { EmployeeService } from "../../hrm-setting/employee/employee.service";
import { TreeTableModule } from "primeng/treetable";
import { ExpenseTypeService } from "../expense-type/expense-type.service";
import { SalaryCostsComponent } from "./salary-costs.component";
import { SalaryCostsService } from "./salary-costs.service";
import { ExpenseService } from "../expense/expense.service";
import { ActionModule } from "app/main/component/action/action.module";
import { MonthPickerModule } from "app/main/component/month-picker/month-picker.module";
import { SelectBranchModule } from "app/main/component/select-branch/select-branch.module";
import { SelectDepartmentModule } from "app/main/component/select-department/select-department.module";
import { SelectEmployeeModule } from "app/main/component/select-employee/select-employee.module";
import { ExpenseTypeTableModule } from "app/main/component/expense-type-table/expense-type-table.module";
import { CurrencyFormatModule } from "app/directive/currency-format/currency-format.module";


const routes: Routes = [
  {
    path: "list",
    component: SalaryCostsComponent,
    // resolve: {
    //   bls: SalaryCostsComponent,
    // },
    data: { animation: "SalaryCostsComponent" },
  },
];
@NgModule({
  declarations: [SalaryCostsComponent],
  imports: [
    CoreCommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    ActionModule,
    CurrencyFormatModule,
    SelectBranchModule,
    SelectDepartmentModule,
    SelectEmployeeModule,
    MonthPickerModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
    TableModule,
    TreeTableModule,
    ExpenseTypeTableModule
  ],
  providers: [
    SalaryCostsService,
    DepartmentService,
    BranchService,
    EmployeeService,
    ExpenseTypeService,
    ExpenseService,
  ],
})
export class SalaryCostsModule { }
