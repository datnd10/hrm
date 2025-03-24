import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgxDatatableModule } from "@swimlane/ngx-datatable";

import { CoreCommonModule } from "@core/common.module";
import { CoreDirectivesModule } from "@core/directives/directives";
import { CorePipesModule } from "@core/pipes/pipes.module";
import { CoreSidebarModule } from "@core/components";

import { Ng2FlatpickrModule } from "ng2-flatpickr";
import { AccountPermissionTypeService } from "./account-permission-type.service";
import { AccountPermissionTypeComponent } from "./account-permission-type.component";
import { BranchService } from "../../hrm-setting/branch/branch.service";
import { TableModule } from "app/main/component/table/table.module";

const routes: Routes = [
  {
    path: "list",
    component: AccountPermissionTypeComponent,
    data: { animation: "account-permission-type" },
  },
];
@NgModule({
  declarations: [AccountPermissionTypeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    NgSelectModule,
    CommonModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
    TableModule,
  ],
  providers: [AccountPermissionTypeService, BranchService],
})
export class AccountPermissionTypeModule {}
