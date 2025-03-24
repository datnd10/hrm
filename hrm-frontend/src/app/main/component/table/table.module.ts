import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { TableComponent } from './table.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [TableComponent],
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule
  ],
  exports: [TableComponent]
})
export class TableModule { }
