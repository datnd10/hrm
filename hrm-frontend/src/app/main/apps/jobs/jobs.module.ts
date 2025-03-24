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
import { TableModule } from "app/main/component/table/table.module";
import { TreeTableModule } from "primeng/treetable";
import { JobsComponent } from "./jobs.component";
import { ActionModule } from "app/main/component/action/action.module";
import { JobsService } from "./jobs.service";

// routing
const routes: Routes = [
  {
    path: "list",
    component: JobsComponent,
    data: { animation: "JobsComponent" },
  },
];

@NgModule({
  declarations: [JobsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TableModule,
    Ng2FlatpickrModule,
    NgxDatatableModule,
    ActionModule,
    CorePipesModule,
    CoreDirectivesModule,
    CoreSidebarModule,
    TreeTableModule,
  ],
  providers: [JobsService],
})
export class JobsModule {}
