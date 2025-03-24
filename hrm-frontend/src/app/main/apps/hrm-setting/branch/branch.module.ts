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
import { BranchComponent } from "./branch.component";
import { BranchService } from "./branch.service";
import { TableComponent } from "app/main/component/table/table.component";
import { TableModule } from "app/main/component/table/table.module";
import { ActionModule } from "app/main/component/action/action.module";

// routing
const routes: Routes = [
  {
    path: "list",
    component: BranchComponent,
    // resolve: {
    //   bls: BranchService,
    // },
    data: { animation: "BranchComponent" },
  },
];

@NgModule({
  declarations: [BranchComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TableModule,
    ActionModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
  ],
  providers: [BranchService],
})
export class BranchModule {}
