import {
  AbstractControl,
  FormArray,
  FormGroup,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms";

export function noFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentDate = new Date();
    const selectedDate = new Date(control.value);

    // Nếu giá trị của control lớn hơn ngày hiện tại, trả về lỗi
    if (selectedDate > currentDate) {
      return { futureDate: true }; // Tên lỗi là "futureDate"
    }

    return null; // Không có lỗi
  };
}

export function nonEmptyArrayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control instanceof FormArray && control.length === 0) {
      return { emptyArray: true }; // Return an error if the array is empty
    }
    return null; // Valid if not empty
  };
}

export function endDateAfterStartDateValidator(
  startDateControlName: string
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control || !control.parent) {
      return null; // Nếu không có control hoặc không có form group, không cần kiểm tra
    }

    const startDateControl = control.parent.get(startDateControlName);
    const endDate = control.value;
    const startDate = startDateControl ? startDateControl.value : null;

    if (!startDate || !endDate) {
      return null; // Nếu một trong hai giá trị không có, không cần kiểm tra
    }

    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();

    if (endDateTime <= startDateTime) {
      return { endDateBeforeStartDate: true }; // Lỗi nếu ngày kết thúc không sau ngày bắt đầu
    }

    return null; // Không có lỗi
  };
}

export function lessThanValidator(
  firstField: string,
  secondField: string
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formGroup = control as FormGroup;
    const firstValue = formGroup.get(firstField)?.value;
    const secondValue = formGroup.get(secondField)?.value;

    // Kiểm tra nếu firstValue không nhỏ hơn secondValue
    if (
      firstValue !== null &&
      secondValue !== null &&
      firstValue >= secondValue
    ) {
      return { lessThanError: true };
    }
    return null;
  };
}
