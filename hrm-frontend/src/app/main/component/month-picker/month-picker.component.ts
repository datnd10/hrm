import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-month-picker',
  templateUrl: './month-picker.component.html',
  styleUrls: ['./month-picker.component.scss']
})
export class MonthPickerComponent {

  @Input() selectedMonthYear: Date | null = null;
  @Input() disabled: boolean = false;
  @Output() onMonthSelect = new EventEmitter<Date>();

  isMonthPickerOpen: boolean = false;
  currentYear: number = new Date().getFullYear();
  months: string[] = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const monthPicker = document.querySelector('.month-picker-overlay');

    // Nếu click nằm ngoài month-picker và không phải input mở picker
    if (this.isMonthPickerOpen && monthPicker && !monthPicker.contains(target) && !target.closest('.input-group')) {
      this.closeMonthPicker();
    }
  }

  openMonthPicker() {
    this.isMonthPickerOpen = true;
  }

  closeMonthPicker() {
    this.isMonthPickerOpen = false;
  }

  selectMonth(month: string) {
    const monthIndex = this.months.indexOf(month);
    const newDate = new Date(this.currentYear, monthIndex, 1);
    this.selectedMonthYear = newDate;
    this.onMonthSelect.emit(newDate);
    this.closeMonthPicker();
  }

  changeYear(direction: number) {
    this.currentYear += direction;
  }

  clearMonthPicker() {
    this.selectedMonthYear = null; // Xóa giá trị đã chọn
    this.onMonthSelect.emit(null);
    this.closeMonthPicker();
  }


}
