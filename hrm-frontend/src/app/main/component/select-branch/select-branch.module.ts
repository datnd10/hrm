import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectBranchComponent } from './select-branch.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CoreCommonModule } from '@core/common.module';



@NgModule({
  declarations: [SelectBranchComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    CoreCommonModule
  ],
  exports: [SelectBranchComponent]
})
export class SelectBranchModule { }
