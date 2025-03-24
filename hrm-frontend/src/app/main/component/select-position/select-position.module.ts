import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectPositionComponent } from './select-position.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreCommonModule } from '@core/common.module';
import { SelectBranchModule } from '../select-branch/select-branch.module';
import { SelectDepartmentModule } from '../select-department/select-department.module';



@NgModule({
  declarations: [SelectPositionComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    CoreCommonModule,
    SelectBranchModule,
    SelectDepartmentModule
  ],
  exports: [SelectPositionComponent]
})
export class SelectPositionModule { }
