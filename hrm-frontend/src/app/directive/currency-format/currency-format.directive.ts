import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appCurrencyFormat]', // Tên của directive dùng trong HTML
})
export class CurrencyFormatDirective {
  private rawValue: string = ''; // Lưu giá trị thực tế không định dạng

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;

    // Loại bỏ ký tự không phải số
    this.rawValue = input.value.replace(/[^0-9]/g, '');
    if (this.rawValue === '') {
      input.value = ''; // Nếu không có giá trị, để trống
      return;
    }
    // Định dạng giá trị để hiển thị
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(this.rawValue));
    // Gán lại giá trị đã định dạng vào input
    input.value = formatted;
  }

  @HostListener('blur', ['$event'])
  onBlur(): void {
    const input = this.el.nativeElement;

    // Khi mất focus, hiển thị theo định dạng tiền tệ
    if (this.rawValue) {
      input.value = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(this.rawValue));
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(): void {
    const input = this.el.nativeElement;

    // Khi focus, chỉ hiển thị giá trị không định dạng
    if (this.rawValue) {
      input.value = new Intl.NumberFormat('vi-VN').format(Number(this.rawValue));
    }
  }

  // Hàm trả về giá trị thực để lưu xuống database
  public getRawValue(): number {
    return Number(this.rawValue);
  }
}
