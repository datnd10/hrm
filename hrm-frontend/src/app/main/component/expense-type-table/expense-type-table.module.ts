import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseTypeTableComponent } from './expense-type-table.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TableModule } from '../table/table.module';
import { ActionModule } from '../action/action.module';
import { CurrencyFormatModule } from 'app/directive/currency-format/currency-format.module';
import { CoreCommonModule } from '@core/common.module';



@NgModule({
  declarations: [ExpenseTypeTableComponent],
  imports: [
    CommonModule,
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TableModule,
    ActionModule,
    CurrencyFormatModule,
  ],
  exports: [
    ExpenseTypeTableComponent
  ]
})
export class ExpenseTypeTableModule { }
