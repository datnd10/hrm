import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectEmployeeComponent } from './select-employee.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreCommonModule } from '@core/common.module';
import { SelectBranchModule } from '../select-branch/select-branch.module';
import { SelectDepartmentModule } from '../select-department/select-department.module';
import { SelectPositionModule } from '../select-position/select-position.module';



@NgModule({
  declarations: [SelectEmployeeComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    CoreCommonModule,
    SelectBranchModule,
    SelectDepartmentModule,
    SelectPositionModule
  ],
  exports: [SelectEmployeeComponent]
})
export class SelectEmployeeModule { }
