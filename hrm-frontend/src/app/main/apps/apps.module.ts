import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { FullCalendarModule } from "@fullcalendar/angular";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";

// routing
const routes: Routes = [
  {
    path: "branch",
    loadChildren: () =>
      import("./hrm-setting/branch/branch.module").then((m) => m.BranchModule),
  },
  {
    path: "department",
    loadChildren: () =>
      import("./hrm-setting/department/department.module").then(
        (m) => m.DepartmentModule
      ),
  },
  {
    path: "position",
    loadChildren: () =>
      import("./hrm-setting/position/position.module").then(
        (m) => m.PositionModule
      ),
  },
  {
    path: "employee",
    loadChildren: () =>
      import("./hrm-setting/employee/employee.module").then(
        (m) => m.EmployeeModule
      ),
  },
  {
    path: "contract",
    loadChildren: () =>
      import("./hrm-setting/contract/contract.module").then(
        (m) => m.ContractModule
      ),
  },
  {
    path: "account-detail",
    loadChildren: () =>
      import("./finance/account-detail/account-detail.module").then(
        (m) => m.AccountDetailModule
      ),
  },

  // path finance
  {
    path: "account-list",
    loadChildren: () =>
      import("./finance/account-list/account-list.module").then(
        (m) => m.AccountListModule
      ),
  },

  {
    path: "expense-type",
    loadChildren: () =>
      import("./finance/expense-type/expense-type.module").then(
        (m) => m.ExpenseTypeModule
      ),
  },

  {
    path: "expense",
    loadChildren: () =>
      import("./finance/expense/expense.module").then((m) => m.ExpenseModule),
  },
  {
    path: "salary-costs",
    loadChildren: () =>
      import("./finance/salary-costs/salary-costs.module").then(
        (m) => m.SalaryCostsModule
      ),
  },

  // path user&permission
  {
    path: "account-permission-type",
    loadChildren: () =>
      import(
        "./user-permission/account-permission-type/account-permission-type.module"
      ).then((m) => m.AccountPermissionTypeModule),
  },
  {
    path: "user",
    loadChildren: () =>
      import("./user-permission/user/user.module").then((m) => m.UserModule),
  },

  //path history jobs
  {
    path: "jobs",
    loadChildren: () => import("./jobs/jobs.module").then((m) => m.JobsModule),
  },
];

FullCalendarModule.registerPlugins([
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
]);

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [],
})
export class AppsModule {}
