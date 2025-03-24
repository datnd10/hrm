import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonthPickerComponent } from './month-picker.component';



@NgModule({
  declarations: [MonthPickerComponent],
  imports: [
    CommonModule
  ],
  exports: [MonthPickerComponent]
})
export class MonthPickerModule { }
