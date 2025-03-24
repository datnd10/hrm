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
import { PositionComponent } from "./position.component";
import { BranchService } from "../branch/branch.service";
import { TableComponent } from "app/main/component/table/table.component";
import { TableModule } from "app/main/component/table/table.module";
import { PositionService } from "./position.service";
import { DepartmentService } from "../department/department.service";
import { ActionModule } from "app/main/component/action/action.module";
import { SelectBranchModule } from "app/main/component/select-branch/select-branch.module";
import { SelectDepartmentModule } from "app/main/component/select-department/select-department.module";

// routing
const routes: Routes = [
  {
    path: "list",
    component: PositionComponent,
    // resolve: {
    //   bls: PositionService,
    // },
    data: { animation: "PositionComponent" },
  },
];

@NgModule({
  declarations: [PositionComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    SelectBranchModule,
    SelectDepartmentModule,
    NgSelectModule,
    TableModule,
    ActionModule,
    CommonModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
  ],
  providers: [PositionService, DepartmentService, BranchService],
})
export class PositionModule { }
