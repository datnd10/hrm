import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectDepartmentComponent } from './select-department.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreCommonModule } from '@core/common.module';
import { SelectBranchModule } from '../select-branch/select-branch.module';



@NgModule({
  declarations: [SelectDepartmentComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    CoreCommonModule,
    SelectBranchModule
  ],
  exports: [SelectDepartmentComponent]
})
export class SelectDepartmentModule { }
