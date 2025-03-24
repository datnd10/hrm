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
import { DepartmentService } from "./department.service";
import { BranchService } from "../branch/branch.service";
import { TreeTableModule } from "primeng/treetable";
import { DepartmentComponent } from "./department.component";
import { SelectBranchModule } from "app/main/component/select-branch/select-branch.module";

// routing
const routes: Routes = [
  {
    path: "list",
    component: DepartmentComponent,
    // resolve: {
    //   bls: DepartmentService,
    // },
    data: { animation: "DepartmentComponent" },
  },
];

@NgModule({
  declarations: [DepartmentComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    SelectBranchModule,
    NgSelectModule,
    CommonModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
    TreeTableModule,
  ],
  providers: [DepartmentService, BranchService],
})
export class DepartmentModule { }
